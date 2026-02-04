import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Inscripcion } from './inscripcion/inscripcion';
import { InscripcionDocente } from './inscripcion-docente/inscripcion-docente';

export const routes: Routes = [
  {
    path: '', component: Landing
  },
  {
    path: 'inscripcion', component: Inscripcion
  },
  {
    path: 'inscripcion-docente', component: InscripcionDocente
  }
];
