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
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from peft import PeftModel

BASE_MODEL_ID = "Qwen/Qwen2.5-VL-3B-Instruct"
LORA_ADAPTER_DIR = "training/finetuned_qwen_3b"
MERGED_OUTPUT_DIR = "training/merged_qwen_3b"

def main():
    if not os.path.exists(LORA_ADAPTER_DIR):
        print(f"Error: No se encontró el adaptador LoRA en '{LORA_ADAPTER_DIR}'.")
        print("Asegúrate de haber completado el entrenamiento ejecutando 'python training/finetune.py'.")
        return
        
    print(f"1. Cargando modelo base en memoria: {BASE_MODEL_ID}...")
    # Cargamos en 16-bits para poder hacer la fusión de pesos
    base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        BASE_MODEL_ID,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="cpu"  # Hacemos la fusión en CPU para evitar consumir VRAM si la GPU está ocupada
    )
    
    processor = AutoProcessor.from_pretrained(LORA_ADAPTER_DIR)
    
    print(f"2. Cargando adaptador entrenado desde '{LORA_ADAPTER_DIR}'...")
    # Envolver el modelo base con el adaptador LoRA
    model = PeftModel.from_pretrained(base_model, LORA_ADAPTER_DIR)
    
    print("3. Fusionando pesos del LoRA en el modelo base (Merge)...")
    # Fusionar los pesos de LoRA con el modelo base y descargar el módulo PEFT
    merged_model = model.merge_and_unload()
    
    print(f"4. Guardando modelo fusionado completo en: {MERGED_OUTPUT_DIR}...")
    os.makedirs(MERGED_OUTPUT_DIR, exist_ok=True)
    merged_model.save_pretrained(MERGED_OUTPUT_DIR)
    processor.save_pretrained(MERGED_OUTPUT_DIR)
    
    print("\n¡Fusión completada con éxito!")
    print(f"El modelo completo ya está listo en: {MERGED_OUTPUT_DIR}")
    print("Ahora puedes usar este directorio para cargar tu modelo 100% offline o exportarlo a Ollama/GGUF.")

if __name__ == "__main__":
    main()
