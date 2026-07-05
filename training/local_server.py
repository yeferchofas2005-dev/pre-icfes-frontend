import os
import torch

# Patch torch float8 bug on Windows
if not hasattr(torch, "float8_e8m0fnu"):
    setattr(torch, "float8_e8m0fnu", torch.float32)

import json
import base64
import asyncio
import io
import re
import fitz  # PyMuPDF
from PIL import Image
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
from qwen_vl_utils import process_vision_info

app = FastAPI(title="Pre-ICFES VLM Inference Server")

# Allow CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local usage, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and processor
model = None
processor = None
MODEL_DIR = "training/merged_qwen_3b"
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

def load_model_if_needed():
    global model, processor
    if model is not None:
        return

    if not os.path.exists(MODEL_DIR):
        raise HTTPException(
            status_code=500,
            detail=f"El modelo fusionado no se encuentra en {MODEL_DIR}. Asegúrate de completar el entrenamiento y fusión primero."
        )

    print("Cargando procesador...")
    processor = AutoProcessor.from_pretrained(MODEL_DIR)

    print("Cargando modelo...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    if device == "cuda":
        # Usar 4-bit para ahorrar VRAM en la GPU de 8GB
        print("Cargando modelo en GPU con cuantización de 4 bits...")
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
    else:
        print("Cargando modelo en CPU (precisión float32)...")
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            MODEL_DIR,
            device_map="cpu",
            torch_dtype=torch.float32
        )
    print("Modelo cargado con éxito.")

def clean_json_output(text: str):
    # Intentar extraer el bloque de json si viene envuelto en markdown
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    else:
        match_arr = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
        if match_arr:
            text = match_arr.group(0)
    
    text = text.strip()
    try:
        return json.loads(text)
    except Exception as e:
        print(f"Error parseando JSON: {e}. Texto original: {text}")
        return []

def run_inference_on_image(image: Image.Image) -> list:
    load_model_if_needed()
    
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
    
    # Mover a GPU si está disponible
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        inputs = inputs.to("cuda")

    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=2048)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]
        
    return clean_json_output(output_text)

@app.post("/ocr")
async def handle_ocr(request: Request):
    data = await request.json()
    action = data.get("action")
    
    if action == "process_chat":
        # Chat refinement process
        message = data.get("message", "")
        preguntas = data.get("preguntas", [])
        
        load_model_if_needed()
        
        # Formular una instrucción de chat para el modelo de visión/lenguaje
        chat_prompt = (
            f"El usuario quiere modificar una lista de preguntas de exámenes ICFES.\n"
            f"Instrucción del usuario: \"{message}\"\n\n"
            f"Preguntas actuales en formato JSON:\n{json.dumps(preguntas, ensure_ascii=False, indent=2)}\n\n"
            f"Modifica el JSON de las preguntas anteriores basándote en la instrucción del usuario.\n"
            f"Devuelve obligatoriamente un objeto JSON con dos claves:\n"
            f"1. \"respuesta\": Explicación textual breve de los cambios realizados en español.\n"
            f"2. \"preguntas\": El array JSON completo de preguntas modificadas con la misma estructura (texto, opciones, categoria, tieneImagen).\n\n"
            f"REGLA CRÍTICA: Devuelve exclusivamente el objeto JSON puro sin explicaciones fuera del JSON."
        )
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": chat_prompt}
                ]
            }
        ]
        
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = processor(text=[text], padding=True, return_tensors="pt")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            inputs = inputs.to("cuda")

        with torch.no_grad():
            generated_ids = model.generate(**inputs, max_new_tokens=2048)
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            
        # Parse output
        # Intentar extraer el bloque de json
        match = re.search(r"```json\s*(.*?)\s*```", output_text, re.DOTALL)
        if match:
            output_text = match.group(1)
        else:
            match_obj = re.search(r"\{\s*\"respuesta\".*\}", output_text, re.DOTALL)
            if match_obj:
                output_text = match_obj.group(0)
                
        try:
            parsed = json.loads(output_text.strip())
            return {"success": True, "preguntas": parsed}
        except Exception as e:
            print(f"Error parseando chat: {e}. Respuesta: {output_text}")
            return {
                "success": True, 
                "preguntas": {
                    "respuesta": f"Se procesó la solicitud pero hubo un problema estructurando la respuesta: {e}",
                    "preguntas": preguntas
                }
            }
            
    elif action == "process_pdf":
        pdf_base64 = data.get("pdfBase64", "")
        if not pdf_base64:
            raise HTTPException(status_code=400, detail="pdfBase64 es requerido")
            
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF inválido o corrupto: {e}")
            
        all_questions = []
        num_pages = len(doc)
        
        for page_num in range(num_pages):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_data = pix.tobytes("jpeg")
            image = Image.open(io.BytesIO(img_data))
            
            # Ejecutar modelo
            questions = run_inference_on_image(image)
            # Asignar IDs incrementales
            for q in questions:
                q["id"] = len(all_questions) + 1
                all_questions.append(q)
                
        return {"success": True, "preguntas": all_questions}
        
    else:
        raise HTTPException(status_code=400, detail=f"Acción no soportada: {action}")

@app.post("/ocr/stream")
async def handle_ocr_stream(request: Request):
    data = await request.json()
    pdf_base64 = data.get("pdfBase64", "")
    if not pdf_base64:
        raise HTTPException(status_code=400, detail="pdfBase64 es requerido")
        
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF inválido o corrupto: {e}")

    async def event_generator():
        num_pages = len(doc)
        all_questions = []
        
        # 1. Enviar estado de inicio
        yield {
            "data": json.dumps({
                "progress": 5,
                "status": f"Iniciando procesamiento de PDF ({num_pages} páginas)..."
            }, ensure_ascii=False)
        }
        await asyncio.sleep(0.1)
        
        for page_num in range(num_pages):
            page_idx = page_num + 1
            progress_val = int(5 + (page_num / num_pages) * 90)
            
            yield {
                "data": json.dumps({
                    "progress": progress_val,
                    "status": f"Procesando y extrayendo preguntas de la página {page_idx} de {num_pages}..."
                }, ensure_ascii=False)
            }
            
            try:
                # Renderizar página
                page = doc.load_page(page_num)
                pix = page.get_pixmap(dpi=150)
                img_data = pix.tobytes("jpeg")
                image = Image.open(io.BytesIO(img_data))
                
                # Ejecutar inferencia en un hilo separado para no bloquear el loop de eventos asíncronos
                loop = asyncio.get_running_loop()
                questions = await loop.run_in_executor(None, run_inference_on_image, image)
                
                # Asignar IDs incrementales
                for q in questions:
                    q["id"] = len(all_questions) + 1
                    all_questions.append(q)
                    
            except Exception as e:
                print(f"Error procesando página {page_idx}: {e}")
                # Continuar con la siguiente página
                
            await asyncio.sleep(0.1)
            
        # Enviar resultado final
        yield {
            "data": json.dumps({
                "progress": 100,
                "status": f"¡Extracción completada! Se encontraron {len(all_questions)} preguntas.",
                "preguntas": all_questions
            }, ensure_ascii=False)
        }

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("local_server:app", host="0.0.0.0", port=8000, reload=False)
