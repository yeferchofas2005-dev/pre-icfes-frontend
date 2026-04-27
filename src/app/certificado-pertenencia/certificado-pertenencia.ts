import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NodoInfo } from '../services/certificate.service';

@Component({
  selector: 'app-certificado-pertenencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-pertenencia.html',
  styleUrl: './certificado-pertenencia.css',
})
export class CertificadoPertenencia implements OnInit {

  /* =========================================================================
     INPUTS — datos inyectados desde la landing al activar el componente
  ========================================================================= */

  @Input() nombre:    string  = '';
  @Input() documento: string  = '';
  @Input() tipoDoc:   string  = '';
  @Input() nodoInfo!: NodoInfo;

  /* =========================================================================
     VARIABLES CALCULADAS — se construyen en ngOnInit y se usan en el HTML
  ========================================================================= */

  tipoDocLabel: string = '';
  fecha:        string = '';
  dia:          string = '';
  mes:          string = '';
  anio:         string = '';

  constructor(private el: ElementRef) {}

  /* =========================================================================
     CICLO DE VIDA
  ========================================================================= */

  ngOnInit(): void {
    // Calcular fecha actual en español para mostrarla en el certificado
    const now  = new Date();
    this.dia   = now.getDate().toString();
    this.mes   = now.toLocaleDateString('es-ES', { month: 'long' });
    this.anio  = now.getFullYear().toString();
    this.fecha = `${this.dia} de ${this.mes} de ${this.anio}`;

    // Convertir el código del tipo de documento a su texto completo
    this.tipoDocLabel = this.getTipoDocLabel(this.tipoDoc);

    // Esperar a que Angular termine de renderizar el HTML antes de capturarlo.
    // Sin este delay, html2canvas podría capturar el componente vacío o incompleto.
    setTimeout(() => this.descargarPDF(), 300);
  }

  /* =========================================================================
     MÉTODOS PRIVADOS
  ========================================================================= */

  /**
   * Convierte el código del tipo de documento al texto completo que aparece
   * en el certificado. Normaliza la entrada para manejar variaciones como
   * "T.I", "TI", "Tarjeta de Identidad", etc.
   */
  private getTipoDocLabel(tipo: string): string {
    if (!tipo) return 'Documento de Identidad';

    // Normalizar: mayúsculas, sin tildes, sin puntos, sin espacios extra
    const normalizado = tipo
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalizado.includes('CEDULA') || normalizado === 'CC') {
      return 'Cédula de Ciudadanía';
    }

    if (normalizado.includes('TARJETA') || normalizado === 'TI') {
      return 'Tarjeta de Identidad';
    }

    if (normalizado.includes('PPT') || normalizado.includes('PROTECCION')) {
      return 'Permiso por Protección Temporal';
    }

    return 'Documento de Identidad';
  }

  /**
   * Captura el HTML del certificado con html2canvas y lo exporta como PDF A4.
   * El componente se renderiza fuera del viewport (top: -9999px) desde la landing,
   * por lo que html2canvas lo captura invisible sin afectar la experiencia del usuario.
   */
  private async descargarPDF(): Promise<void> {
    const elemento = this.el.nativeElement.querySelector('#certificate-content');

    if (!elemento) {
      console.error('CertificadoPertenencia: no se encontró #certificate-content en el template.');
      return;
    }

    try {
      // Capturar el elemento a alta resolución (~300 dpi)
      const canvas = await html2canvas(elemento, {
        scale:           3,
        useCORS:         true,   // necesario para cargar imágenes desde assets/
        backgroundColor: '#f4f4f4',
        logging:         false,
      });

      // Calcular dimensiones para ajustar la imagen al formato A4
      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH   = pdf.internal.pageSize.getHeight();  // 297mm
      const imgH    = pageW * (canvas.height / canvas.width);

      if (imgH <= pageH) {
        // El certificado cabe en una sola página
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      } else {
        // Si el contenido excede una página, se divide en múltiples
        let rendered = 0;
        while (rendered < imgH) {
          if (rendered > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -rendered, pageW, imgH);
          rendered += pageH;
        }
      }

      pdf.save(`certificado_${this.documento}.pdf`);

    } catch (error) {
      console.error('CertificadoPertenencia: error al generar el PDF:', error);
    }
  }
}