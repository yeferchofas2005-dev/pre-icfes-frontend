import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotWidgetComponent } from './chatbot-widget/chatbot-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pre-icfes-gratuito-frontend');
}
