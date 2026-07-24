import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
    // Apunta a la ruta específica del chatbot (/chatbot) en el servidor de Next.js
    this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://chat-bot-preicfes.vercel.app/chatbot');
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }
}
