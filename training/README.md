# Guía de Entrenamiento Local para Qwen2.5-VL-3B-Instruct

Esta carpeta contiene las herramientas necesarias para entrenar (hacer *fine-tuning*) el modelo de visión-lenguaje **Qwen2.5-VL-3B-Instruct** en tu PC local usando **QLoRA**. Esto te permitirá enseñar al modelo a leer y estructurar exámenes del ICFES en JSON con precisión milimétrica sin gastar dinero en APIs de la nube.

---

## Paso 1: Requisitos de Software y Controladores

Para entrenar con éxito en Windows utilizando tu GPU NVIDIA, necesitas instalar los siguientes controladores:

1. **NVIDIA CUDA Toolkit:**
   * Descarga e instala **CUDA 12.1** (o superior) desde la web oficial de NVIDIA: [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads).
   * Verifica la instalación abriendo una terminal de Windows y escribiendo: `nvcc --version`.
2. **Miniconda:**
   * Descarga e instala **Miniconda** para gestionar tus entornos de Python aislados: [Miniconda](https://docs.conda.io/en/latest/miniconda.html).

---

## Paso 2: Crear el Entorno y Dependencias

Abre la terminal de **Anaconda Prompt** o tu terminal configurada y ejecuta los siguientes comandos paso a paso:

```bash
# 1. Crear entorno con Python 3.10 (versión ideal para librerías de Deep Learning)
conda create -n icfes-training python=3.10 -y

# 2. Activar entorno
conda activate icfes-training

# 3. Instalar PyTorch compatible con CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 4. Instalar librerías de Hugging Face y procesamiento
pip install transformers peft trl accelerate qwen-vl-utils pillow pymupdf bitsandbytes
```

---

## Paso 3: Preparar tu Dataset de Entrenamiento

El entrenamiento supervisado requiere que le enseñes al modelo ejemplos de exámenes reales y el JSON estructurado correcto esperado.

1. **Colocar archivos PDF:**
   * Coloca un PDF de prueba del ICFES en la raíz del proyecto (o varios PDFs dentro de la carpeta `training/data/inputs`).
2. **Generar plantillas de etiquetado:**
   * Ejecuta el script de preparación:
     ```bash
     python training/prepare_dataset.py
     ```
   * Esto hará lo siguiente:
     * Creará las carpetas `training/data/inputs` y `outputs`.
     * Renderizará cada página del PDF como una imagen `.jpg` en la carpeta `inputs/`.
     * Creará un archivo `.json` de plantilla vacío por cada página en la carpeta `outputs/` (por ejemplo: `mi_examen_pag_001.json`).
3. **Etiquetar tus datos (Muy importante):**
   * Abre los archivos `.json` generados en `training/data/outputs/` con VS Code u otro editor de código.
   * Rellena las preguntas con los enunciados, opciones y respuestas reales que aparecen en esa página del PDF.
   * Las páginas del PDF que **no** tengan preguntas o sean solo portadas/instrucciones, déjalas con el JSON por defecto (`"texto": "Enunciado de la pregunta aquí..."`) y el compilador las ignorará automáticamente para no confundir al modelo.
4. **Compilar dataset final:**
   * Vuelve a ejecutar: `python training/prepare_dataset.py`.
   * El script compilará todos los JSONs editados y generará el archivo `training/data/dataset.json`.

---

## Paso 4: Iniciar el Entrenamiento

Una vez que tengas tu dataset listo con al menos **20 o 30 ejemplos etiquetados**:

1. Lanza el script de entrenamiento:
   ```bash
   python training/finetune.py
   ```
2. **Qué hace este script:**
   * Carga el modelo `Qwen2.5-VL-3B-Instruct` comprimido en 4 bits para caber en GPUs estándar.
   * Aplica LoRA (Low-Rank Adaptation) inyectando parámetros entrenables en las capas de atención del modelo.
   * Ejecuta el entrenamiento durante 3 épocas. Verás los reportes del *loss* bajando poco a poco.
   * Al finalizar, guardará los pesos entrenados del adaptador LoRA en la carpeta `training/finetuned_qwen_3b/`.

---

## Paso 5: Fusión y Exportación del Modelo

El modelo entrenado consiste en el modelo base original + los adaptadores LoRA. Para cargarlo de forma independiente en tu servidor:

1. Ejecuta el script de fusión:
   ```bash
   python training/export_model.py
   ```
2. Esto unirá los adaptadores al modelo base y guardará el modelo entrenado autónomo completo en la carpeta **`training/merged_qwen_3b/`**.

---

## Paso 6: Ejecutar el Servidor de Inferencia Local

Una vez exportado tu modelo fusionado en `training/merged_qwen_3b/`, puedes iniciar el servidor FastAPI local para que la aplicación Angular lo consuma directamente de forma 100% offline y gratuita.

1. **Instalar dependencias del servidor:**
   Asegúrate de que tu entorno conda `icfes-training` está activo e instala las librerías necesarias para el servidor web:
   ```bash
   pip install fastapi uvicorn sse-starlette
   ```

2. **Iniciar el servidor local:**
   Ejecuta el script `local_server.py`:
   ```bash
   python training/local_server.py
   ```
   El servidor arrancará en `http://localhost:8000`. Al iniciar la primera petición que requiera inferencia, cargará automáticamente el modelo en tu GPU usando cuantización de 4 bits para asegurar que quepa sin problemas en la VRAM (RTX 4060 8GB).

3. **Verificar la integración en Angular:**
   El archivo `src/app/services/simulacro.service.ts` ya está configurado para apuntar a `http://localhost:8000/ocr`. Levanta la aplicación Angular con:
   ```bash
   npm run dev
   ```
   Cuando subas un archivo PDF en el panel del docente, verás la barra de progreso avanzando página a página en tiempo real gracias al streaming SSE (Server-Sent Events) del servidor local.

