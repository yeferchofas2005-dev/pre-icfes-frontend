import { Component, HostListener, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificateService, NodoInfo } from '../services/certificate.service';
import { CertificadoPertenencia } from '../certificado-pertenencia/certificado-pertenencia';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-landing',
  imports: [NgIf, RouterLink, CertificadoPertenencia],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {

  constructor(
    private certificateService: CertificateService,
    private ngZone: NgZone,       // Permite forzar la detección de cambios desde fuera de la zona de Angular
    private cdr: ChangeDetectorRef // Permite actualizar la UI manualmente después de operaciones async
  ) {}

  /* =========================================================================
     POPUP / SLIDER DE ANUNCIOS
  ========================================================================= */

  showIntroPopup = true;

  slides = [
    {
      title: 'Bienvenido a Preicfes Gratuito',
      text: 'Creemos en el poder de la educación para transformar vidas. Aquí acompañamos a jóvenes en su camino hacia las pruebas Saber 11, con clases gratuitas, apoyo académico y orientación para construir un mejor futuro.',
      img: 'assets/anuncios/anuncio1.png'
    },
    {
      title: 'Síguenos en Instagram',
      text: 'Entérate de nuestras clases, eventos, convocatorias y logros. Sé parte de nuestra comunidad y acompáñanos en este proyecto que transforma oportunidades en realidades.',
      img: 'assets/anuncios/anuncio2.png'
    },
    {
      title: 'Buscamos voluntarios docentes',
      text: '¿Te apasiona enseñar y generar impacto social? Únete como voluntario y ayuda a preparar a jóvenes para las pruebas Saber 11. Tu conocimiento puede cambiar historias.',
      img: 'assets/anuncios/anuncio3.png'
    },
    {
      title: 'Apoya a un futuro graduado',
      text: 'Con tu apoyo podemos llegar a más jóvenes. Dona y contribuye a que nuevas generaciones accedan a educación gratuita y de calidad. Juntos construimos oportunidades.',
      img: 'assets/anuncios/anuncio4.png'
    }
  ];

  currentSlide = 0;

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  closeIntroPopup() {
    this.showIntroPopup = false;
  }

  /* =========================================================================
     MANEJO DE TECLADO
     Cierra popups activos al presionar Escape
  ========================================================================= */

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showIntroPopup) {
        this.closeIntroPopup();
      } else if (this.showCertificateModal) {
        this.closeCertificateModal();
      }
    }
  }

  /* =========================================================================
     CERTIFICADO DE PERTENENCIA
  ========================================================================= */

  // Controla la visibilidad del modal donde el usuario ingresa sus datos
  showCertificateModal = false;

  // Mensaje de estado mostrado al usuario durante el proceso (errores, carga, etc.)
  certificateStatusMessage = '';

  // Bandera que activa el componente invisible encargado de generar y descargar el PDF
  showCertificate = false;

  // Datos del estudiante y su nodo que se pasan al componente CertificadoPertenencia
  certificateData: {
    nombre:    string;
    documento: string;
    tipoDoc:   string;
    nodoInfo:  NodoInfo;
  } | null = null;

  openCertificateModal() {
    this.certificateStatusMessage = '';
    this.showCertificateModal = true;
  }

  closeCertificateModal() {
    this.showCertificateModal = false;
  }

  /**
   * Método principal del flujo de descarga del certificado.
   * 1. Valida los campos del formulario
   * 2. Verifica que el nodo esté disponible
   * 3. Busca al estudiante en Google Sheets
   * 4. Si lo encuentra, activa el componente que genera y descarga el PDF
   */
  async submitCertificate(tipoDocumento: string, documento: string, nodo: string) {

    // Validar que todos los campos estén llenos
    if (!documento || !nodo) {
      this.certificateStatusMessage = 'Por favor completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    // Verificar que el nodo seleccionado ya tenga datos en el sheet
    const nodosDisponibles = this.certificateService.getNodoKeys();
    if (!nodosDisponibles.includes(nodo)) {
      this.certificateStatusMessage = `El nodo "${nodo}" aún no está disponible. Por favor verifica el nombre o inténtalo más tarde.`;
      this.cdr.detectChanges();
      return;
    }

    // Mostrar mensaje de carga antes de la petición HTTP
    this.certificateStatusMessage = 'Buscando tu certificado...';
    this.cdr.detectChanges();

    try {
      // Buscar al estudiante en la pestaña correspondiente del Google Sheet
      const estudiante = await firstValueFrom(
        this.certificateService.getStudent(nodo, documento.trim())
      );

      // Si no se encontró el documento en el nodo seleccionado
      if (!estudiante) {
        this.certificateStatusMessage = 'No se encontró un certificado para el número de documento y nodo proporcionados. Por favor verifica tus datos e inténtalo nuevamente.';
        this.cdr.detectChanges();
        return;
      }

      // Obtener la información del nodo (dirección, coordinador, nombre completo)
      const nodoInfo = this.certificateService.getNodoInfo(nodo);
      if (!nodoInfo) {
        this.certificateStatusMessage = 'Ocurrió un error al obtener la información del nodo. Por favor inténtalo nuevamente más tarde.';
        this.cdr.detectChanges();
        return;
      }

      // Preparar los datos que se inyectarán en el certificado
      this.certificateData = {
        nombre:    estudiante.nombre,
        documento: estudiante.documento,
        tipoDoc:   estudiante.tipoDoc,
        nodoInfo:  nodoInfo
      };

      // Cerrar el modal y limpiar el mensaje de estado
      this.closeCertificateModal();
      this.certificateStatusMessage = '';

      // Activar el componente invisible CertificadoPertenencia dentro de la zona de Angular
      // para que el *ngIf se evalúe correctamente y el componente se instancie
      this.ngZone.run(() => {
        this.showCertificate = true;
        this.cdr.detectChanges();

        // Desactivar el componente después de que el PDF se haya descargado
        setTimeout(() => {
          this.ngZone.run(() => {
            this.showCertificate = false;
          });
        }, 4000);
      });

    } catch (error) {
      // Error de red o de la API de Google Sheets
      this.certificateStatusMessage = 'Ocurrió un error al buscar tu certificado. Por favor inténtalo nuevamente más tarde.';
      this.cdr.detectChanges();
    }
  }
}