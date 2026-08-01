import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly PUBLIC_KEY = environment.emailjsPublicKey;
  private readonly SERVICE_ID = environment.emailjsServiceId;
  private readonly TEMPLATE_ID = environment.emailjsTemplateId;

  constructor() {
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Envía un correo automático de bienvenida/información al usuario suscrito.
   * @param email Correo electrónico ingresado por el usuario en el formulario.
   */
  async sendSubscriptionEmail(email: string): Promise<void> {
    const templateParams = {
      to_email: email,
      email: email,
      user_email: email,
      recipient_email: email,
      send_to: email,
      to: email,
      reply_to: 'preicfesjovenesbogota@gmail.com'
    };

    await emailjs.send(
      this.SERVICE_ID,
      this.TEMPLATE_ID,
      templateParams,
      this.PUBLIC_KEY
    );
  }
}
