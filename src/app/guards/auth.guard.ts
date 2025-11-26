// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    // Si está autenticado, puede entrar a las rutas protegidas
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Si NO está autenticado, lo mandamos al register
    return this.router.createUrlTree(['/register']);
  }
}
