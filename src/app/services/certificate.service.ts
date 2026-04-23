import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiKey = 'AIzaSyBPZ6hvV_wwCrhCqzrsPTjNBx3s4HSBYZE'; // Reemplaza con tu API key de Google
  private spreadsheetId = '1ee9Es1yReB8-yYLBb8EW3z2WG6VshKKXmdURAEcg6fw';

  constructor(private http: HttpClient) { }

  getStudentData(sheetName: string, documentNumber: string): Observable<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A:Z?key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const rows = response.values;
        if (!rows || rows.length < 2) return null;

        // Detectar índices de columnas usando headers (primera fila)
        const headers = rows[0].map((h: string) => String(h).toLowerCase().trim());
        console.log('Headers detectados:', headers);
        let docIndex = -1;
        let nameIndex = -1;

        // Buscar columnas de Documento y Nombre
        for (let i = 0; i < headers.length; i++) {
          if (headers[i].includes('documento') || headers[i].includes('doc')) {
            docIndex = i;
          }
          if (headers[i].includes('nombre') || headers[i].includes('estudiante')) {
            nameIndex = i;
          }
        }

        console.log('Índices encontrados - docIndex:', docIndex, 'nameIndex:', nameIndex);

        // Si no encuentra con headers, buscar en toda la fila
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i]) continue;

          // Convertir todas las celdas a string y trim
          const rowData = rows[i].map((cell: any) => String(cell).trim());
          const docToFind = documentNumber.trim();

          // Si se encontraron los índices, usar esos
          if (docIndex !== -1 && nameIndex !== -1) {
            if (rowData[docIndex] === docToFind) {
              console.log('Fila encontrada con índices:', rowData);
              console.log('Nombre en nameIndex:', rowData[nameIndex]);
              return {
                nombre: rowData[nameIndex] || '',
                documento: rowData[docIndex]
              };
            }
          } else {
            // Buscar el documento en cualquier columna
            for (let j = 0; j < rowData.length; j++) {
              if (rowData[j] === docToFind) {
                // Si no hay headers, asumir posiciones: nombre en j-2, documento en j
                const nombreIndex = j - 2 >= 0 ? j - 2 : 0;
                const nombre = rowData[nombreIndex] || '';
                console.log('Fila encontrada sin índices:', rowData);
                console.log('Documento en columna', j, 'Nombre en columna', nombreIndex, ':', nombre);
                return {
                  nombre: nombre,
                  documento: rowData[j]
                };
              }
            }
          }
        }
        return null;
      })
    );
  }

  getDireccion(nodo: string): string {
    const direcciones: { [key: string]: string } = {
      'BOSA': 'Cl. 52 Sur #93d-39, Bogotá',
      'UNAL': 'Ave Cra 30 #45-3, Bogotá',
      'CIUDAD BOLIVAR': 'Calle 68d Bis A Sur #49F - 70',
      'UNIMINUTO PERDOMO': '59 Sur98 Cra. 72',
      'Engativá': 'Cl. 89 Bis #91-20, Engativá, Bogotá',
      'FONTIBÓN': 'Cra. 104b #22, Bogotá',
      'PUENTE ARANDA': 'Cl. 1b #52A-02, Puente Aranda, Bogotá',
      'KENNEDY': 'Cl. 38c Sur #79-08, Kennedy, Bogotá'
    };
    return direcciones[nodo] || '';
  }

  getCoordinador(nodo: string): string {
    const coordinadores: { [key: string]: string } = {
      'BOSA': 'Juan David Santos Poblador',
      'UNAL': 'Camilo Murillo',
      'CIUDAD BOLIVAR': 'Jhoan Manuel Rodríguez Cerinza',
      'UNIMINUTO PERDOMO': 'Por confirmar',
      'Engativá': 'Por confirmar',
      'FONTIBÓN': 'Ariadna Vallecilla',
      'PUENTE ARANDA': 'Por confirmar',
      'KENNEDY': 'José Wolf'
    };
    return coordinadores[nodo] || '';
  }
}