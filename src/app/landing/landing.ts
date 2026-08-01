import { Component, HostListener, NgZone, ChangeDetectorRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CertificateService, NodoInfo } from '../services/certificate.service';
import { EmailService } from '../services/email.service';
import { CertificadoPertenencia } from '../certificado-pertenencia/certificado-pertenencia';
import { CertificadoDiploma } from '../certificado-diploma/certificado-diploma';
import { firstValueFrom } from 'rxjs';
import * as AOS from 'aos';

@Component({
  selector: 'app-landing',
  imports: [
    NgIf,
    RouterLink,
    FormsModule,
    CertificadoPertenencia,
    CertificadoDiploma
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})

export class Landing implements OnInit, OnDestroy, AfterViewInit {

  constructor(
    private certificateService: CertificateService,
    private emailService: EmailService,
    private ngZone: NgZone,       // Permite forzar la detección de cambios desde fuera de la zona de Angular
    private cdr: ChangeDetectorRef // Permite actualizar la UI manualmente después de operaciones async
  ) { }

  countdownDays: string = '00';
  countdownHours: string = '00';
  countdownMinutes: string = '00';
  selectedDonation: string = '$60k';

  selectDonation(amount: string) {
    this.selectedDonation = amount;
  }
  countdownSeconds: string = '00';
  private countdownInterval: any;

  ngAfterViewInit() {
    // Es mejor inicializar AOS aquí porque los elementos HTML ya se han renderizado
    setTimeout(() => {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
      AOS.refresh();
    }, 100);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown() {
    // Fecha objetivo: 26 de julio de 2026, hora de Colombia (UTC-5)
    // Se puede especificar el timezone en el string, o usar getTime() y ajustar si es necesario.
    // '2026-07-26T00:00:00-05:00' asume media noche, o si es a otra hora, podemos poner '2026-07-26T07:00:00-05:00' (ej. 7am)
    // El prompt solo dice "para el dia 26 de julio 2026"
    const targetDate = new Date('2026-07-26T00:00:00-05:00').getTime();

    this.countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(this.countdownInterval);
        this.countdownDays = '00';
        this.countdownHours = '00';
        this.countdownMinutes = '00';
        this.countdownSeconds = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      this.countdownDays = days.toString().padStart(2, '0');
      this.countdownHours = hours.toString().padStart(2, '0');
      this.countdownMinutes = minutes.toString().padStart(2, '0');
      this.countdownSeconds = seconds.toString().padStart(2, '0');

      this.cdr.detectChanges();
    }, 1000);
  }

  /* =========================================================================
     POPUP / SLIDER DE ANUNCIOS & SPLASH SCREEN
  ========================================================================= */

  showSplash = false;
  showIntroPopup = false;

  ngOnInit() {
    // Iniciar el contador
    this.startCountdown();

    // Comprobar si ya se mostró el splash en esta sesión de navegación
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

    }

  }

  /* =========================================================================
     ENVÍO DE CORREO DE SUSCRIPCIÓN (EMAILJS)
  ========================================================================= */

  subscribeEmail: string = '';
  isSubmittingEmail: boolean = false;
  subscribeStatusMessage: string = '';
  subscribeStatusType: 'success' | 'error' | '' = '';

  async onSubscribeEmail(event: Event) {
    event.preventDefault();

    const email = this.subscribeEmail.trim();

    if (!email || !email.includes('@')) {
      this.subscribeStatusMessage = 'Por favor ingresa un correo electrónico válido.';
      this.subscribeStatusType = 'error';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmittingEmail = true;
    this.subscribeStatusMessage = 'Enviando información a tu correo...';
    this.subscribeStatusType = '';
    this.cdr.detectChanges();

    try {
      await this.emailService.sendSubscriptionEmail(email);

      this.subscribeStatusMessage = '¡Te has suscrito con éxito! Revisa tu bandeja de entrada.';
      this.subscribeStatusType = 'success';
      this.subscribeEmail = '';
    } catch (error) {
      console.error('Error al enviar correo con EmailJS:', error);
      this.subscribeStatusMessage = 'Ocurrió un error al enviar el correo. Por favor inténtalo más tarde.';
      this.subscribeStatusType = 'error';
    } finally {
      this.isSubmittingEmail = false;
      this.cdr.detectChanges();
    }
  }

}