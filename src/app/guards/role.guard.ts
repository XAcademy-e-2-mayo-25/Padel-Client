import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { RolService, ROLES } from '../services/rol/rol.service';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard base para verificación de roles.
 * Verifica que el usuario esté autenticado Y tenga el rol requerido.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private rolService: RolService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    // Primero verificar autenticación
    if (!this.authService.isAuthenticated()) {
      console.log('[RoleGuard] Usuario no autenticado, redirigiendo a /register');
      return this.router.createUrlTree(['/register']);
    }

    // Obtener roles requeridos desde la data de la ruta
    const requiredRoles = route.data['roles'] as number[];

    if (!requiredRoles || requiredRoles.length === 0) {
      // Si no hay roles requeridos, permitir acceso
      return true;
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = this.rolService.hasAnyRole(requiredRoles);

    if (hasRole) {
      console.log('[RoleGuard] Usuario tiene rol requerido, acceso permitido');
      return true;
    }

    console.log('[RoleGuard] Usuario no tiene rol requerido, redirigiendo a /home');
    return this.router.createUrlTree(['/home']);
  }
}

/**
 * Guard específico para rutas de JUGADOR (rol 2)
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerGuard implements CanActivate {
  constructor(
    private rolService: RolService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/register']);
    }

    if (this.rolService.hasRole(ROLES.JUGADOR)) {
      console.log('[PlayerGuard] Usuario es JUGADOR, acceso permitido');
      return true;
    }

    console.log('[PlayerGuard] Usuario NO es JUGADOR, redirigiendo a /home');
    return this.router.createUrlTree(['/home']);
  }
}

/**
 * Guard específico para rutas de CLUB (rol 3)
 */
@Injectable({
  providedIn: 'root'
})
export class ClubGuard implements CanActivate {
  constructor(
    private rolService: RolService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/register']);
    }

    if (this.rolService.hasRole(ROLES.CLUB)) {
      console.log('[ClubGuard] Usuario es CLUB, acceso permitido');
      return true;
    }

    console.log('[ClubGuard] Usuario NO es CLUB, redirigiendo a /home');
    return this.router.createUrlTree(['/home']);
  }
}

/**
 * Guard específico para rutas de ADMINISTRADOR (rol 1)
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private rolService: RolService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/register']);
    }

    if (this.rolService.hasRole(ROLES.ADMIN)) {
      console.log('[AdminGuard] Usuario es ADMIN, acceso permitido');
      return true;
    }

    console.log('[AdminGuard] Usuario NO es ADMIN, redirigiendo a /home');
    return this.router.createUrlTree(['/home']);
  }
}
