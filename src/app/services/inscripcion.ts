
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InscripcionData {
  // Aviso de privacidad
  aceptaPrivacidad: boolean;
  
  // Datos personales
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoIdentidad?: File | null;
  fechaNacimiento: string;
  comunidad: string;
  genero: string;
  generoOtro?: string;
  estrato: string;
  celular: string;
  correo: string;
  eps: string;
  
  // Contacto emergencia
  nombreContactoEmergencia: string;
  parentezcoContactoEmergencia: string;
  parentezcoOtro?: string;
  numeroContactoEmergencia: string;
  correoContactoEmergencia: string;
  
  // Consentimiento informado
  consentimientoInformado?: File | null;
  
  // Localidad y nodo
  localidadResidencia: string;
  ciudadOrigen?: string;
  nodoPreferido: string;
  
  // Información educativa
  cursandoGrado11: string;
  nombreInstitucion?: string;
  contactoInstitucion?: string;
  razonParticipar: string;
  inscritoSaber11?: string;
  queEstudiar?: string;
  institucionSuperior: string;
  
  // Simulacro
  dispuestoPagarSimulacro: string;
  comoSeEntero: string;
  
  // Timestamp
  fechaRegistro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  /**
   * URL del Google Apps Script Web App
   * ID de implementación: AKfycbxZRpUUEk_5QtOoeFb8DgCCzHntjF4d5P41yZZmkiP7JJ_KVjCP_V960oZSVAZGSMt9
   */
  private readonly GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIboqgSDute95LV_0oEYu55CsGBuEozRcVoKrY9LObHBAs97jtYA33PbNjnkU7ijag/exec';

  constructor(private http: HttpClient) {}

  enviarInscripcion(
    data: InscripcionData,
    documentoBase64: string | null,
    consentimientoBase64: string | null
  ): Observable<any> {
  
    const formData = new FormData();
  
    // Datos JSON
    formData.append(
      'data',
      JSON.stringify({
        ...data,
        fechaRegistro: new Date().toISOString()
      })
    );
  
    // PDFs en base64
    if (documentoBase64) {
      formData.append('documentoIdentidad', documentoBase64);
    }
  
    if (consentimientoBase64) {
      formData.append('consentimientoInformado', consentimientoBase64);
    }
  
    return this.http.post(
      this.GOOGLE_SCRIPT_URL,
      formData,
      { responseType: 'text' }
    );
  }
}


