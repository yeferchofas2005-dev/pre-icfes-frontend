import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SimulacroService, Simulacro } from '../services/simulacro.service';

@Component({
  selector: 'app-panel-admin',
  imports: [CommonModule],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin implements OnInit, OnDestroy {
  activeMenu = 'simulacros';
  simulacros: Simulacro[] = [];
  private subs = new Subscription();

  // Estadísticas del pastel (Pie Chart) dinámicas
  resultadosPorcentaje = 66; // inicial (2 de 3 realizados)
  pendientesPorcentaje = 34;
  pieSlicePathBlue = 'M 80,80 L 80,30 A 50,50 0 1,1 50.6,120.5 Z';
  pieSlicePathGrey = 'M 80,80 L 50.6,120.5 A 50,50 0 0,1 80,30 Z';

  // Alturas de barras para el gráfico (Bar Chart)
  bar1Height = 68; // Promedio de simulacro 1
  bar2Height = 62; // Promedio de simulacro 2
  bar3Height = 0;  // Promedio de simulacro 3 (se activará cuando el alumno lo complete)
  bar1Y = 58;
  bar2Y = 65;
  bar3Y = 130;

  constructor(
    private simulacroService: SimulacroService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los simulacros del servicio centralizado
    this.subs.add(
      this.simulacroService.getSimulacros().subscribe(data => {
        this.simulacros = data;
        this.recalcularEstadisticasAdmin();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
  }

  // Recalcular métricas y coordenadas de los gráficos SVG del Administrador
  recalcularEstadisticasAdmin(): void {
    const total = this.simulacros.length;
    if (total === 0) return;

    const realizados = this.simulacros.filter(s => s.estado === 'Realizado').length;
    const pendientes = total - realizados;

    // Calcular porcentajes
    this.resultadosPorcentaje = Math.round((realizados / total) * 100);
    this.pendientesPorcentaje = 100 - this.resultadosPorcentaje;

    // Generar coordenadas dinámicas para el Pie Chart SVG (Donut)
    // Para simplificar la representación trigonométrica de un gráfico circular de donut reactivo en Angular:
    const ratioRealizados = realizados / total;
    if (ratioRealizados === 1) {
      // 100% realizado
      this.pieSlicePathBlue = 'M 80,80 L 80,30 A 50,50 0 1,1 79.9,30 Z';
      this.pieSlicePathGrey = '';
    } else if (ratioRealizados === 0) {
      // 0% realizado
      this.pieSlicePathBlue = '';
      this.pieSlicePathGrey = 'M 80,80 L 80,30 A 50,50 0 1,1 79.9,30 Z';
    } else {
      // Proporción intermedia (e.g. 2/3 o 3/4)
      const angle = -90 + (ratioRealizados * 360);
      const rad = (angle * Math.PI) / 180;
      const x = 80 + 50 * Math.cos(rad);
      const y = 80 + 50 * Math.sin(rad);
      const largeArcFlag = ratioRealizados > 0.5 ? 1 : 0;

      this.pieSlicePathBlue = `M 80,80 L 80,30 A 50,50 0 ${largeArcFlag},1 ${x.toFixed(1)},${y.toFixed(1)} Z`;
      this.pieSlicePathGrey = `M 80,80 L ${x.toFixed(1)},${y.toFixed(1)} A 50,50 0 ${largeArcFlag === 1 ? 0 : 1},1 80,30 Z`;
    }

    // Configurar barras del Bar Chart (máximo 3 simulacros representados)
    const sim1 = this.simulacros.find(s => s.id === 1);
    const sim2 = this.simulacros.find(s => s.id === 2);
    const sim3 = this.simulacros.find(s => s.id === 3);

    // Simulacro 1
    if (sim1 && sim1.estado === 'Realizado') {
      this.bar1Height = Math.round((sim1.puntaje || 400) * 100 / 500); // normalizar a porcentaje
    } else {
      this.bar1Height = 0;
    }
    this.bar1Y = 130 - this.bar1Height;

    // Simulacro 2
    if (sim2 && sim2.estado === 'Realizado') {
      this.bar2Height = Math.round((sim2.puntaje || 400) * 100 / 500);
    } else {
      this.bar2Height = 0;
    }
    this.bar2Y = 130 - this.bar2Height;

    // Simulacro 3
    if (sim3 && sim3.estado === 'Realizado') {
      this.bar3Height = Math.round((sim3.puntaje || 400) * 100 / 500);
    } else {
      this.bar3Height = 0;
    }
    this.bar3Y = 130 - this.bar3Height;
  }

  agregarSimulacro(): void {
    // Al agregar un simulacro, simulamos que el docente crea uno rápido
    const nextId = this.simulacros.length + 1;
    
    // Crear preguntas básicas para este examen rápido
    const preguntasDummy = [
      {
        id: nextId * 100 + 1,
        texto: `Pregunta de verificación rápida para el examen #${nextId}`,
        opciones: ['A. Opción correcta', 'B. Opción incorrecta 1', 'C. Opción incorrecta 2', 'D. Opción incorrecta 3'],
        respuestaCorrecta: 'A',
        categoria: 'Matemáticas'
      }
    ];

    this.simulacroService.publicarSimulacro(`Simulacro ICFES #${nextId}`, preguntasDummy);
    alert(`¡Se ha creado el nuevo simulacro: "Simulacro ICFES #${nextId}"!\nEstará disponible para los estudiantes de inmediato.`);
  }

  verResultados(sim: Simulacro): void {
    if (sim.estado === 'No realizado') {
      alert(`El simulacro "${sim.nombre}" está publicado pero ningún estudiante lo ha resuelto aún.`);
    } else {
      alert(`Visualizando consola de resultados para ${sim.nombre}.\nPromedio de puntaje registrado: ${sim.puntaje} / 500 puntos.`);
    }
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
