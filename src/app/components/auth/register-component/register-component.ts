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
    private usuarioService: UsuarioService,
    private router: Router
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
    this.authService.loadUserData().subscribe({
      next: () => this.evaluateProfileCompletion(),
      error: () => this.authService.logout()
    });
  }

  private evaluateProfileCompletion(): void {
    this.authService.verifyToken().subscribe({
      next: (response) => {
        const userId = response?.id ?? response?.user?.id;

        if (!userId) {
          this.router.navigate(['/update-profile']);
          return;
        }

        this.usuarioService.obtenerUsuario(userId).subscribe({
          next: (usuario) => {
            const perfil = this.normalizeUsuario(usuario);
            if (perfil && this.isProfileComplete(perfil)) {
              this.router.navigate(['/player/player-dashboard']);
            } else {
              this.router.navigate(['/update-profile']);
            }
          },
          error: () => this.router.navigate(['/update-profile'])
        });
      },
      error: () => this.authService.logout()
    });
  }

  private normalizeUsuario(usuario: any): any | null {
    if (!usuario) return null;
    return usuario.usuario ?? usuario;
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
