import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Inscripcion } from './inscripcion/inscripcion';

export const routes: Routes = [
  {
    path: '', component: Landing
  },
  {
    path: 'inscripcion', component: Inscripcion
  }
];
