import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParamListarUsuario } from '../../interfaces/lista-usuarios.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:3000/usuarios';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // GET /usuarios (listar con filtros opcionales)
  listarUsuarios(p: ParamListarUsuario): Observable<any> {
    let params = new HttpParams();

      Object.entries(p).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any>(this.apiUrl, { params });
  }

  // GET /usuarios/:id
  obtenerUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, {
      headers: this.authHeaders()
    });
  }


  // PATCH /usuarios/:id
  editarUsuario(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data, {
      headers: this.authHeaders()
    });
  }

  // PATCH /usuarios/:id/ban
  banearUsuario(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/ban`, data);
  }

  // PATCH /usuarios/:id/unban
  desbanearUsuario(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/unban`, data);
  }

  // PUT /usuarios/:id/posiciones
  actualizarPosiciones(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/posiciones`, data);
  }

  // PUT /usuarios/:id/roles
  actualizarRoles(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/roles`, data);
  }

  // GET /usuarios/me/matches
listarMisPartidos(): Observable<any[]> {
  const token = localStorage.getItem('token');

  return this.http.get<any[]>(
    `${this.apiUrl}/me/matches`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

}
