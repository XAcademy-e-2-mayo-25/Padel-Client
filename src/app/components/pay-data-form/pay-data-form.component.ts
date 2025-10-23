import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pay-data-form.component',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pay-data-form.component.html',
  styleUrl: './pay-data-form.component.css',
})
export class PayDataFormComponent {
  form: any;
  router: any;
  submit() {
    throw new Error('Method not implemented.');
  }
  goBack() {
    throw new Error('Method not implemented.');
  }
}
