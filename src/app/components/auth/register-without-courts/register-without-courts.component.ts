import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register-without-courts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-without-courts.component.html'
})
export class RegisterWithoutCourtsComponent {
  constructor(private router: Router) {}

  // Ir al formulario para agregar canchas
  goToCourtForm() {
    this.router.navigate(['/court-data']);
  }

  // Continuar como jugador / ir al menú jugador
  continueAsPlayer() {
    this.router.navigate(['/player']);
  }
}
