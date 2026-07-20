import { Component, HostListener, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificateService, NodoInfo } from '../services/certificate.service';
import { CertificadoPertenencia } from '../certificado-pertenencia/certificado-pertenencia';
import { CertificadoDiploma } from '../certificado-diploma/certificado-diploma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-landing',
  imports: [
    NgIf,
    RouterLink,
    CertificadoPertenencia,
    CertificadoDiploma
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {

  constructor(
    private certificateService: CertificateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  /* =========================================================================
     POPUP / SLIDER DE ANUNCIOS & SPLASH SCREEN
  ========================================================================= */

  showSplash = false;
  showIntroPopup = false;

  ngOnInit() {

    const hasShownSplash = sessionStorage.getItem('preicfes_splash_shown');

    if (!hasShownSplash) {

      this.showSplash = true;
      sessionStorage.setItem('preicfes_splash_shown', 'true');

      setTimeout(() => {

        this.ngZone.run(() => {

          this.showSplash = false;
          this.showIntroPopup = true;
          this.cdr.detectChanges();

        });

      }, 4200);

    } else {

      this.showIntroPopup = true;

    }

  }

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
     CERTIFICADOS
  ========================================================================= */

  // Controla la visibilidad del modal
  showCertificateModal = false;

  // Mensaje mostrado al usuario
  certificateStatusMessage = '';

  // Bandera para Certificado de Pertenencia
  showCertificate = false;

  // Bandera para Diploma
  showDiploma = false;

  // Datos compartidos entre ambos certificados
  certificateData: {
    nombre: string;
    documento: string;
    tipoDoc: string;
    nodoInfo: NodoInfo;
  } | null = null;

  openCertificateModal() {

    this.certificateStatusMessage = '';
    this.showCertificateModal = true;

  }

  closeCertificateModal() {

    this.showCertificateModal = false;

  }

  /**
   * Flujo principal de generación de certificados.
   *
   * CP = Certificado de Pertenencia
   * CA = Certificado de Asistencia (Diploma)
   */
  async submitCertificate(
    tipoDocumento: string,
    documento: string,
    nodo: string
  ) {

    // Validar campos

    if (!documento || !nodo) {

      this.certificateStatusMessage = 'Por favor completa todos los campos.';
      this.cdr.detectChanges();
      return;

    }

    // Validar nodo

    const nodosDisponibles = this.certificateService.getNodoKeys();

    if (!nodosDisponibles.includes(nodo)) {

      this.certificateStatusMessage =
        `El nodo "${nodo}" aún no está disponible. Por favor verifica el nombre o inténtalo más tarde.`;

      this.cdr.detectChanges();
      return;

    }

    // Mensaje de carga

    this.certificateStatusMessage = 'Buscando tu certificado...';
    this.cdr.detectChanges();

    try {

      const estudiante = await firstValueFrom(
        this.certificateService.getStudent(
          nodo,
          documento.trim()
        )
      );

      // Documento no encontrado

      if (!estudiante) {

        this.certificateStatusMessage =
          'No se encontró un certificado para el número de documento y nodo proporcionados. Por favor verifica tus datos e inténtalo nuevamente.';

        this.cdr.detectChanges();
        return;

      }

      // Obtener información del nodo

      const nodoInfo = this.certificateService.getNodoInfo(nodo);

      if (!nodoInfo) {

        this.certificateStatusMessage =
          'Ocurrió un error al obtener la información del nodo. Por favor inténtalo nuevamente más tarde.';

        this.cdr.detectChanges();
        return;

      }

      // Datos que recibirán ambos componentes

      this.certificateData = {

        nombre: estudiante.nombre,
        documento: estudiante.documento,
        tipoDoc: estudiante.tipoDoc,
        nodoInfo: nodoInfo

      };

      // Cerrar modal

      this.closeCertificateModal();
      this.certificateStatusMessage = '';

      // Activar el componente correspondiente

      this.ngZone.run(() => {

        // Limpiar ambos estados por seguridad

        this.showCertificate = false;
        this.showDiploma = false;

        if (tipoDocumento === 'CP') {

          this.showCertificate = true;

        } else if (tipoDocumento === 'CA') {

          this.showDiploma = true;

        }

        this.cdr.detectChanges();

        // Después de la descarga desmontar el componente

        setTimeout(() => {

          this.ngZone.run(() => {

            this.showCertificate = false;
            this.showDiploma = false;

            this.cdr.detectChanges();

          });

        }, 4000);

      });

    }

    catch (error) {

      this.certificateStatusMessage =
        'Ocurrió un error al buscar tu certificado. Por favor inténtalo nuevamente más tarde.';

      this.cdr.detectChanges();

    }

  }

}