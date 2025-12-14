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

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/register']);
  }
}
