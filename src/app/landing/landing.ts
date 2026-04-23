import { Component, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificateService } from '../services/certificate.service';
import { CertificateComponent } from '../certificate/certificate.component';

@Component({
  selector: 'app-landing',
  imports: [NgIf, RouterLink, CertificateComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {

  /* ======================
     POPUP / SLIDER
  ====================== */
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
    this.currentSlide =
      (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  closeIntroPopup() {
    this.showIntroPopup = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showIntroPopup) {
        this.closeIntroPopup();
      } else if (this.showCertificateModal) {
        this.closeCertificateModal();
      } else if (this.showCertificateView) {
        this.closeCertificateView();
      }
    }
  }

  /* ======================
     CERTIFICADO
  ====================== */
  showCertificateModal = false;
  showCertificateView = false;
  certificateStatusMessage = '';
  selectedNodo = '';
  certificateData: any = {};

  constructor(private certificateService: CertificateService) {}

  openCertificateModal() {
    this.certificateStatusMessage = '';
    this.showCertificateModal = true;
  }

  closeCertificateModal() {
    this.showCertificateModal = false;
  }

  closeCertificateView() {
    this.showCertificateView = false;
  }

  submitCertificate(documentType: string, documentNumber: string, nodoValue: string) {
    const trimmedNumber = documentNumber?.trim();
    const nodo = this.getNodoName(nodoValue);
    if (!documentType || !trimmedNumber || !nodo) {
      this.certificateStatusMessage = 'Por favor selecciona el tipo de documento, ingresa el número y selecciona el nodo.';
      return;
    }

    this.certificateService.getStudentData(nodo, trimmedNumber).subscribe(data => {
      if (data) {
        this.certificateData = {
          nombre: data.nombre || '',
          documento: trimmedNumber,
          nodo: nodo,
          tipoDocumento: documentType.toUpperCase(),
          direccion: this.certificateService.getDireccion(nodo),
          coordinador: this.certificateService.getCoordinador(nodo)
        };
        console.log('Datos del certificado:', this.certificateData);
        this.showCertificateModal = false;
        this.showCertificateView = true;
      } else {
        this.certificateStatusMessage = 'Estudiante no encontrado en el nodo seleccionado.';
      }
    }, error => {
      this.certificateStatusMessage = 'Error al consultar los datos. Inténtalo de nuevo.';
      console.error(error);
    });
  }

  getNodoName(value: string): string {
    const map: { [key: string]: string } = {
      'san-cristobal-sur': 'Nodo San Cristóbal Sur',
      'fontibon': 'FONTIBÓN',
      'usme': 'Nodo Usme',
      'engativa': 'Engativá',
      'suba': 'Nodo Suba',
      'universidad-nacional': 'UNAL',
      'ciudad-bolivar': 'CIUDAD BOLIVAR',
      'kennedy': 'KENNEDY',
      'bosa-porvenir': 'BOSA',
      'uniminuto-soacha': 'UNIMINUTO PERDOMO',
      'puente-aranda': 'PUENTE ARANDA',
      'virtual': 'Nodo Virtual'
    };
    return map[value] || '';
  }
}

