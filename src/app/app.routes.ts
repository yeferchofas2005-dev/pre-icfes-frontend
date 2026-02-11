import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Inscripcion } from './inscripcion/inscripcion';
import { InscripcionDocente } from './inscripcion-docente/inscripcion-docente';
import { Directivos } from './directivos/directivos';
import { Login } from './login/login';

export const routes: Routes = [
  {path: '', component: Landing},
  {path: 'inscripcion', component: Inscripcion},
  {path: 'inscripcion-docente', component: InscripcionDocente},
  {path: 'login', component: Login},
  {path: 'directivos', component: Directivos}
];
