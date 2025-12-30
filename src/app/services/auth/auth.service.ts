import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, of, map } from 'rxjs';
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
    window.location.href = `${this.apiUrl}/google`;
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();

    // Evita confusión con 304/ETag en debug
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });

    return this.http.get(`${this.apiUrl}/verify`, { headers });
  }

  //Devuelve el ID del usuario verificado como number
  getVerifiedUserId(): Observable<number> {
    return this.verifyToken().pipe(
      map((resp: any) => {
        const raw =
          resp?.id ??
          resp?.user?.id ??
          resp?.user?.idUsuario ??
          resp?.sub ??
          resp?.payload?.sub;

        const id = Number(raw);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error('No se pudo identificar el usuario (id inválido)');
        }
        return id;
      })
    );
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  loadUserData(): Observable<UserWithRoles | null> {
    return this.verifyToken().pipe(
      switchMap(response => {
        const id = response?.id ?? response?.user?.id;
        if (response?.valid && id) {
          return this.http.get<UserWithRoles>(`${this.usuariosUrl}/${id}`);
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
