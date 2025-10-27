import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-success.component.html',
})
export class RegisterSuccessComponent {
  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['/home']); 
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
