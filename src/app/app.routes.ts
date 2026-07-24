import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Inscripcion } from './inscripcion/inscripcion';
import { InscripcionDocente } from './inscripcion-docente/inscripcion-docente';
import { Directivos } from './directivos/directivos';
import { Login } from './login/login';
import { CertificadoPertenencia } from './certificado-pertenencia/certificado-pertenencia';

export const routes: Routes = [
  {path: '', component: Landing, data: { animation: 'LandingPage' }},
  {path: 'inscripcion', component: Inscripcion, data: { animation: 'InscripcionPage' }},
  {path: 'inscripcion-docente', component: InscripcionDocente, data: { animation: 'InscripcionDocentePage' }},
  {path: 'login', component: Login, data: { animation: 'LoginPage' }},
  {path: 'directivos', component: Directivos, data: { animation: 'DirectivosPage' }},
  {path: 'certificado-pertenencia', component: CertificadoPertenencia, data: { animation: 'CertificadoPage' }}
];
