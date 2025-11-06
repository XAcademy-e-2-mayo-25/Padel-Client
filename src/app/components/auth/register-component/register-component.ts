import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register-component',
  imports: [],
  templateUrl: './register-component.html',
  styleUrls: ['./register-component.css']
})

export class RegisterComponent  {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.setToken(token);
        this.router.navigate(['/update-profile']); // acá redirigimos donde queramos
      } else {
        this.router.navigate(['/register']);
      }
    });
  }

  loginWithGoogle(): void {
  this.authService.loginWithGoogle();
}

}
