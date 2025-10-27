// court-data-form.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-court-data-form',
  templateUrl: './court-data-form.component.html',
  styleUrls: ['./court-data-form.component.css'],
  imports: [CommonModule]
})
export class CourtDataFormComponent {
  horarios: string[] = [];

  constructor(private router: Router) {
    this.generarHorarios();
  }

  generarHorarios() {
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hora = i.toString().padStart(2, '0');
        const minuto = j.toString().padStart(2, '0');
        this.horarios.push(`${hora}:${minuto}`);
      }
    }
  }

  configurarDespues() {
    // Navega directamente al home sin guardar datos
    console.log('Configuración de canchas pospuesta');
    this.router.navigate(['/pay-data']);
  }

  continuar() {

    console.log('Guardando datos de canchas...');


    this.router.navigate(['/pay-data']);
  }

  volver() {
    this.router.navigate(['/register-form']);
  }
}
