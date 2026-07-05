import os
import torch
import time
import sys

# Configure sys.stdout and sys.stderr to use UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Patch torch float8 bug on Windows
if not hasattr(torch, "float8_e8m0fnu"):
    setattr(torch, "float8_e8m0fnu", torch.float32)

from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
from qwen_vl_utils import process_vision_info
from PIL import Image

MODEL_DIR = "training/merged_qwen_3b"
IMAGE_PATH = "training/data/inputs/Cuadernillo_pensamiento_cientí́fico_Cuadernillo_de_preguntas_pensamiento_cientifico_saber_pro_2018_pag_001.jpg"
if not os.path.exists(IMAGE_PATH):
    # Try with a simpler ASCII name or find the first jpg file in inputs
    inputs_dir = "training/data/inputs"
    jpgs = [f for f in os.listdir(inputs_dir) if f.endswith(".jpg")]
    if jpgs:
        IMAGE_PATH = os.path.join(inputs_dir, jpgs[0])

PROMPT = (
    "Analiza la imagen de esta página del cuadernillo ICFES de Colombia (Pruebas Saber).\n"
    "Identifica todas las preguntas de selección múltiple presentes en la página y extrae sus datos.\n"
    "Devuelve obligatoriamente un array JSON donde cada objeto represente una pregunta con la estructura exacta:\n"
    "[\n"
    "  {\n"
    "    \"texto\": \"[Enunciado completo, incluyendo contextos]\",\n"
    "    \"opciones\": [\n"
    "      \"A. [opción A]\",\n"
    "      \"B. [opción B]\",\n"
    "      \"C. [opción C]\",\n"
    "      \"D. [opción D]\"\n"
    "    ],\n"
    "    \"categoria\": \"[Ciencias, Matemáticas, Lectura, Sociales o Inglés]\",\n"
    "    \"tieneImagen\": [true si tiene diagramas, false si no]\n"
    "  }\n"
    "]\n"
    "REGLA CRÍTICA: Devuelve exclusivamente el array de objetos JSON puro."
)

def main():
    print(f"Loading processor from {MODEL_DIR}...")
    processor = AutoProcessor.from_pretrained(
        MODEL_DIR, 
        min_pixels=256*28*28, 
        max_pixels=512*28*28
    )

    print("Loading model in 4-bit...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16
    )
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        MODEL_DIR,
        quantization_config=bnb_config,
        device_map="auto"
    )

    print(f"Loading test image from {IMAGE_PATH}...")
    image = Image.open(IMAGE_PATH)

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": PROMPT}
            ]
        }
    ]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)

    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt"
    )

    inputs = inputs.to("cuda")

    print("Running inference (greedy, no penalty)...")
    start_time = time.time()
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=512)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]
    elapsed = time.time() - start_time
    print(f"Time taken: {elapsed:.2f} seconds")
    print(f"Generated text:\n{output_text}\n")
    print("-" * 50)

    print("Running inference (repetition penalty = 1.15, max_new_tokens = 512)...")
    start_time = time.time()
    with torch.no_grad():
        generated_ids = model.generate(
            **inputs, 
            max_new_tokens=512, 
            repetition_penalty=1.15
        )
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text_penalty = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]
    elapsed = time.time() - start_time
    print(f"Time taken with penalty: {elapsed:.2f} seconds")
    print(f"Generated text with penalty:\n{output_text_penalty}\n")

if __name__ == "__main__":
    main()
