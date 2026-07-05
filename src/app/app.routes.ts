import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Inscripcion } from './inscripcion/inscripcion';
import { InscripcionDocente } from './inscripcion-docente/inscripcion-docente';
import { Directivos } from './directivos/directivos';
import { Login } from './login/login';
import { CertificadoPertenencia } from './certificado-pertenencia/certificado-pertenencia';
import { PanelEstudiante } from './panel-estudiante/panel-estudiante';
import { PanelDocente } from './panel-docente/panel-docente';
import { PanelAdmin } from './panel-admin/panel-admin';

export const routes: Routes = [
  {path: '', component: Landing},
  {path: 'inscripcion', component: Inscripcion},
  {path: 'inscripcion-docente', component: InscripcionDocente},
  {path: 'login', component: Login},
  {path: 'directivos', component: Directivos},
  {path: 'certificado-pertenencia', component: CertificadoPertenencia},
  {path: 'panel-estudiante', component: PanelEstudiante},
  {path: 'panel-docente', component: PanelDocente},
  {path: 'panel-admin', component: PanelAdmin}
];

