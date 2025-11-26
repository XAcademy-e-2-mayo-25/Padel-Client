import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    console.log('[NotAuthGuard] Ejecutando canActivate');

    // Si ya está autenticado (hay token en localStorage)
    if (this.authService.isAuthenticated()) {
      console.log('[NotAuthGuard] Usuario autenticado -> redirigiendo a /home');
      return this.router.createUrlTree(['/home']);
    }

    // Si no está autenticado, puede entrar a /register
    console.log('[NotAuthGuard] Usuario NO autenticado -> permitiendo acceso a rutas públicas');
    return true;
  }
}
