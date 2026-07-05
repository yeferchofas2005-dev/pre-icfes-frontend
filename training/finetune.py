import os
import torch
import builtins
import pathlib

# Parchear open y pathlib.Path.read_text para usar utf-8 por defecto en Windows
# y evitar fallos de decodificación Unicode en trl y transformers.
original_open = builtins.open
def patched_open(*args, **kwargs):
    if 'encoding' not in kwargs:
        mode = kwargs.get('mode', args[1] if len(args) > 1 else 'r')
        if 'b' not in mode:
            kwargs['encoding'] = 'utf-8'
    return original_open(*args, **kwargs)
builtins.open = patched_open

original_read_text = pathlib.Path.read_text
def patched_read_text(self, encoding=None, errors=None):
    if encoding is None:
        encoding = 'utf-8'
    return original_read_text(self, encoding=encoding, errors=errors)
pathlib.Path.read_text = patched_read_text

# Parchear float8_e8m0fnu que no está disponible en PyTorch para Windows
if not hasattr(torch, "float8_e8m0fnu"):
    setattr(torch, "float8_e8m0fnu", torch.float32)
import json
from transformers import (
    Qwen2_5_VLForConditionalGeneration,
    AutoProcessor,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig
from datasets import Dataset
from qwen_vl_utils import process_vision_info

# Configuración de rutas
DATASET_PATH = "training/data/dataset.json"
OUTPUT_DIR = "training/finetuned_qwen_3b"

class QwenVLDataCollator:
    """
    Colador de datos personalizado para lotes pre-tokenizados de Qwen2.5-VL.
    """
    def __init__(self, processor):
        self.processor = processor

    def __call__(self, batch):
        def to_tensor(x):
            if isinstance(x, torch.Tensor):
                return x
            return torch.tensor(x)

        input_ids = [to_tensor(item["input_ids"]) for item in batch]
        attention_mask = [to_tensor(item["attention_mask"]) for item in batch]
        labels = [to_tensor(item["labels"]) for item in batch]
        
        # Pad input_ids, labels y attention_mask
        pad_token_id = self.processor.tokenizer.pad_token_id if self.processor.tokenizer.pad_token_id is not None else 151643
        
        padded_input_ids = torch.nn.utils.rnn.pad_sequence(
            input_ids, batch_first=True, padding_value=pad_token_id
        )
        padded_attention_mask = torch.nn.utils.rnn.pad_sequence(
            attention_mask, batch_first=True, padding_value=0
        )
        padded_labels = torch.nn.utils.rnn.pad_sequence(
            labels, batch_first=True, padding_value=-100
        )
        
        inputs = {
            "input_ids": padded_input_ids,
            "attention_mask": padded_attention_mask,
            "labels": padded_labels,
        }
        
        if "mm_token_type_ids" in batch[0]:
            mm_token_type_ids = [to_tensor(item["mm_token_type_ids"]) for item in batch]
            inputs["mm_token_type_ids"] = torch.nn.utils.rnn.pad_sequence(
                mm_token_type_ids, batch_first=True, padding_value=0
            )
        
        # Concatenar características visuales si están presentes
        if "pixel_values" in batch[0]:
            inputs["pixel_values"] = torch.concat([to_tensor(item["pixel_values"]) for item in batch], dim=0)
        if "image_grid_thw" in batch[0]:
            inputs["image_grid_thw"] = torch.concat([to_tensor(item["image_grid_thw"]) for item in batch], dim=0)
            
        return inputs

def main():
    if not os.path.exists(DATASET_PATH):
        print(f"Error: No se encontró el dataset en {DATASET_PATH}")
        print("Ejecuta 'python training/prepare_dataset.py' primero para generar tu dataset.")
        return
        
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset_list = json.load(f)
        
    if len(dataset_list) == 0:
        print("Error: El dataset está vacío. Por favor, edita los archivos JSON en 'training/data/outputs/'")
        print("con enunciados reales para que el script de preparación los compile.")
        return
        
    print(f"Cargando dataset con {len(dataset_list)} ejemplos de entrenamiento...")
    # Homogeneizar la estructura de mensajes y limpiar rutas de imágenes para PyArrow y torchvision
    for item in dataset_list:
        for msg in item["messages"]:
            # Convertir string de respuesta del asistente a lista estructurada
            if isinstance(msg["content"], str):
                msg["content"] = [{"type": "text", "text": msg["content"]}]
            # Remover el prefijo file:// de las imágenes
            elif isinstance(msg["content"], list):
                for content_item in msg["content"]:
                    if content_item.get("type") == "image" and isinstance(content_item.get("image"), str):
                        content_item["image"] = content_item["image"].replace("file://", "")
    raw_dataset = Dataset.from_list(dataset_list)
    
    model_id = "Qwen/Qwen2.5-VL-3B-Instruct"
    print(f"Cargando procesador para pre-tokenización: {model_id}...")
    min_pixels = 256 * 28 * 28
    max_pixels = 512 * 28 * 28
    processor = AutoProcessor.from_pretrained(model_id, min_pixels=min_pixels, max_pixels=max_pixels)
    
    # Pre-tokenizar el dataset en memoria para evitar el bug de StopIteration en el mapeo de SFTTrainer
    print("Pre-tokenizando el dataset en memoria...")
    def preprocess_function(example):
        import copy
        # Copiar para no mutar el dataset original
        messages = copy.deepcopy(example["messages"])
        
        # Eliminar las claves con valor None (como 'image: None' o 'video: None' inyectados por PyArrow)
        for msg in messages:
            if isinstance(msg["content"], list):
                for ele in msg["content"]:
                    if isinstance(ele, dict):
                        for key in list(ele.keys()):
                            if ele[key] is None:
                                del ele[key]
                                
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
        image_inputs, video_inputs = process_vision_info(messages)
        
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=False,
            return_tensors="pt"
        )
        
        # Squeeze solo las dimensiones de lote para tensores a nivel de secuencia (1D)
        squeezed_inputs = {}
        for k, v in inputs.items():
            if k in ["input_ids", "attention_mask", "mm_token_type_ids"]:
                squeezed_inputs[k] = v[0]
            else:
                squeezed_inputs[k] = v
        squeezed_inputs["labels"] = squeezed_inputs["input_ids"].clone()
        return squeezed_inputs
        
    dataset = raw_dataset.map(preprocess_function, remove_columns=raw_dataset.column_names)
    print("Pre-tokenización completada con éxito.")
    
    # 1. Configuración de Cuantización de 4 bits para ahorrar VRAM (QLoRA)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    )
    
    print(f"Cargando modelo base: {model_id}...")
    # Cargar modelo con cuantización
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    )
    
    # Preparar el modelo para entrenamiento en precisión de K-bits
    model = prepare_model_for_kbit_training(model)
    model.gradient_checkpointing_enable()  # Ahorrar VRAM en retropropagación
    
    # 2. Configuración de LoRA
    # Indicamos los target modules específicos del modelo de atención de Qwen2.5-VL
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    print("Aplicando adaptadores LoRA al modelo...")
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # 3. Argumentos de Entrenamiento
    training_args = SFTConfig(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=1,  # Ajustar a 2 o 4 si tienes mucha VRAM (>16GB)
        gradient_accumulation_steps=4,  # Lote virtual total de size 4
        learning_rate=2e-4,
        logging_steps=1,
        num_train_epochs=3,  # 3 épocas suelen ser suficientes para adaptadores LoRA
        bf16=torch.cuda.is_bf16_supported(),
        fp16=not torch.cuda.is_bf16_supported(),
        save_strategy="no",
        optim="paged_adamw_8bit",  # Optimizador optimizado para VRAM
        report_to="none",  # Cambiar a 'tensorboard' o 'wandb' si deseas reportar logs
        remove_unused_columns=False,
        max_length=2048,
        dataset_num_proc=1,
    )
    
    # Colador para procesar imágenes y texto en lotes
    data_collator = QwenVLDataCollator(processor)
    
    # 4. Inicializar Entrenador
    print("Iniciando el entrenador SFT (Supervised Fine-Tuning)...")
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        data_collator=data_collator,
        args=training_args,
    )
    
    # Comenzar entrenamiento
    print("¡Comenzando entrenamiento! Esto tardará dependiendo del tamaño de tu dataset y tu GPU...")
    trainer.train()
    
    # Guardar el modelo entrenado
    print(f"Guardando adaptador LoRA final en {OUTPUT_DIR}...")
    trainer.model.save_pretrained(OUTPUT_DIR)
    processor.save_pretrained(OUTPUT_DIR)
    print("¡Entrenamiento completado exitosamente!")

if __name__ == "__main__":
    main()
