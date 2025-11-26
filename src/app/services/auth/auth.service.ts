import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

const apiUrl = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  loginWithGoogle() {
    console.log('[AuthService] loginWithGoogle -> redirigiendo a', `${this.apiUrl}/google`);
    window.location.href = `${this.apiUrl}/google`;
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();
    console.log('[AuthService] verifyToken -> token actual:', token);
    return this.http.get(`${this.apiUrl}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Método que guarda el token JWT en localStorage
  setToken(token: string) {
    console.log('[AuthService] setToken -> guardando token:', token);
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    const t = localStorage.getItem('token');
    console.log('[AuthService] getToken ->', t);
    return t;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const result = !!token;
    console.log('[AuthService] isAuthenticated ->', result);
    return result;
  }

  logout() {
    console.log('[AuthService] logout -> borrando token y navegando a /register');
    localStorage.removeItem('token');
    this.router.navigate(['/register']);
  }
}
