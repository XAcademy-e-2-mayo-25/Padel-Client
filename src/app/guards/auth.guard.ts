import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/register']);
      return of(false);
    }

    // ✅ Llama al backend para verificar que el token sea válido
    return this.authService.verifyToken().pipe(
      map(() => true),
      catchError(() => {
        // Si el backend dice que el token no sirve, se borra y redirige
        this.authService.logout();
        this.router.navigate(['/register']);
        return of(false);
      })
    );
  }
}
