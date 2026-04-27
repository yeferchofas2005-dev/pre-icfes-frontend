import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/* =============================================================================
   MODELOS DE DATOS
============================================================================= */

/** Representa los datos de un estudiante tal como vienen del Google Sheet */
export interface Student {
  nombre:    string;
  tipoDoc:   string;
  documento: string;
}

/** Información estática de cada nodo para mostrar en el certificado */
export interface NodoInfo {
  nombreCompleto: string; // nombre completo del nodo, ej: "Nodo Bosa Porvenir"
  direccion:      string;
  coordinador:    string;
}

/* =============================================================================
   SERVICIO
============================================================================= */

@Injectable({ providedIn: 'root' })
export class CertificateService {

  /* ---------------------------------------------------------------------------
     Configuración de la API de Google Sheets
  --------------------------------------------------------------------------- */

  private readonly API_KEY        = 'AIzaSyAmbfU_CtpUFCZbMTAz1nmFpieM0qZDVHQ';
  private readonly SPREADSHEET_ID = '1ee9Es1yReB8-yYLBb8EW3z2WG6VshKKXmdURAEcg6fw';

  /**
   * Estructura fija de todas las pestañas del sheet:
   * - Las primeras 5 filas son encabezado con logo e info del nodo
   * - Fila 6 (índice 5) = títulos de columnas
   * - Fila 7 en adelante = datos de estudiantes
   *
   * Columnas:
   *   A (índice 0) = N°
   *   B (índice 1) = NOMBRE COMPLETO
   *   C (índice 2) = TIPO DOC
   *   D (índice 3) = DOCUMENTO
   */
  private readonly HEADER_ROW = 6; // filas a saltar antes de llegar a los datos
  private readonly COL_NOMBRE = 1; // columna B
  private readonly COL_TIPO   = 2; // columna C
  private readonly COL_DOC    = 3; // columna D

  /* ---------------------------------------------------------------------------
     Información estática de cada nodo
     La key debe coincidir EXACTAMENTE con el nombre de la pestaña en el sheet
  --------------------------------------------------------------------------- */

  private readonly NODOS: { [key: string]: NodoInfo } = {
    'BOSA': {
      nombreCompleto: 'Nodo Bosa Porvenir',
      direccion:      'Cl. 52 Sur #93d-39, Bogotá',
      coordinador:    'Juan David Santos Poblador'
    },
    'UNAL': {
      nombreCompleto: 'Nodo Universidad Nacional',
      direccion:      'Ave Cra 30 #45-3, Bogotá',
      coordinador:    'Gerson Eduardo Pachón Huertas'
    },
    'CIUDAD BOLIVAR': {
      nombreCompleto: 'Nodo Ciudad Bolívar',
      direccion:      'Calle 68d Bis A Sur #49F-70, Bogotá',
      coordinador:    'Jhoan Manuel Rodríguez Cerinza'
    },
    'UNIMINUTO PERDOMO': {
      nombreCompleto: 'Nodo Uniminuto Perdomo',
      direccion:      'Cra. 72 #59 Sur-98, Bogotá',
      coordinador:    'Brayan Jorsey Mejía Castillo'
    },
    'ENGATIVA': {
      nombreCompleto: 'Nodo Engativá',
      direccion:      'Cl. 89 Bis #91-20, Engativá, Bogotá',
      coordinador:    'César Iván'
    },
    'FONTIBON': {
      nombreCompleto: 'Nodo Fontibón',
      direccion:      'Cra. 104b #22, Bogotá',
      coordinador:    'Ariadna Vallecilla'
    },
    'PUENTE ARANDA': {
      nombreCompleto: 'Nodo Puente Aranda',
      direccion:      'Cl. 1b #52A-02, Puente Aranda, Bogotá',
      coordinador:    'Juan Esteban Yaso'
    },
    'KENNEDY': {
      nombreCompleto: 'Nodo Kennedy',
      direccion:      'Cl. 38c Sur #79-08, Kennedy, Bogotá',
      coordinador:    'José Wolf'
    }
  };

  constructor(private http: HttpClient) {}

  /* ---------------------------------------------------------------------------
     MÉTODOS PÚBLICOS
  --------------------------------------------------------------------------- */

  /**
   * Busca un estudiante por número de documento en la pestaña del nodo indicado.
   *
   * Se usa `encodeURIComponent` en el nombre de la pestaña para manejar
   * caracteres especiales como tildes (ej: FONTIBÓN → FONTIB%C3%93N).
   *
   * @param nombrePestaña - nombre exacto de la pestaña en el sheet (ej: 'BOSA', 'KENNEDY')
   * @param documento     - número de documento del estudiante a buscar
   * @returns Observable con los datos del estudiante o null si no se encontró
   */
  getStudent(nombrePestaña: string, documento: string): Observable<Student | null> {
    const range = `${encodeURIComponent(nombrePestaña)}!A:D`;
    const url   = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}?key=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const rows: string[][] = response.values;

        // Verificar que el sheet tenga datos más allá de los encabezados
        if (!rows || rows.length <= this.HEADER_ROW) return null;

        // Tomar solo las filas con datos reales (desde fila 7 en adelante)
        const dataRows = rows.slice(this.HEADER_ROW);

        // Buscar la fila cuya columna D coincida con el documento ingresado
        const fila = dataRows.find(row =>
          row[this.COL_DOC]?.toString().trim() === documento.trim()
        );

        if (!fila) return null;

        return {
          nombre:    fila[this.COL_NOMBRE]?.toString().trim() || '',
          tipoDoc:   fila[this.COL_TIPO]?.toString().trim()   || '',
          documento: fila[this.COL_DOC]?.toString().trim()    || ''
        };
      })
    );
  }

  /**
   * Retorna la información estática de un nodo (dirección, coordinador, nombre completo).
   * Retorna null si el nodo no existe en el mapa.
   */
  getNodoInfo(nombrePestaña: string): NodoInfo | null {
    return this.NODOS[nombrePestaña] ?? null;
  }

  /**
   * Retorna la lista de keys de nodos disponibles en el sheet.
   * Se usa en la landing para verificar si el nodo seleccionado ya tiene datos.
   */
  getNodoKeys(): string[] {
    return Object.keys(this.NODOS);
  }
}