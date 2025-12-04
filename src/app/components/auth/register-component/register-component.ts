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
export class RegisterComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('[RegisterComponent] ngOnInit');

    this.route.queryParams.subscribe(params => {
      console.log('[RegisterComponent] queryParams:', params);

      const token = params['token'];

      if (token) {
        console.log('[RegisterComponent] Token recibido por query param:', token);
        this.authService.setToken(token);

        // Cargar datos del usuario incluyendo roles antes de navegar
        this.authService.loadUserData().subscribe({
          next: (userData) => {
            console.log('[RegisterComponent] Datos de usuario cargados:', userData);
            console.log('[RegisterComponent] Navegando a /home');
            this.router.navigate(['/home']);
          },
          error: (err) => {
            console.error('[RegisterComponent] Error al cargar datos del usuario:', err);
            // Navegar de todos modos, los guards manejarán el caso
            this.router.navigate(['/home']);
          }
        });
      } else {
        console.log('[RegisterComponent] No hay token en query params, mostrando formulario');
      }
    });
  }

  loginWithGoogle(): void {
    console.log('[RegisterComponent] loginWithGoogle clicked');
    this.authService.loginWithGoogle();
  }
}
