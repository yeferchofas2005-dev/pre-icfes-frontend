import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.css'
})
export class ChatbotWidgetComponent {
  isOpen = false;
  isLoaded = false;

  toggleWidget() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.isLoaded) {
      // Lazy load the iframe content
      this.isLoaded = true;
    }
  }
}
