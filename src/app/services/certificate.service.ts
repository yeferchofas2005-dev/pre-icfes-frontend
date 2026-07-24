import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/* =============================================================================
   MODELOS DE DATOS
============================================================================= */

/** Representa los datos de un estudiante tal como vienen del Google Sheet */
export interface Student {
  nombre: string;
  tipoDoc: string;
  documento: string;
}

/** Información estática de cada nodo para mostrar en los certificados */
export interface NodoInfo {
  nombreCompleto: string;
  direccion: string;
  coordinador: string;

  /**
   * Clave utilizada para construir automáticamente
   * el nombre del archivo de la firma.
   *
   * Ejemplos:
   * bosa
   * unal
   * kennedy
   * ciudad_bolivar
   */
  firmaKey: string;
}

/** Información institucional del Director General */
export interface DirectorGeneralInfo {
  nombre: string;
  cargo: string;
  firma: string;
}

/* =============================================================================
   SERVICIO
============================================================================= */

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  /* ---------------------------------------------------------------------------
     Configuración Google Sheets
  --------------------------------------------------------------------------- */

  private readonly API_KEY =
    'AIzaSyAmbfU_CtpUFCZbMTAz1nmFpieM0qZDVHQ';

  private readonly SPREADSHEET_ID =
    '1ee9Es1yReB8-yYLBb8EW3z2WG6VshKKXmdURAEcg6fw';

  /**
   * Las primeras 6 filas del Sheet contienen encabezados.
   */
  private readonly HEADER_ROW = 6;

  private readonly COL_NOMBRE = 1;
  private readonly COL_TIPO = 2;
  private readonly COL_DOC = 3;

  /* ---------------------------------------------------------------------------
     Información institucional
  --------------------------------------------------------------------------- */

  private readonly DIRECTOR_GENERAL: DirectorGeneralInfo = {
    nombre: 'Jefferson Escobar Rivas',
    cargo: 'Director General',
    firma: 'assets/certificado/firma_director_general.png'
  };

  /* ---------------------------------------------------------------------------
     Información de nodos
     La key debe coincidir EXACTAMENTE con el nombre de la pestaña en el sheet
  --------------------------------------------------------------------------- */

  private readonly NODOS: Record<string, NodoInfo> = {

    'BOSA': {
      nombreCompleto: 'Nodo Bosa Porvenir',
      direccion: 'Cl. 52 Sur #93d-39, Bogotá',
      coordinador: 'Juan David Santos Poblador',
      firmaKey: 'bosa'
    },

    'UNAL': {
      nombreCompleto: 'Nodo Universidad Nacional',
      direccion: 'Ave Cra 30 #45-3, Bogotá',
      coordinador: 'Gerson Pachon',
      firmaKey: 'unal'
    },

    'CIUDAD BOLIVAR': {
      nombreCompleto: 'Nodo Ciudad Bolívar',
      direccion: 'Calle 68d Bis A Sur #49F-70, Bogotá',
      coordinador: 'Brayan Jorsey Mejía',
      firmaKey: 'ciudad_bolivar'
    },

    'UNIMINUTO PERDOMO': {
      nombreCompleto: 'Nodo Uniminuto Perdomo - Soacha',
      direccion: 'Cra. 72 #59 Sur-98, Bogotá',
      coordinador: 'Duvan Fernando Caleño',
      firmaKey: 'uniminuto_perdomo'
    },

    'ENGATIVA': {
      nombreCompleto: 'Nodo Engativá',
      direccion: 'Cl. 89 Bis #91-20, Engativá, Bogotá',
      coordinador: 'Andrea Catalina García León',
      firmaKey: 'engativa'
    },

    'FONTIBON': {
      nombreCompleto: 'Nodo Fontibón',
      direccion: 'Cra. 101 #23-42, Fontibón, Bogotá',
      coordinador: 'Ariadna Vallecilla, Karol Lizeth Cifuentes',
      firmaKey: 'fontibon'
    },

    'PUENTE ARANDA': {
      nombreCompleto: 'Nodo Puente Aranda',
      direccion: 'Cl. 1b #52A-02, Puente Aranda, Bogotá',
      coordinador: 'Juan Esteban Yaso',
      firmaKey: 'puente_aranda'
    },

    'KENNEDY': {
      nombreCompleto: 'Nodo Kennedy',
      direccion: 'Cl. 38c Sur #79-08, Kennedy, Bogotá',
      coordinador: 'José Wolf',
      firmaKey: 'kennedy'
    },

    'SAN CRISTOBAL SUR': {
      nombreCompleto: 'Nodo San Cristóbal Sur',
      direccion: '76 Sur, Cl. 25 Sur #9, Bogotá',
      coordinador: 'Heidy Tatiana Simbaqueva',
      firmaKey: 'san_cristobal_sur'
    },

    'USME': {
      nombreCompleto: 'Nodo Usme - Rafael Uribe Uribe',
      direccion: 'Calle 40 #24-55, Bogotá',
      coordinador: 'Karol Andrade',
      firmaKey: 'usme'
    },

    'SUBA': {
      nombreCompleto: 'Nodo Suba',
      direccion: 'Cl. 130 Bis, Bogotá',
      coordinador: 'Cesar Iván Hernández',
      firmaKey: 'suba'
    },

    'VIRTUAL': {
      nombreCompleto: 'Nodo Virtual',
      direccion: 'Plataforma Microsoft Teams',
      coordinador: 'Jefferson Escobar Rivas',
      firmaKey: 'virtual'
    }

    /*
      Cuando habilites nuevos nodos únicamente debes agregar uno nuevo
      siguiendo exactamente este mismo formato.

      Ejemplo:

      'SUBA': {
        nombreCompleto: 'Nodo Suba',
        direccion: '...',
        coordinador: '...',
        firmaKey: 'suba'
      }

      y colocar la imagen:

      assets/certificado/firma_director_nodo_suba.png
    */

  };

  constructor(private http: HttpClient) {}

  /* ---------------------------------------------------------------------------
     MÉTODOS PÚBLICOS
  --------------------------------------------------------------------------- */

  /**
   * Busca un estudiante dentro del Google Sheet.
   */
  getStudent(
    nombrePestaña: string,
    documento: string
  ): Observable<Student | null> {

    const range =
      `${encodeURIComponent(nombrePestaña)}!A:D`;

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}?key=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(

      map(response => {

        const rows: string[][] = response.values;

        if (!rows || rows.length <= this.HEADER_ROW) {
          return null;
        }

        const dataRows = rows.slice(this.HEADER_ROW);

        const fila = dataRows.find(row =>
          row[this.COL_DOC]?.toString().trim() === documento.trim()
        );

        if (!fila) {
          return null;
        }

        return {
          nombre: fila[this.COL_NOMBRE]?.toString().trim() || '',
          tipoDoc: fila[this.COL_TIPO]?.toString().trim() || '',
          documento: fila[this.COL_DOC]?.toString().trim() || ''
        };

      })

    );

  }
  /* ---------------------------------------------------------------------------
     DIRECTOR GENERAL
  --------------------------------------------------------------------------- */

  /**
   * Retorna la información institucional del Director General.
   */
  getDirectorGeneral(): DirectorGeneralInfo {
    return this.DIRECTOR_GENERAL;
  }

  /* ---------------------------------------------------------------------------
     FIRMAS DE LOS DIRECTORES DE NODO
  --------------------------------------------------------------------------- */

  /**
   * Devuelve la ruta donde debería encontrarse
   * la firma del director del nodo.
   *
   * Ejemplo:
   *
   * assets/certificado/firma_director_nodo_bosa.png
   */
  getFirmaNodo(nombreNodo: string): string {

    const nodo = this.NODOS[nombreNodo];

    if (!nodo) {
      return '';
    }

    return `assets/certificado/firma_director_nodo_${nodo.firmaKey}.png`;

  }

  /**
   * Retorna la información del Director del Nodo
   * utilizando la clave del nodo.
   *
   * Ejemplo:
   * BOSA
   * UNAL
   * KENNEDY
   */
  getDirectorNodo(nombreNodo: string): {
    nombre: string;
    cargo: string;
    firma: string;
  } | null {

    const nodo = this.NODOS[nombreNodo];

    if (!nodo) {
      return null;
    }

    return {
      nombre: nodo.coordinador,
      cargo: `Director de nodo (${nodo.nombreCompleto})`,
      firma: this.getFirmaNodo(nombreNodo)
    };

  }

  /**
   * Retorna la información del Director del Nodo
   * utilizando el nombre completo del nodo.
   *
   * Ejemplo:
   *
   * Nodo Bosa Porvenir
   * Nodo Universidad Nacional
   * Nodo Kennedy
   */
  getDirectorNodoByNombreCompleto(
    nombreCompleto: string
  ): {
    nombre: string;
    cargo: string;
    firma: string;
  } | null {

    const entry = Object.entries(this.NODOS).find(
      ([, nodo]) => nodo.nombreCompleto === nombreCompleto
    );

    if (!entry) {
      return null;
    }

    const [clave, nodo] = entry;

    return {
      nombre: nodo.coordinador,
      cargo: `Director de nodo (${nodo.nombreCompleto})`,
      firma: this.getFirmaNodo(clave)
    };

  }

  /* ---------------------------------------------------------------------------
     INFORMACIÓN DEL NODO
  --------------------------------------------------------------------------- */

  /**
   * Devuelve la información completa del nodo.
   */
  getNodoInfo(
    nombrePestaña: string
  ): NodoInfo | null {

    return this.NODOS[nombrePestaña] ?? null;

  }

  /**
   * Devuelve las claves de todos los nodos
   * actualmente registrados.
   *
   * Ejemplo:
   *
   * BOSA
   * UNAL
   * KENNEDY
   */
  getNodoKeys(): string[] {

    return Object.keys(this.NODOS);

  }

}