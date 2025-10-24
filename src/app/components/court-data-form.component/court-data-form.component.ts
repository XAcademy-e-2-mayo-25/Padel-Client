import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-court-data-form',
  templateUrl: './court-data-form.component.html',
  styleUrls: ['./court-data-form.component.css'],
  imports: [CommonModule]
})
export class CourtDataFormComponent {
  continuar() {
    throw new Error('Method not implemented.');
  }
  configurarDespues() {
    throw new Error('Method not implemented.');
  }
  volver() {
    throw new Error('Method not implemented.');
  }
}
