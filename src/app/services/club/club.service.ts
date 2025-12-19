import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

const BASE_URL = 'http://localhost:3000';

export interface Club {
  idClub: number;
  idUsuario: number;
  razonSocial: string | null;
  nombreFantasia: string | null;
  cuitCuil: string;
  provincia: string;
  localidad: string;
  direccion: string;
  idEstadoClub: number;
}

export interface ClubResponse {
  mensaje: string;
  club: Club;
}

export interface CrearClubPayload {
  idUsuario: number;
  razonSocial?: string;
  nombreFantasia?: string;
  cuitCuil: string;
  provincia: string;
  localidad: string;
  direccion: string;
}

export interface CrearCanchaPayload {
  idClub: number;
  denominacion: string;
  cubierta?: boolean;
  observaciones?: string | null;
}

export interface Cancha {
  idCancha: number;
  idClub: number;
  denominacion: string;
  cubierta: boolean;
  observaciones?: string | null;
}

export interface CrearDatosPagoPayload {
  idClub: number;
  metodoPago: string;
  cbu?: string;
  cvu?: string;
  alias?: string;
  dniCuitCuil?: string;
  titular?: string;
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  activo?: boolean;
}

export interface Paginado<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

export interface ListarClubParams {
  page?: number;
  limit?: number;
  idEstadoClub?: number;
  idUsuario?: number;
}

export interface ListarCanchaParams {
  idClub: number;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly apiUrl = `${BASE_URL}/clubs`;
  private readonly storageKey = 'current_club_id';

  constructor(private http: HttpClient) {}

  crearClub(payload: CrearClubPayload): Observable<ClubResponse> {
    return this.http.post<ClubResponse>(this.apiUrl, payload).pipe(
      tap(resp => this.setCurrentClubId(resp.club.idClub))
    );
  }

  crearCancha(payload: CrearCanchaPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/canchas`, payload);
  }

  crearDatosPago(payload: CrearDatosPagoPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/datos-pago`, payload);
  }

  listarClubs(params: ListarClubParams): Observable<Paginado<Club>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<Paginado<Club>>(this.apiUrl, { params: httpParams });
  }

  actualizarClub(idClub: number, data: Partial<CrearClubPayload> & { idEstadoClub?: number }): Observable<Club> {
    return this.http.patch<Club>(`${this.apiUrl}/${idClub}`, data);
  }

  listarCanchas(params: ListarCanchaParams): Observable<Paginado<Cancha>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<Paginado<Cancha>>(`${this.apiUrl}/canchas`, { params: httpParams });
  }

  obtenerClub(idClub: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${idClub}`).pipe(
      tap(club => this.setCurrentClubId(club.idClub))
    );
  }

  buscarClubPorUsuario(idUsuario: number): Observable<Club | null> {
    const params = new HttpParams()
      .set('idUsuario', idUsuario)
      .set('limit', '1');

    return this.http.get<Paginado<Club>>(this.apiUrl, { params }).pipe(
      map(resp => resp.items?.[0] ?? null),
      tap(club => {
        if (club) {
          this.setCurrentClubId(club.idClub);
        }
      })
    );
  }

  getCurrentClubId(): number | null {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? Number(stored) : null;
  }

  setCurrentClubId(idClub: number | null): void {
    if (idClub) {
      localStorage.setItem(this.storageKey, String(idClub));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  clearCurrentClubId(): void {
    localStorage.removeItem(this.storageKey);
  }
}
