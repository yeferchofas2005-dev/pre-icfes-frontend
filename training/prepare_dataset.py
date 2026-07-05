import os
import io
import json
import base64
import fitz  # PyMuPDF
from PIL import Image

# Sobrescribir la función print integrada para evitar errores de codificación en Windows
import builtins
def print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except UnicodeEncodeError:
        try:
            cleaned_args = [str(arg).encode('ascii', 'replace').decode('ascii') for arg in args]
            builtins.print(*cleaned_args, **kwargs)
        except Exception:
            pass

# Configuración de rutas
INPUT_DIR = "training/data/inputs"
OUTPUT_DIR = "training/data/outputs"
DATASET_PATH = "training/data/dataset.json"

def init_folders():
    os.makedirs(INPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Directorios creados:")
    print(f" - Imágenes de páginas: {INPUT_DIR}")
    print(f" - JSONs de referencia: {OUTPUT_DIR}")

def pdf_to_images(pdf_path):
    print(f"Procesando PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    for i in range(len(doc)):
        page = doc[i]
        # Renderizar la página a alta resolución (1.5x)
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        # Nombre de archivo
        file_id = f"{base_name}_pag_{i+1:03d}"
        img_path = os.path.join(INPUT_DIR, f"{file_id}.jpg")
        
        # Guardar imagen
        img.save(img_path, format="JPEG", quality=85)
        
        # Crear plantilla JSON si no existe
        json_path = os.path.join(OUTPUT_DIR, f"{file_id}.json")
        if not os.path.exists(json_path):
            template = [
                {
                    "texto": "Enunciado de la pregunta aquí...",
                    "opciones": [
                        "A. Opción A",
                        "B. Opción B",
                        "C. Opción C",
                        "D. Opción D"
                    ],
                    "respuestaCorrecta": "A",
                    "categoria": "Ciencias",
                    "tieneImagen": False
                }
            ]
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(template, f, indent=2, ensure_ascii=False)
            print(f"Creada plantilla: {json_path}")
        
    print(f"Finalizado. Se han extraído {len(doc)} páginas del PDF.")

def compile_dataset():
    print("Compilando dataset...")
    dataset = []
    
    # Buscar todos los JSON de salida que tengan su imagen correspondiente
    for json_file in sorted(os.listdir(OUTPUT_DIR)):
        if not json_file.endswith(".json"):
            continue
            
        file_id = os.path.splitext(json_file)[0]
        json_path = os.path.join(OUTPUT_DIR, json_file)
        img_path = os.path.join(INPUT_DIR, f"{file_id}.jpg")
        
        if not os.path.exists(img_path):
            print(f"Advertencia: No se encontró la imagen {img_path} para el archivo {json_path}")
            continue
            
        with open(json_path, "r", encoding="utf-8") as f:
            preguntas = json.load(f)
            
        # Verificar si la plantilla sigue intacta (no editada)
        if len(preguntas) == 1 and preguntas[0]["texto"] == "Enunciado de la pregunta aquí...":
            # Omitir del dataset final para no contaminar el entrenamiento
            continue
            
        # Convertir imagen a base64 (o guardar ruta local)
        # Para el entrenamiento en local, Hugging Face prefiere rutas de archivos.
        # Guardaremos el formato de chat estándar para Qwen-VL
        sample = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": f"file://{os.path.abspath(img_path)}"},
                        {
                            "type": "text", 
                            "text": (
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
                        }
                    ]
                },
                {
                    "role": "assistant",
                    "content": json.dumps(preguntas, ensure_ascii=False, indent=2)
                }
            ]
        }
        dataset.append(sample)
        
    with open(DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
        
    print(f"Dataset compilado con éxito en: {DATASET_PATH}")
    print(f"Total de ejemplos etiquetados para entrenamiento: {len(dataset)}")

if __name__ == "__main__":
    init_folders()
    
    # Buscar algún PDF en la raíz para auto-procesar como ayuda inicial
    pdfs = [f for f in os.listdir(".") if f.lower().endswith(".pdf")]
    if pdfs:
        pdf_to_images(pdfs[0])
    else:
        # Intentar buscar en la carpeta de entradas de entrenamiento
        inputs_pdfs = [os.path.join(INPUT_DIR, f) for f in os.listdir(INPUT_DIR) if f.lower().endswith(".pdf")]
        if inputs_pdfs:
            pdf_to_images(inputs_pdfs[0])
        else:
            print("\n[!] Consejo: Coloca un PDF de examen ICFES en la raíz del proyecto o en training/data/inputs/ y vuelve a ejecutar este script para extraer sus páginas automáticamente.")
        
    compile_dataset()
