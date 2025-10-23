import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './player-dashboard.component.html',
  styleUrl: './player-dashboard.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlayerDashboard {
navigateTo(arg0: string) {
throw new Error('Method not implemented.');
}
logout() {
throw new Error('Method not implemented.');
}
  playerName: string = 'Jugador';
}
