import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeTransitionAnimations } from './animations';
import { ChatbotWidget } from './chatbot-widget/chatbot-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotWidget],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeTransitionAnimations]
})
export class App {
  protected readonly title = signal('pre-icfes-gratuito-frontend');

  getRouteAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
