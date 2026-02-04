import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-landing',
  imports: [NgIf],
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
}
