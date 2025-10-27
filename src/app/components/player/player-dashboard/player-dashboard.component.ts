import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';





@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-dashboard.component.html',
  styleUrl: './player-dashboard.component.css'
})
export class PlayerDashboard {
  playerName: string = 'Jugador'; 
calendarUrl: any;
googleCalendarCreateUrl: any;

  constructor(private router: Router) {}

  // Añade estos métodos que faltan
  logout(): void {
    // Lógica para cerrar sesión
    console.log('Cerrando sesión...');
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }
}
