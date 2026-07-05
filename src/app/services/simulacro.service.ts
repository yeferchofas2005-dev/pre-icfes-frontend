import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface Pregunta {
  id: number;
  texto: string;
  opciones: string[]; // [A, B, C, D]
  respuestaCorrecta: string; // 'A' | 'B' | 'C' | 'D'
  categoria: string; // 'Ciencias' | 'Matemáticas' | 'Lectura' | 'Sociales' | 'Inglés'
  tieneImagen?: boolean;
  c1DottedPath?: string;
  c1SolidPath?: string;
}

export interface Simulacro {
  id: number;
  nombre: string;
  fecha: string;
  estado: 'Realizado' | 'No realizado' | 'Pendiente';
  puntaje: number | null;
  preguntas: Pregunta[];
}

export interface EstudianteReporte {
  id: number;
  nombre: string;
  correo: string;
  promedio: number;
  tiempoPromedio: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimulacroService {
  // Lista inicial de simulacros para el estudiante
  private mockSimulacros: Simulacro[] = [
    {
      id: 1,
      nombre: 'Simulacro Saber 11° #1',
      fecha: '2026-01-10',
      estado: 'Realizado',
      puntaje: 452,
      preguntas: []
    },
    {
      id: 2,
      nombre: 'Simulacro Saber 11° #2',
      fecha: '2026-01-18',
      estado: 'Realizado',
      puntaje: 424,
      preguntas: []
    },
    {
      id: 3,
      nombre: 'Simulacro Saber 11° #3',
      fecha: '2026-01-25',
      estado: 'No realizado',
      puntaje: null,
      preguntas: [
        {
          id: 301,
          texto: 'Una planta requiere dióxido de carbono para realizar la fotosíntesis. Si se coloca en un ambiente hermético sin este gas:',
          opciones: [
            'A. La planta crecerá más rápido por la ausencia de tóxicos.',
            'B. La fotosíntesis se detendrá y la planta morirá gradualmente.',
            'C. Producirá más oxígeno para compensar la falta de carbono.',
            'D. Cambiará su metabolismo para respirar nitrógeno molecular.'
          ],
          respuestaCorrecta: 'B',
          categoria: 'Ciencias'
        },
        {
          id: 302,
          texto: '¿Cuál es la función principal de los glóbulos rojos en el torrente sanguíneo de los mamíferos?',
          opciones: [
            'A. Combatir bacterias y virus invasores.',
            'B. Coagular la sangre en caso de heridas externas.',
            'C. Transportar oxígeno desde los pulmones a los tejidos.',
            'D. Regular los niveles de glucosa en el páncreas.'
          ],
          respuestaCorrecta: 'C',
          categoria: 'Ciencias'
        }
      ]
    }
  ];

  // Estudiantes del profesor
  private mockEstudiantes: EstudianteReporte[] = [
    { id: 1, nombre: 'Juan Pérez', correo: 'juan@mail.com', promedio: 72, tiempoPromedio: '48s' },
    { id: 2, nombre: 'Ana Torres', correo: 'ana@mail.com', promedio: 65, tiempoPromedio: '55s' },
  ];

  // Materias y promedios del grupo (para el radar chart del docente)
  private mockRadarDocente = {
    ciencias: 68,
    matematicas: 75,
    lectura: 70,
    sociales: 64,
    ingles: 80
  };

  // BehaviorSubjects para reactividad
  private simulacrosSub = new BehaviorSubject<Simulacro[]>(this.mockSimulacros);
  private estudiantesSub = new BehaviorSubject<EstudianteReporte[]>(this.mockEstudiantes);
  private radarDocenteSub = new BehaviorSubject<typeof this.mockRadarDocente>(this.mockRadarDocente);

  // URL del Web App de Google Apps Script (Gemini OCR) o Backend local
  // Configura tu URL desplegada aquí para habilitar la extracción real por API
  private readonly GOOGLE_SCRIPT_URL_OCR = 'http://localhost:8000/ocr';

  constructor(private http: HttpClient) {}

  getSimulacros(): Observable<Simulacro[]> {
    return this.simulacrosSub.asObservable();
  }

  getEstudiantes(): Observable<EstudianteReporte[]> {
    return this.estudiantesSub.asObservable();
  }

  getRadarDocente(): Observable<typeof this.mockRadarDocente> {
    return this.radarDocenteSub.asObservable();
  }

  // Método para que el docente publique un nuevo simulacro desde el PDF
  publicarSimulacro(nombre: string, preguntas: Pregunta[]): void {
    const list = this.simulacrosSub.getValue();
    const nuevoSimulacro: Simulacro = {
      id: list.length + 1,
      nombre: nombre,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'No realizado',
      puntaje: null,
      preguntas: preguntas
    };

    const nuevaLista = [...list, nuevoSimulacro];
    this.simulacrosSub.next(nuevaLista);
  }

  // Método para que el estudiante complete un simulacro
  finalizarSimulacro(simulacroId: number, respuestasUsuario: { [preguntaId: number]: string }): number {
    const list = this.simulacrosSub.getValue();
    const simIndex = list.findIndex(s => s.id === simulacroId);
    
    if (simIndex === -1) return 0;

    const simulacro = list[simIndex];
    let correctas = 0;
    const total = simulacro.preguntas.length;

    simulacro.preguntas.forEach(pregunta => {
      const respUser = respuestasUsuario[pregunta.id];
      if (respUser === pregunta.respuestaCorrecta) {
        correctas++;
      }
    });

    // Calcular puntaje proporcional ICFES (100 - 500)
    let puntaje = 100; // base mínima
    if (total > 0) {
      puntaje = Math.round(100 + (correctas / total) * 400);
    }

    // Actualizar simulacro
    const simulacroActualizado: Simulacro = {
      ...simulacro,
      estado: 'Realizado',
      puntaje: puntaje
    };

    const nuevaLista = [...list];
    nuevaLista[simIndex] = simulacroActualizado;
    this.simulacrosSub.next(nuevaLista);

    // Actualizar estadísticas del grupo (Docente) dinámicamente
    // Simulamos que el promedio de ciencias sube tras una buena calificación del estudiante
    const radarActual = this.radarDocenteSub.getValue();
    const nuevoPromedioCiencias = Math.min(100, Math.round(radarActual.ciencias + (puntaje >= 400 ? 4 : -2)));
    
    this.radarDocenteSub.next({
      ...radarActual,
      ciencias: nuevoPromedioCiencias
    });

    // También actualizamos el reporte de promedios de estudiantes registrados
    const ests = this.estudiantesSub.getValue();
    const estsActualizados = ests.map(e => {
      if (e.id === 1) { // Simulamos que Juan Perez también avanza
        return { ...e, promedio: Math.round((e.promedio * 2 + (puntaje * 100 / 500)) / 3) };
      }
      return e;
    });
    this.estudiantesSub.next(estsActualizados);

    return puntaje;
  }

  // Método para realizar la extracción real de preguntas desde un PDF base64
  // conectándose a Google Apps Script / Gemini API
  importarPDF(nombreArchivo: string, base64Data: string): Observable<Pregunta[]> {
    if (!this.GOOGLE_SCRIPT_URL_OCR) {
      // Devolver error intencional si no está configurada la URL para disparar el fallback local
      return new Observable<Pregunta[]>(observer => {
        observer.error('URL de Google Apps Script no configurada. Usando fallback de prueba.');
      });
    }

    const payload = {
      action: 'process_pdf',
      fileName: nombreArchivo,
      pdfBase64: base64Data
    };

    return this.http.post<any>(this.GOOGLE_SCRIPT_URL_OCR, payload).pipe(
      map(res => {
        if (res && res.success && res.preguntas) {
          return res.preguntas as Pregunta[];
        }
        throw new Error(res?.message || 'Error al procesar el archivo en el servidor.');
      })
    );
  }

  // Método para realizar la extracción real de preguntas en streaming (Server-Sent Events)
  // con barra de progreso página por página en tiempo real
  importarPDFStream(
    nombreArchivo: string,
    base64Data: string,
    onProgress: (update: { progress: number; status: string }) => void
  ): Observable<Pregunta[]> {
    if (!this.GOOGLE_SCRIPT_URL_OCR) {
      return new Observable<Pregunta[]>(observer => {
        observer.error('URL de API no configurada para streaming.');
      });
    }

    return new Observable<Pregunta[]>(observer => {
      const payload = {
        action: 'process_pdf',
        fileName: nombreArchivo,
        pdfBase64: base64Data
      };

      // Si la URL es FastAPI local o un backend, mapeamos a su versión /stream
      let streamUrl = this.GOOGLE_SCRIPT_URL_OCR;
      if (streamUrl.endsWith('/ocr')) {
        streamUrl = streamUrl.replace(/\/ocr$/, '/ocr/stream');
      }

      fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error('No se pudo abrir el lector de stream en el cliente.');
        }

        let buffer = '';
        let finalQuestions: Pregunta[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Conservar fragmento incompleto

          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith('data:')) {
              try {
                const data = JSON.parse(cleaned.substring(5).trim());
                
                // Actualizar progreso
                if (data.progress !== undefined) {
                  onProgress({ progress: data.progress, status: data.status });
                }

                // Si incluye las preguntas finales, guardarlas
                if (data.preguntas && data.preguntas.length > 0) {
                  finalQuestions = data.preguntas;
                }
              } catch (e) {
                // Silenciar errores de parseo intermedios
              }
            }
          }
        }

        if (finalQuestions.length > 0) {
          observer.next(finalQuestions);
          observer.complete();
        } else {
          throw new Error('El stream finalizó sin retornar la lista de preguntas extraídas.');
        }
      })
      .catch(err => {
        observer.error(err);
      });
    });
  }

  // Verifica si la API real está configurada
  esApiConfigurada(): boolean {
    return this.GOOGLE_SCRIPT_URL_OCR.trim().length > 0;
  }

  // Método para procesar una instrucción de chat con Gemini API a través de Apps Script
  procesarChatIA(mensaje: string, preguntas: Pregunta[]): Observable<{ respuesta: string, preguntas: Pregunta[] }> {
    if (!this.GOOGLE_SCRIPT_URL_OCR) {
      return new Observable(observer => {
        observer.error('URL de Google Apps Script no configurada');
      });
    }

    const payload = {
      action: 'process_chat',
      message: mensaje,
      preguntas: preguntas
    };

    return this.http.post<any>(this.GOOGLE_SCRIPT_URL_OCR, payload).pipe(
      map(res => {
        if (res && res.success && res.preguntas) {
          // Retornar la respuesta en texto de Gemini y la nueva lista de preguntas
          return {
            respuesta: res.preguntas.respuesta || 'Instrucción procesada.',
            preguntas: res.preguntas.preguntas || preguntas
          };
        }
        // Intentar leer de res.preguntas directamente si Apps Script lo envolvió
        if (res && res.preguntas && res.preguntas.preguntas) {
          return {
            respuesta: res.preguntas.respuesta || 'Instrucción procesada.',
            preguntas: res.preguntas.preguntas
          };
        }
        throw new Error(res?.message || 'Error al procesar la instrucción en el servidor.');
      })
    );
  }
}

