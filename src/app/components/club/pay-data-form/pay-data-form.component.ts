import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-pay-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pay-data-form.component.html'
})

export class PayDataFormComponent {
  form: any;
  router: any;
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // simulación de guardado
    console.log('Datos de pago guardados:', this.form.value);

    // ir a la pantalla de éxito
    this.router.navigate(['/registro-exitoso']);
  }

  
  goBack() {
    this.router.navigate(['/court-data']);
  }
}
