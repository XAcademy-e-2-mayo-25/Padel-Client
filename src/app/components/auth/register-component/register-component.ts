import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UsuarioService } from '../../../services/usuario/usuario.service';

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
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.setToken(token);
        this.redirectAfterLogin();
      } else {
        this.router.navigate(['/register']);
      }
    });
  }

  private redirectAfterLogin(): void {
    this.authService.verifyToken().subscribe({
      next: (response) => {
        const userId = response?.id;

        if (!userId) {
          this.router.navigate(['/update-profile']);
          return;
        }

        this.usuarioService.obtenerUsuario(userId).subscribe({
          next: (usuario) => {
            if (this.isProfileComplete(usuario)) {
              this.router.navigate(['/player/player-dashboard']);
            } else {
              this.router.navigate(['/update-profile']);
            }
          },
          error: () => this.router.navigate(['/update-profile'])
        });
      },
      error: () => {
        this.authService.logout();
      }
    });
  }

  private isProfileComplete(usuario: any): boolean {
    if (!usuario) return false;
    const requiredFields = ['nombres', 'apellidos', 'dni', 'telefono', 'localidad', 'provincia'];
    return requiredFields.every(field => !!usuario[field]);
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
