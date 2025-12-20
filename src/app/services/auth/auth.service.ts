import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, of } from 'rxjs';
import { RolService, UserWithRoles } from '../rol/rol.service';

const apiUrl = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${apiUrl}/auth`;
  private usuariosUrl = `${apiUrl}/usuarios`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private rolService: RolService
  ) {}

  loginWithGoogle() {
    // Redirige al endpoint del backend que inicia el flujo de Google OAuth
    window.location.href = `${this.apiUrl}/google`;
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();
    return this.http.get(`${this.apiUrl}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Método que guarda el token JWT en localStorage
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  /**
   * Carga los datos del usuario después del login para obtener los roles
   */
  loadUserData(): Observable<UserWithRoles | null> {
    return this.verifyToken().pipe(
      switchMap(response => {
        if (response.valid && response.user?.id) {
          // Obtener datos completos del usuario incluyendo roles
          return this.http.get<UserWithRoles>(`${this.usuariosUrl}/${response.user.id}`);
        }
        return of(null);
      }),
      tap(userData => {
        if (userData) {
          console.log('[AuthService] Usuario cargado con roles:', userData);
          this.rolService.setUserData(userData);
        }
      })
    );
  }

  /**
   * Obtiene el ID del usuario actual desde el token verificado
   */
  getCurrentUserId(): number | null {
    const userData = this.rolService.getUserData();
    return userData?.idUsuario ?? null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  logout() {
    localStorage.removeItem('token');
    this.rolService.clearRoles();
    this.router.navigate(['/register']);
  }
}
