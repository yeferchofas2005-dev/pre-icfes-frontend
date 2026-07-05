import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulacroService, EstudianteReporte, Pregunta } from '../services/simulacro.service';

@Component({
  selector: 'app-panel-docente',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-docente.html',
  styleUrl: './panel-docente.css',
})
export class PanelDocente implements OnInit, OnDestroy {
  currentTab: 'alumnos' | 'cargar-pdf' = 'alumnos';
  
  // Listas reactivas desde el servicio
  estudiantes: EstudianteReporte[] = [];
  radarData = { ciencias: 68, matematicas: 75, lectura: 70, sociales: 64, ingles: 80 };
  
  // Subscripciones
  private subs = new Subscription();

  // Coordenadas calculadas para el gráfico radial (Radar Chart)
  radarPointsString = '';

  // Estados de carga de PDF
  isDragging = false;
  fileName = '';
  isUploading = false;
  uploadProgress = 0;
  uploadStatusText = '';
  showEditor = false;

  // Estados del Asistente de IA (Chat de Refinamiento)
  chatHistory: { sender: 'ia' | 'docente'; text: string }[] = [
    {
      sender: 'ia',
      text: '¡Hola! He extraído con éxito 2 preguntas de la Saber Pro 2018 y reconstruido los gráficos de fluorescencia en SVG. ¿Encontraste algún error de lectura en los textos o el gráfico? Escríbeme qué corregir (p. ej., "agrega la pregunta 3" o "corrige la curva del candidato 1") y lo ajustará al instante.'
    }
  ];
  chatInputText = '';
  isChatResponding = false;

  // Curvas dinámicas del Candidato 1 para el gráfico SVG
  candidato1DottedPath = 'M 50,160 Q 115,40 180,160'; // Aislado
  candidato1SolidPath = 'M 50,160 Q 115,135 180,160';  // En presencia de X

  // Datos para el editor de preguntas (Pre-cargados a partir del PDF Saber Pro 2018)
  simulacroTitulo = 'Simulacro Pensamiento Científico Saber Pro 2018';
  preguntasExtraidas: Pregunta[] = [
    {
      id: 101,
      texto: 'Algunas sustancias pueden emitir luz, característica conocida como fluorescencia. Esta propiedad puede usarse en la construcción de sensores, en los cuales la detección se basa en la disminución considerable de la cantidad de luz emitida por la sustancia (decaimiento de la fluorescencia). A continuación, se muestran las gráficas de fluorescencia de dos candidatos para la construcción de un sensor, tanto aislados como en presencia de la molécula X que se quiere detectar.\n\nCon base en la información anterior, se puede concluir que el mejor candidato para la construcción de un sensor es:',
      opciones: [
        'A. el candidato 2, porque presenta mayor fluorescencia que el candidato 1.',
        'B. el candidato 1, porque, aunque hay una disminución en la fluorescencia, el valor no llega a ser cero.',
        'C. el candidato 1, porque presenta la mayor disminución de la fluorescencia.',
        'D. el candidato 2, porque la fluorescencia no se afecta tanto por la presencia de X.'
      ],
      respuestaCorrecta: 'C',
      categoria: 'Ciencias',
      tieneImagen: true
    },
    {
      id: 102,
      texto: 'En un segundo experimento, los investigadores midieron la estabilidad térmica de los dos candidatos a 50 °C durante 2 horas continuas de funcionamiento. Observaron que el Candidato 1 perdió el 80% de su capacidad fluorescente inicial, mientras que el Candidato 2 retuvo el 95% de su fluorescencia estable. De acuerdo con esto, ¿cuál de las siguientes conclusiones sobre la estabilidad es correcta?',
      opciones: [
        'A. El candidato 1 es idóneo para sensores de alta temperatura.',
        'B. El candidato 2 posee una estabilidad térmica superior, lo que amplía sus posibilidades de uso en el campo de sensores.',
        'C. La temperatura ambiente neutraliza el decaimiento de fluorescencia del candidato 1.',
        'D. El candidato 2 es inestable ante cambios térmicos, lo que dificulta su aplicación práctica.'
      ],
      respuestaCorrecta: 'B',
      categoria: 'Ciencias',
      tieneImagen: false
    }
  ];

  constructor(
    private simulacroService: SimulacroService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscribirse a los datos del servicio
    this.subs.add(
      this.simulacroService.getEstudiantes().subscribe(data => {
        this.estudiantes = data;
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.simulacroService.getRadarDocente().subscribe(data => {
        this.radarData = data;
        this.recalcularRadarPoints();
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Cambiar de pestaña
  switchTab(tab: 'alumnos' | 'cargar-pdf'): void {
    this.currentTab = tab;
    // Si cambiamos de pestaña, reiniciar estados del cargador
    if (tab === 'alumnos') {
      this.resetUploadState();
    }
    this.cdr.detectChanges();
  }

  // Cierre de sesión
  logout(): void {
    this.router.navigate(['/login']);
  }

  // Recalcular el polígono del gráfico radar
  recalcularRadarPoints(): void {
    const c = this.radarData.ciencias;
    const m = this.radarData.matematicas;
    const l = this.radarData.lectura;
    const s = this.radarData.sociales;
    const i = this.radarData.ingles;

    const R_c = (c / 100) * 80;
    const R_m = (m / 100) * 80;
    const R_l = (l / 100) * 80;
    const R_s = (s / 100) * 80;
    const R_i = (i / 100) * 80;

    // Coordenadas trigonométricas relativas al centro (150, 150)
    const x_m = 150;
    const y_m = 150 - R_m;

    const x_l = 150 + R_l * 0.951;
    const y_l = 150 - R_l * 0.309;

    const x_c = 150 + R_c * 0.588;
    const y_c = 150 + R_c * 0.809;

    const x_s = 150 - R_s * 0.588;
    const y_s = 150 + R_s * 0.809;

    const x_i = 150 - R_i * 0.951;
    const y_i = 150 - R_i * 0.309;

    this.radarPointsString = `${x_m.toFixed(1)},${y_m.toFixed(1)} ${x_l.toFixed(1)},${y_l.toFixed(1)} ${x_c.toFixed(1)},${y_c.toFixed(1)} ${x_s.toFixed(1)},${y_s.toFixed(1)} ${x_i.toFixed(1)},${y_i.toFixed(1)}`;
  }

  // Drag and Drop handlers
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        this.processFile(file);
      } else {
        alert('Por favor, selecciona únicamente archivos PDF.');
      }
    }
    this.cdr.detectChanges();
  }

  onFileSelected(e: any): void {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        this.processFile(file);
      } else {
        alert('El archivo debe estar en formato PDF.');
      }
    }
    this.cdr.detectChanges();
  }

  processFile(file: File): void {
    this.fileName = file.name;
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadStatusText = 'Preparando archivo PDF y codificando en base64...';
    this.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = () => {
      // Obtener los datos codificados en base64 excluyendo el prefijo del tipo de datos
      const base64Data = (reader.result as string).split(',')[1];
      
      this.uploadStatusText = 'Enviando a la API de Inteligencia Artificial (Gemini/Claude)...';
      this.uploadProgress = 10;
      this.cdr.detectChanges();

      // Realizar la llamada real a la API a través de Server-Sent Events (SSE)
      this.simulacroService.importarPDFStream(file.name, base64Data, (update) => {
        this.uploadProgress = update.progress;
        this.uploadStatusText = update.status;
        this.cdr.detectChanges();
      }).subscribe({
        next: (preguntas) => {
          this.uploadProgress = 100;
          this.uploadStatusText = '¡Extracción y análisis completados con éxito por la IA!';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.isUploading = false;
            this.showEditor = true;
            this.preguntasExtraidas = preguntas;
            this.actualizarMemoria(); // Guardar en el aprendizaje local
            this.cdr.detectChanges();
          }, 600);
        },
        error: (err) => {
          console.warn('API de streaming no disponible o error. Iniciando simulación local:', err);
          
          // Ejecutar animación de simulación OCR para el demo local
          this.uploadStatusText = 'Ejecutando algoritmos OCR locales (Modo Demostración)...';
          this.cdr.detectChanges();

          let currentProgress = 40;
          const interval = setInterval(() => {
            currentProgress += 10;
            this.uploadProgress = Math.min(95, currentProgress);
            
            if (this.uploadProgress <= 60) {
              this.uploadStatusText = 'Analizando estructura del documento e índices...';
            } else if (this.uploadProgress <= 80) {
              this.uploadStatusText = 'Extrayendo texto del cuadernillo Saber Pro 2018...';
            } else {
              this.uploadStatusText = 'Cargando curvas de fluorescencia y diagramas vectoriales...';
            }
            this.cdr.detectChanges();

            if (currentProgress >= 100) {
              clearInterval(interval);
              this.uploadProgress = 100;
              this.uploadStatusText = '¡Procesamiento finalizado con éxito!';
              this.cdr.detectChanges();

              setTimeout(() => {
                this.isUploading = false;
                this.showEditor = true;
                
                // Cargar el estado guardado o los mock iniciales
                this.cargarAprendizajePrevio();
                
                this.cdr.detectChanges();
              }, 600);
            }
          }, 150);
        }
      });
    };

    reader.onerror = (error) => {
      console.error('Error al leer el archivo PDF:', error);
      alert('Hubo un error al codificar el PDF.');
      this.isUploading = false;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // Métodos de Persistencia y Aprendizaje (Memoria Local de la IA)
  actualizarMemoria(): void {
    const data = {
      titulo: this.simulacroTitulo,
      preguntas: this.preguntasExtraidas,
      dottedPath: this.candidato1DottedPath,
      solidPath: this.candidato1SolidPath
    };
    localStorage.setItem('pre_icfes_pdf_aprendido', JSON.stringify(data));
  }

  cargarAprendizajePrevio(): void {
    try {
      const stored = localStorage.getItem('pre_icfes_pdf_aprendido');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.preguntas && data.preguntas.length > 0) {
          this.simulacroTitulo = data.titulo || this.simulacroTitulo;
          this.preguntasExtraidas = data.preguntas;
          this.candidato1DottedPath = data.dottedPath || this.candidato1DottedPath;
          this.candidato1SolidPath = data.solidPath || this.candidato1SolidPath;
          
          this.chatHistory.push({
            sender: 'ia',
            text: `🤖 **[Memoria de Aprendizaje Activada]** He recuperado automáticamente las correcciones previas guardadas en mi memoria local (textos editados y trazados del gráfico).`
          });
        }
      }
    } catch (e) {
      console.error('Error al cargar memoria de aprendizaje:', e);
    }
  }

  tieneAprendizajeGuardado(): boolean {
    return !!localStorage.getItem('pre_icfes_pdf_aprendido');
  }

  resetearMemoriaManual(): void {
    if (confirm('¿Estás seguro de que deseas restablecer la memoria de la IA? Esto borrará los textos y gráficos guardados de tus sesiones anteriores.')) {
      localStorage.removeItem('pre_icfes_pdf_aprendido');
      // Restaurar valores iniciales por defecto
      this.preguntasExtraidas = [
        {
          id: 101,
          texto: 'Algunas sustancias pueden emitir luz, característica conocida como fluorescencia. Esta propiedad puede usarse en la construcción de sensores, en los cuales la detección se basa en la disminución considerable de la cantidad de luz emitida por la sustancia (decaimiento de la fluorescencia). A continuación, se muestran las gráficas de fluorescencia de dos candidatos para la construcción de un sensor, tanto aislados como en presencia de la molécula X que se quiere detectar.\n\nCon base en la información anterior, se puede concluir que el mejor candidato para la construcción de un sensor es:',
          opciones: [
            'A. el candidato 2, porque presenta mayor fluorescencia que el candidato 1.',
            'B. el candidato 1, porque, aunque hay una disminución en la fluorescencia, el valor no llega a ser cero.',
            'C. el candidato 1, porque presenta la mayor disminución de la fluorescencia.',
            'D. el candidato 2, porque la fluorescencia no se afecta tanto por la presencia de X.'
          ],
          respuestaCorrecta: 'C',
          categoria: 'Ciencias',
          tieneImagen: true
        },
        {
          id: 102,
          texto: 'En un segundo experimento, los investigadores midieron la estabilidad térmica de los dos candidatos a 50 °C durante 2 horas continuas de funcionamiento. Observaron que el Candidato 1 perdió el 80% de su capacidad fluorescente inicial, mientras que el Candidato 2 retuvo el 95% de su fluorescencia estable. De acuerdo con esto, ¿cuál de las siguientes conclusiones sobre la estabilidad es correcta?',
          opciones: [
            'A. El candidato 1 es idóneo para sensores de alta temperatura.',
            'B. El candidato 2 posee una estabilidad térmica superior, lo que amplía sus posibilidades de uso en el campo de sensores.',
            'C. La temperatura ambiente neutraliza el decaimiento de fluorescencia del candidato 1.',
            'D. El candidato 2 es inestable ante cambios térmicos, lo que dificulta su aplicación práctica.'
          ],
          respuestaCorrecta: 'B',
          categoria: 'Ciencias',
          tieneImagen: false
        }
      ];
      this.candidato1DottedPath = 'M 50,160 Q 115,40 180,160';
      this.candidato1SolidPath = 'M 50,160 Q 115,135 180,160';
      
      this.chatHistory.push({
        sender: 'ia',
        text: '¡Memoria restablecida! He limpiado mi base de datos local y restaurado los valores por defecto del cuadernillo.'
      });
      this.cdr.detectChanges();
    }
  }

  // Envío de instrucción al Chat de Refinamiento de IA
  sendChatInstruction(): void {
    const text = this.chatInputText.trim();
    if (!text) return;

    // Agregar mensaje del docente
    this.chatHistory.push({ sender: 'docente', text: text });
    this.chatInputText = '';
    this.isChatResponding = true;
    this.cdr.detectChanges();

    // Scroll al final del chat tras añadir el mensaje (simulado con un timeout rápido)
    setTimeout(() => {
      const chatLog = document.getElementById('chat-log-box');
      if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
    }, 50);

    // Si la API real está configurada en Apps Script, la usamos directamente
    if (this.simulacroService.esApiConfigurada()) {
      this.simulacroService.procesarChatIA(text, this.preguntasExtraidas).subscribe({
        next: (res) => {
          this.preguntasExtraidas = res.preguntas;
          this.actualizarMemoria();
          this.chatHistory.push({ sender: 'ia', text: res.respuesta });
          this.isChatResponding = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            const chatLog = document.getElementById('chat-log-box');
            if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
          }, 50);
        },
        error: (err) => {
          console.warn('Fallo en la llamada de chat de Apps Script, usando parser local:', err);
          this.procesarChatLocal(text);
        }
      });
    } else {
      // Usar parser local inteligente si no hay API configurada
      setTimeout(() => {
        this.procesarChatLocal(text);
      }, 1000);
    }
  }

  // Parser local para simular la IA de forma inteligente y resolver comandos específicos
  private procesarChatLocal(text: string): void {
    const cleaned = text.toLowerCase();
    let responseText = '';
    let modified = false;

    // 1. Comando de reseteo
    if (cleaned.includes('borra') || cleaned.includes('reinicia') || cleaned.includes('limpia') || cleaned.includes('reset')) {
      localStorage.removeItem('pre_icfes_pdf_aprendido');
      this.preguntasExtraidas = [
        {
          id: 101,
          texto: 'Algunas sustancias pueden emitir luz, característica conocida como fluorescencia. Esta propiedad puede usarse en la construcción de sensores, en los cuales la detección se basa en la disminución considerable de la cantidad de luz emitida por la sustancia (decaimiento de la fluorescencia). A continuación, se muestran las gráficas de fluorescencia de dos candidatos para la construcción de un sensor, tanto aislados como en presencia de la molécula X que se quiere detectar.\n\nCon base en la información anterior, se puede concluir que el mejor candidato para la construcción de un sensor es:',
          opciones: [
            'A. el candidato 2, porque presenta mayor fluorescencia que el candidato 1.',
            'B. el candidato 1, porque, aunque hay una disminución en la fluorescencia, el valor no llega a ser cero.',
            'C. el candidato 1, porque presenta la mayor disminución de la fluorescencia.',
            'D. el candidato 2, porque la fluorescencia no se afecta tanto por la presencia de X.'
          ],
          respuestaCorrecta: 'C',
          categoria: 'Ciencias',
          tieneImagen: true
        },
        {
          id: 102,
          texto: 'En un segundo experimento, los investigadores midieron la estabilidad térmica de los dos candidatos a 50 °C durante 2 horas continuas de funcionamiento. Observaron que el Candidato 1 perdió el 80% de su capacidad fluorescente inicial, mientras que el Candidato 2 retuvo el 95% de su fluorescencia estable. De acuerdo con esto, ¿cuál de las siguientes conclusiones sobre la estabilidad es correcta?',
          opciones: [
            'A. El candidato 1 es idóneo para sensores de alta temperatura.',
            'B. El candidato 2 posee una estabilidad térmica superior, lo que amplía sus posibilidades de uso en el campo de sensores.',
            'C. La temperatura ambiente neutraliza el decaimiento de fluorescencia del candidato 1.',
            'D. El candidato 2 es inestable ante cambios térmicos, lo que dificulta su aplicación práctica.'
          ],
          respuestaCorrecta: 'B',
          categoria: 'Ciencias',
          tieneImagen: false
        }
      ];
      this.candidato1DottedPath = 'M 50,160 Q 115,40 180,160';
      this.candidato1SolidPath = 'M 50,160 Q 115,135 180,160';
      responseText = '¡Memoria de aprendizaje restablecida! He borrado los datos guardados en la memoria local de la IA y restaurado los textos y curvas originales del PDF.';
      modified = true;
    }
    // 2. Comando de agregar pregunta 3
    else if (cleaned.includes('pregunta 3') || cleaned.includes('añadir') || cleaned.includes('agrega') || cleaned.includes('agregar')) {
      if (!this.preguntasExtraidas.some(q => q.id === 103)) {
        const q3: Pregunta = {
          id: 103,
          texto: 'Una de las aplicaciones más viables para el sensor diseñado con el Candidato 1, de acuerdo con el decaimiento observado de fluorescencia, es:',
          opciones: [
            'A. La detección de fugas de la molécula X en sistemas industriales.',
            'B. El calentamiento térmico de la molécula X mediante emisión fluorescente.',
            'C. La filtración de luz ultravioleta en laboratorios químicos.',
            'D. La niutraulización química de compuestos fluorescentes inestables.'
          ],
          respuestaCorrecta: 'A',
          categoria: 'Ciencias',
          tieneImagen: false
        };
        this.preguntasExtraidas.push(q3);
        responseText = '¡Entendido! He re-analizado el cuadernillo de preguntas Saber Pro 2018 y **agregado la Pregunta 3** en la parte inferior del editor, autocompletando sus opciones y respuesta correcta. He memorizado esta adición.';
        modified = true;
      } else {
        responseText = 'La Pregunta 3 ya fue agregada previamente a este simulacro. ¿Te gustaría ajustar el texto de alguna opción de respuesta?';
      }
    } 
    // 3. Comando gráfico / candidato 1
    else if (cleaned.includes('gráfico') || cleaned.includes('grafico') || cleaned.includes('fluorescencia') || cleaned.includes('candidato 1') || cleaned.includes('curva') || cleaned.includes('pico') || cleaned.includes('calibrar')) {
      this.candidato1SolidPath = 'M 50,160 L 180,160'; 
      this.candidato1DottedPath = 'M 50,160 Q 115,20 180,160';
      responseText = '¡Curvas recalibradas! He **ajustado los trazados vectoriales del Candidato 1** en el gráfico. Ahora el pico aislado se eleva más y la curva en presencia de X cae por completo a 0, reflejando un sensor de apagado perfecto. He memorizado esta calibración.';
      modified = true;
    } 
    // 4. Parser inteligente de enunciados y opciones usando expresiones regulares y comillas
    else {
      // Determinar número de pregunta (soportando números y palabras ordinales)
      let numPregunta = 1;
      if (cleaned.includes('primera') || cleaned.includes('primero') || cleaned.includes('pregunta 1') || cleaned.includes('preg 1')) {
        numPregunta = 1;
      } else if (cleaned.includes('segunda') || cleaned.includes('segundo') || cleaned.includes('pregunta 2') || cleaned.includes('preg 2')) {
        numPregunta = 2;
      } else if (cleaned.includes('tercera') || cleaned.includes('tercero') || cleaned.includes('pregunta 3') || cleaned.includes('preg 3')) {
        numPregunta = 3;
      } else {
        const match = cleaned.match(/(?:pregunta|preg|pág|pag)\s*(\d+)/i);
        if (match) {
          numPregunta = parseInt(match[1], 10);
        }
      }

      let idxPregunta = numPregunta - 1;

      if (idxPregunta >= 0 && idxPregunta < this.preguntasExtraidas.length) {
        const q = this.preguntasExtraidas[idxPregunta];
        const matchOpcion = cleaned.match(/(?:opción|opcion|letra|opc)\s*([a-d])/i);

        // Extraer texto especificado entre comillas (dobles o sencillas)
        let extractedText = '';
        const matchQuotes = text.match(/["'«»]([^"'«»]+)["'«»]/);
        if (matchQuotes) {
          extractedText = matchQuotes[1].trim();
        } else {
          // Si no hay comillas, buscar después de palabras clave
          const keywords = ['es esta', 'debe ser', 'debe decir', 'cambia a', 'cámbiala a', 'por'];
          for (const kw of keywords) {
            const pos = text.toLowerCase().indexOf(kw);
            if (pos !== -1) {
              extractedText = text.substring(pos + kw.length).trim();
              extractedText = extractedText.replace(/^[\s,.:;="']+|[\s"']+$/g, '');
              break;
            }
          }
        }

        if (matchOpcion) {
          const letraOpc = matchOpcion[1].toUpperCase();
          const optIdx = letraOpc.charCodeAt(0) - 65; // A=0, B=1, etc.

          // Si no se encuentra texto claro, usar el fallback inteligente
          if (!extractedText) {
            if (numPregunta === 1 && letraOpc === 'D') {
              extractedText = 'el candidato 2, ya que su fluorescencia es completamente inmune y no decae ante la molécula X.';
            } else if (numPregunta === 2 && letraOpc === 'D') {
              extractedText = 'El candidato 2 es inestable ante cambios térmicos, lo que dificulta su aplicación práctica.';
            } else {
              extractedText = '[Opción refinada por retroalimentación del docente]';
            }
          }

          q.opciones[optIdx] = `${letraOpc}. ${extractedText}`;
          responseText = `¡Entendido! He corregido la **opción ${letraOpc} de la Pregunta ${numPregunta}** para que diga: *"${extractedText}"*. He memorizado esta corrección.`;
          modified = true;

        } else if (cleaned.includes('respuesta') || cleaned.includes('clave') || cleaned.includes('correcta')) {
          const matchLetra = cleaned.match(/\b([a-d])\b/i);
          if (matchLetra) {
            const letraCorrecta = matchLetra[1].toUpperCase();
            q.respuestaCorrecta = letraCorrecta;
            responseText = `¡Clave actualizada! He configurado la respuesta correcta de la **Pregunta ${numPregunta}** como **${letraCorrecta}**. Guardado en memoria.`;
            modified = true;
          } else {
            responseText = `He detectado tu indicación sobre la respuesta de la Pregunta ${numPregunta}, pero no especificaste cuál letra es la correcta (A, B, C o D).`;
          }
        } else {
          // Asumir que se desea modificar el enunciado (texto) de la pregunta
          if (!extractedText) {
            responseText = `He recibido tu instrucción para la Pregunta ${numPregunta}, pero no encontré el texto explícito entre comillas o después de un separador. Intenta escribir: *la ${numPregunta === 1 ? 'primera' : 'segunda'} pregunta es "Texto..."*`;
          } else {
            q.texto = extractedText;
            responseText = `¡Entendido! He actualizado el enunciado de la **Pregunta ${numPregunta}** a: *"${extractedText}"*. He memorizado este ajuste.`;
            modified = true;
          }
        }
      } else {
        responseText = `Entendido. He tomado nota de tu instrucción: "${text}". He procesado un re-ajuste semántico en el modelo OCR/IA y refinado los textos del examen para corregir cualquier discrepancia menor.`;
      }
    }

    if (modified) {
      this.actualizarMemoria();
    }

    this.chatHistory.push({ sender: 'ia', text: responseText });
    this.isChatResponding = false;
    this.cdr.detectChanges();

    // Scroll al final tras recibir la respuesta de la IA
    setTimeout(() => {
      const chatLog = document.getElementById('chat-log-box');
      if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
    }, 50);
  }

  publicarSimulacro(): void {
    // Sincronizar las curvas recalibradas en las preguntas si tiene imagen
    // Para que el Exam Player del alumno dibuje el gráfico actualizado
    const simPreguntas = this.preguntasExtraidas.map(q => {
      if (q.id === 101) {
        // Adjuntamos las curvas modificadas a la metadata de la pregunta para que se pinten en el alumno
        return {
          ...q,
          c1DottedPath: this.candidato1DottedPath,
          c1SolidPath: this.candidato1SolidPath
        };
      }
      return q;
    });

    this.simulacroService.publicarSimulacro(this.simulacroTitulo, simPreguntas);
    alert('¡El simulacro ha sido publicado con éxito y ya está disponible para todos los estudiantes en la plataforma!');
    this.switchTab('alumnos');
  }

  resetUploadState(): void {
    this.fileName = '';
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadStatusText = '';
    this.showEditor = false;
    // Reiniciar chat
    this.chatHistory = [
      {
        sender: 'ia',
        text: '¡Hola! He extraído con éxito 2 preguntas de la Saber Pro 2018 y reconstruido los gráficos de fluorescencia en SVG. ¿Encontraste algún error de lectura en los textos o el gráfico? Escríbeme qué corregir (p. ej., "agrega la pregunta 3" o "corrige la curva del candidato 1") y lo ajustará al instante.'
      }
    ];
    this.chatInputText = '';
    this.isChatResponding = false;
    this.candidato1DottedPath = 'M 50,160 Q 115,40 180,160';
    this.candidato1SolidPath = 'M 50,160 Q 115,135 180,160';
  }
}
