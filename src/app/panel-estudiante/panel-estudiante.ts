import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulacroService, Simulacro, Pregunta } from '../services/simulacro.service';

@Component({
  selector: 'app-panel-estudiante',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-estudiante.html',
  styleUrl: './panel-estudiante.css',
})
export class PanelEstudiante implements OnInit, OnDestroy {
  simulacros: Simulacro[] = [];
  private subs = new Subscription();

  // Métricas dinámicas calculadas
  simulacrosRealizados = 0;
  puntajePromedio = 0;
  tiempoPromedioText = '51 s';

  // Estados del Exam Player
  realizandoTest = false;
  simulacroActivo: Simulacro | null = null;
  indicePreguntaActiva = 0;
  respuestasUsuario: { [preguntaId: number]: string } = {};

  // Temporizador
  tiempoRestante = 180; // 3 minutos por default
  tiempoTexto = '03:00';
  private timerInterval: any = null;

  // Pantalla de Resultados
  mostrarResultadosExamen = false;
  puntajeObtenido = 0;
  respuestasCorrectasCount = 0;
  totalPreguntasExamen = 0;

  constructor(
    private simulacroService: SimulacroService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscribirse a los simulacros del servicio central
    this.subs.add(
      this.simulacroService.getSimulacros().subscribe(data => {
        this.simulacros = data;
        this.recalcularMetricasPersonales();
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.detenerTimer();
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  // Recalcular métricas
  recalcularMetricasPersonales(): void {
    const realizados = this.simulacros.filter(s => s.estado === 'Realizado');
    this.simulacrosRealizados = realizados.length;

    if (realizados.length > 0) {
      const suma = realizados.reduce((acc, curr) => acc + (curr.puntaje || 0), 0);
      this.puntajePromedio = Math.round(suma / realizados.length);
    } else {
      this.puntajePromedio = 0;
    }
  }

  // Iniciar la sesión de test
  iniciarTest(sim: Simulacro): void {
    if (!sim.preguntas || sim.preguntas.length === 0) {
      alert('Este simulacro no contiene preguntas activas actualmente.');
      return;
    }

    this.simulacroActivo = sim;
    this.realizandoTest = true;
    this.indicePreguntaActiva = 0;
    this.respuestasUsuario = {};
    this.mostrarResultadosExamen = false;

    // Inicializar respuestas en blanco
    sim.preguntas.forEach(q => {
      this.respuestasUsuario[q.id] = '';
    });

    // Iniciar el temporizador (90 segundos por pregunta)
    this.tiempoRestante = sim.preguntas.length * 90;
    this.actualizarTextoTimer();
    this.iniciarTimer();
    this.cdr.detectChanges();
  }

  // Selector de respuestas
  seleccionarOpcion(preguntaId: number, opcionLetra: string): void {
    this.respuestasUsuario[preguntaId] = opcionLetra;
    this.cdr.detectChanges();
  }

  preguntaAnterior(): void {
    if (this.indicePreguntaActiva > 0) {
      this.indicePreguntaActiva--;
      this.cdr.detectChanges();
    }
  }

  preguntaSiguiente(): void {
    if (this.simulacroActivo && this.indicePreguntaActiva < this.simulacroActivo.preguntas.length - 1) {
      this.indicePreguntaActiva++;
      this.cdr.detectChanges();
    }
  }

  seleccionarPreguntaDirecta(index: number): void {
    this.indicePreguntaActiva = index;
    this.cdr.detectChanges();
  }

  // Enviar el examen
  enviarExamen(): void {
    if (!this.simulacroActivo) return;

    // Verificar si quedan preguntas sin responder
    const respondidas = Object.values(this.respuestasUsuario).filter(r => r !== '').length;
    const total = this.simulacroActivo.preguntas.length;

    if (respondidas < total) {
      const confirmar = confirm(`Has respondido ${respondidas} de ${total} preguntas.\n¿Estás seguro de que deseas finalizar la prueba?`);
      if (!confirmar) return;
    }

    this.detenerTimer();

    // Enviar al servicio y obtener puntaje final
    const puntaje = this.simulacroService.finalizarSimulacro(this.simulacroActivo.id, this.respuestasUsuario);

    // Calcular estadísticas locales para el feedback
    let correctas = 0;
    this.simulacroActivo.preguntas.forEach(q => {
      if (this.respuestasUsuario[q.id] === q.respuestaCorrecta) {
        correctas++;
      }
    });

    this.puntajeObtenido = puntaje;
    this.respuestasCorrectasCount = correctas;
    this.totalPreguntasExamen = total;
    this.mostrarResultadosExamen = true;
    this.cdr.detectChanges();
  }

  cerrarResultados(): void {
    this.realizandoTest = false;
    this.mostrarResultadosExamen = false;
    this.simulacroActivo = null;
    this.cdr.detectChanges();
  }

  // Timer Helper Methods
  private iniciarTimer(): void {
    this.detenerTimer();
    this.timerInterval = setInterval(() => {
      this.tiempoRestante--;
      this.actualizarTextoTimer();
      this.cdr.detectChanges();

      if (this.tiempoRestante <= 0) {
        this.detenerTimer();
        alert('¡El tiempo se ha agotado! Tu examen se enviará automáticamente.');
        this.enviarExamen();
      }
    }, 1000);
  }


  private detenerTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private actualizarTextoTimer(): void {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    const minStr = minutos < 10 ? `0${minutos}` : `${minutos}`;
    const segStr = segundos < 10 ? `0${segundos}` : `${segundos}`;
    this.tiempoTexto = `${minStr}:${segStr}`;
  }

  verEstadisticas(sim: Simulacro): void {
    alert(`Visualizando estadísticas detalladas de "${sim.nombre}".\nTu puntaje en este test fue de ${sim.puntaje}/500 puntos Saber.`);
  }
}
