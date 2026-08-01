import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.css'
})
export class ChatbotWidget {
  isOpen = signal(false);
  chatbotUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // Apunta a la ruta específica del chatbot (/chatbot) definida en el entorno
    this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.chatbotUrl);
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }
}
