import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [NgIf, RouterLink],
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
      text: 'Educación gratuita para jóvenes que sueñan con un mejor futuro.'
    },
    {
      title: 'Inscripciones abiertas',
      text: 'Únete a nuestro programa y prepárate para las pruebas Saber 11.'
    },
    {
      title: 'Síguenos en Instagram',
      text: 'Mantente informado sobre clases, eventos y noticias.'
    },
    {
    title: 'Inscripciones abiertas',
    text: 'Prepárate con nosotros',
    img: 'assets/logo.png'
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
}
