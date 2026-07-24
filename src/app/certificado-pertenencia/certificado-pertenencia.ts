import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import {
  NodoInfo,
  CertificateService,
  DirectorGeneralInfo
} from '../services/certificate.service';

interface DirectorNodoInfo {
  nombre: string;
  cargo: string;
  firma: string;
}

@Component({
  selector: 'app-certificado-pertenencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-pertenencia.html',
  styleUrl: './certificado-pertenencia.css',
})
export class CertificadoPertenencia implements OnInit {

  /* =========================================================================
     INPUTS
  ========================================================================= */

  @Input() nombre: string = '';
  @Input() documento: string = '';
  @Input() tipoDoc: string = '';
  @Input() nodoInfo!: NodoInfo;

  /* =========================================================================
     FECHA
  ========================================================================= */

  tipoDocLabel: string = '';
  fecha: string = '';
  dia: string = '';
  mes: string = '';
  anio: string = '';

  /* =========================================================================
     INFORMACIÓN DE FIRMAS
  ========================================================================= */

  directorGeneral!: DirectorGeneralInfo;

  directorNodo: DirectorNodoInfo | null = null;

  /**
   * Indica si existe físicamente la imagen
   * de la firma del Director del Nodo.
   */
  mostrarFirmaNodo = false;

  /* =========================================================================
     CONSTRUCTOR
  ========================================================================= */

  constructor(
    private el: ElementRef,
    private certificateService: CertificateService
  ) {}

  /* =========================================================================
     CICLO DE VIDA
  ========================================================================= */

  async ngOnInit(): Promise<void> {

    /* ----------------------------------------------------------
       Fecha
    ---------------------------------------------------------- */

    const now = new Date();

    this.dia = now.getDate().toString();

    this.mes = now.toLocaleDateString('es-ES', {
      month: 'long'
    });

    this.anio = now.getFullYear().toString();

    this.fecha = `${this.dia} de ${this.mes} de ${this.anio}`;

    /* ----------------------------------------------------------
       Tipo de documento
    ---------------------------------------------------------- */

    this.tipoDocLabel =
      this.getTipoDocLabel(this.tipoDoc);

    /* ----------------------------------------------------------
       Director General
    ---------------------------------------------------------- */

    this.directorGeneral =
      this.certificateService.getDirectorGeneral();

    /* ----------------------------------------------------------
       Director del Nodo
    ---------------------------------------------------------- */

    this.directorNodo =
      this.certificateService.getDirectorNodoByNombreCompleto(
        this.nodoInfo.nombreCompleto
      );

    /* ----------------------------------------------------------
       Verificar si existe la imagen de la firma
    ---------------------------------------------------------- */

    if (this.directorNodo) {

      this.mostrarFirmaNodo =
        await this.verificarFirmaNodo(
          this.directorNodo.firma
        );

    }

    /* ----------------------------------------------------------
       Esperar a que Angular actualice el DOM y las imágenes
       terminen de cargar antes de generar el PDF
    ---------------------------------------------------------- */

    await this.esperarImagenesDOM();

    /* ----------------------------------------------------------
       Descargar PDF
    ---------------------------------------------------------- */

    await this.descargarPDF();

  }

  /* =========================================================================
     MÉTODOS AUXILIARES
  ========================================================================= */

  /**
   * Convierte el tipo de documento
   * al nombre completo.
   */
  private getTipoDocLabel(tipo: string): string {

    if (!tipo) {
      return 'Documento de Identidad';
    }

    const normalizado = tipo
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      normalizado.includes('CEDULA') ||
      normalizado === 'CC'
    ) {
      return 'Cédula de Ciudadanía';
    }

    if (
      normalizado.includes('TARJETA') ||
      normalizado === 'TI'
    ) {
      return 'Tarjeta de Identidad';
    }

    if (
      normalizado.includes('PPT') ||
      normalizado.includes('PROTECCION')
    ) {
      return 'Permiso por Protección Temporal';
    }

    return 'Documento de Identidad';

  }

  /* =========================================================================
     ESPERAR IMÁGENES DEL DOM
  ========================================================================= */

  /**
   * Espera a que todas las imágenes visibles en el componente
   * terminen de cargar (o fallen) antes de continuar.
   * Incluye un mínimo de 200ms para que Angular procese los *ngIf.
   */
  private esperarImagenesDOM(): Promise<void> {

    return new Promise(resolve => {

      setTimeout(() => {

        const imgs: HTMLImageElement[] = Array.from(
          this.el.nativeElement.querySelectorAll('img')
        );

        if (imgs.length === 0) {
          resolve();
          return;
        }

        let pendientes = imgs.filter(img => !img.complete).length;

        if (pendientes === 0) {
          resolve();
          return;
        }

        const onDone = () => {
          pendientes--;
          if (pendientes <= 0) resolve();
        };

        imgs
          .filter(img => !img.complete)
          .forEach(img => {
            img.addEventListener('load', onDone, { once: true });
            img.addEventListener('error', onDone, { once: true });
          });

      }, 200);

    });

  }

  /* =========================================================================
     VERIFICAR SI EXISTE LA FIRMA
  ========================================================================= */

  /**
   * Comprueba si el archivo existe.
   */
  private verificarFirmaNodo(
    ruta: string
  ): Promise<boolean> {

    return new Promise(resolve => {

      const img = new Image();

      img.onload = () => resolve(true);

      img.onerror = () => resolve(false);

      // Usar ruta absoluta para evitar fallos cuando la URL
      // del navegador no está en la raíz de la aplicación
      img.src = `${window.location.origin}/${ruta}`;

    });

  }

  /* =========================================================================
     PDF
  ========================================================================= */

  private async descargarPDF(): Promise<void> {

    const elemento =
      this.el.nativeElement.querySelector(
        '#certificate-content'
      );

    if (!elemento) {

      console.error(
        'CertificadoPertenencia: no se encontró #certificate-content.'
      );

      return;

    }

    try {

      const canvas = await html2canvas(elemento, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#f4f4f4',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgH =
        pageW * (canvas.height / canvas.width);

      /* ----------------------------------------------------------
         Tolerancia para evitar una segunda página en blanco
         causada por diferencias mínimas de redondeo entre el
         canvas capturado y las medidas exactas de una hoja A4.
      ---------------------------------------------------------- */

      const TOLERANCIA_MM = 3;

      if (imgH <= pageH + TOLERANCIA_MM) {

        const imgHFinal = Math.min(imgH, pageH);

        pdf.addImage(
          imgData,
          'PNG',
          0,
          0,
          pageW,
          imgHFinal
        );

      } else {

        let rendered = 0;

        while (rendered < imgH) {

          if (rendered > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            imgData,
            'PNG',
            0,
            -rendered,
            pageW,
            imgH
          );

          rendered += pageH;

        }

      }

      pdf.save(`certificado_${this.documento}.pdf`);

    } catch (error) {

      console.error(
        'CertificadoPertenencia: error al generar PDF:',
        error
      );

    }

  }

}