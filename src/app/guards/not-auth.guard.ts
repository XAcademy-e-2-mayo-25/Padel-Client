import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = this.authService.getToken();

    if (!token) return of(true);

    return this.authService.verifyToken().pipe(
      map(() => {
        // Si el token es válido, lo redirigimos al home
        this.router.navigate(['/home']);
        return false;
      }),
      catchError(() => {
        // Si el token no es válido, puede acceder al login/register
        this.authService.logout();
        return of(true);
      })
    );
  }
}
