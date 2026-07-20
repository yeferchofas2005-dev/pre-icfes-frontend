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
  selector: 'app-certificado-diploma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-diploma.html',
  styleUrl: './certificado-diploma.css',
})
export class CertificadoDiploma implements OnInit {

  /* =========================================================================
     INPUTS
  ========================================================================= */

  @Input() nombre: string = '';

  @Input() nodoInfo!: NodoInfo;

  @Input() documento: string = '';

  /* =========================================================================
     INFORMACIÓN DE FIRMAS
  ========================================================================= */

  directorGeneral!: DirectorGeneralInfo;

  directorNodo: DirectorNodoInfo | null = null;

  /**
   * Indica si la firma del Director del Nodo
   * existe físicamente.
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
     PROPIEDADES CALCULADAS
  ========================================================================= */

  get nombreFontSize(): string {

    const longitud = this.nombre.trim().length;

    if (longitud <= 18) {
      return '76px';
    }

    if (longitud <= 25) {
      return '68px';
    }

    if (longitud <= 32) {
      return '60px';
    }

    if (longitud <= 40) {
      return '54px';
    }

    if (longitud <= 48) {
      return '48px';
    }

    return '42px';

  }

  /* =========================================================================
     CICLO DE VIDA
  ========================================================================= */

  async ngOnInit(): Promise<void> {

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
       Verificar existencia de la firma
    ---------------------------------------------------------- */

    if (this.directorNodo) {

      this.mostrarFirmaNodo =
        await this.verificarFirmaNodo(
          this.directorNodo.firma
        );

    }

    /* ----------------------------------------------------------
       Esperar actualización del DOM
    ---------------------------------------------------------- */

    await new Promise(resolve => setTimeout(resolve, 50));

    /* ----------------------------------------------------------
       Generar PDF
    ---------------------------------------------------------- */

    await this.descargarPDF();

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

      img.src = ruta;

    });

  }

  /* =========================================================================
     PDF
  ========================================================================= */

  private async descargarPDF(): Promise<void> {

    const elemento =
      this.el.nativeElement.querySelector(
        '#diploma-content'
      );

    if (!elemento) {

      console.error(
        'CertificadoDiploma: no se encontró #diploma-content.'
      );

      return;

    }

    try {

      const canvas = await html2canvas(elemento, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgH =
        pageW * (canvas.height / canvas.width);

      if (imgH <= pageH) {

        pdf.addImage(
          imgData,
          'PNG',
          0,
          0,
          pageW,
          imgH
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

      pdf.save(
        `diploma_${this.documento || this.nombre}.pdf`
      );

    } catch (error) {

      console.error(
        'CertificadoDiploma: error al generar el PDF:',
        error
      );

    }

  }

}