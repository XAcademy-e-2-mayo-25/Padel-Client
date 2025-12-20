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

export interface Slot {
  idCanchaTurno: number;
  idClub: number;
  idCancha: number;
  idTurno: number;
  disponible: boolean;
  precio: number;
  cancha?: Cancha;
  turno?: Turno;
}

export interface CrearSlotPayload {
  idClub: number;
  idCancha: number;
  idTurno: number;
  precio: number;
  disponible?: boolean;
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

export interface Turno {
  idTurno: number;
  idClub: number;
  fecha: string | null;
  diaSemana: number | null;
  horaDesde: string;
  horaHasta: string;
  club?: Club;
}

export interface CrearTurnoPayload {
  idClub: number;
  fecha?: string;
  diaSemana?: number | string;
  horaDesde: string;
  horaHasta: string;
}

export interface ListarTurnosParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc';
  idClub?: number;
  fecha?: string;
  diaSemana?: number;
  horaDesde?: string;
  horaHasta?: string;
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

  listarCanchas(idClub: number, params?: { page?: number; limit?: number }): Observable<Paginado<Cancha> | Cancha[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        httpParams = httpParams.set(key, String(value));
      });
    }

    httpParams = httpParams.set('idClub', String(idClub));

    return this.http.get<Paginado<Cancha> | Cancha[]>(`${this.apiUrl}/canchas`, {
      params: httpParams
    });
  }

  listarTurnos(params: ListarTurnosParams): Observable<Paginado<Turno>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      httpParams = httpParams.set(key, String(value));
    });

    return this.http.get<Paginado<Turno>>(`${this.apiUrl}/turnos`, { params: httpParams });
  }

  crearTurno(payload: CrearTurnoPayload): Observable<{ mensaje: string; turno: Turno }> {
    return this.http.post<{ mensaje: string; turno: Turno }>(`${this.apiUrl}/turnos`, payload);
  }

  listarSlots(params: ListarSlotsParams): Observable<Paginado<Slot>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      httpParams = httpParams.set(key, String(value));
    });

    return this.http.get<Paginado<Slot>>(`${this.apiUrl}/turnos/canchas`, { params: httpParams });
  }

  crearSlot(payload: CrearSlotPayload): Observable<{ mensaje: string; turno: Turno; canchaTurno: Slot }> {
    return this.http.post<{ mensaje: string; turno: Turno; canchaTurno: Slot }>(`${this.apiUrl}/slots`, payload);
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
export interface ListarSlotsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc';
  idClub?: number;
  idTurno?: number;
  idCancha?: number;
  disponible?: boolean;
}
