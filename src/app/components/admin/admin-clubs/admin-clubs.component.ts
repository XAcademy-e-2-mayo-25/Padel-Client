import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { finalize, switchMap, of, catchError } from "rxjs";

import { Club, ClubService, Paginado } from "../../../services/club/club.service";
import { AuthService } from "../../../services/auth/auth.service";
import { UsuarioService } from "../../../services/usuario/usuario.service";
import { ROLES } from "../../../services/rol/rol.service";

@Component({
  selector: 'app-admin-clubs',
  standalone: true,
  templateUrl: './admin-clubs.component.html',
  styleUrls: ['./admin-clubs.component.css'],
  imports: [CommonModule, FormsModule]
})
export class AdminClubsComponent implements OnInit {
  clubs: Club[] = [];
  loading = false;
  error: string | null = null;
  message: string | null = null;
  searchTerm = '';
  actingClubId: number | null = null;
  actingState: number | null = null;

  constructor(
    private router: Router,
    private clubService: ClubService,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  get filteredClubs(): Club[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.clubs;
    return this.clubs.filter(c => {
      const name = (c.nombreFantasia || c.razonSocial || '').toLowerCase();
      const cuit = (c.cuitCuil || '').toLowerCase();
      const loc = `${c.localidad || ''} ${c.provincia || ''}`.toLowerCase();
      return name.includes(term) || cuit.includes(term) || loc.includes(term);
    });
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  loadClubs(): void {
    this.loading = true;
    this.error = null;
    this.message = null;
    this.clubService.listarClubs({ page: 1, limit: 100 }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (resp: Paginado<Club>) => {
        this.clubs = resp.items ?? [];
      },
      error: () => {
        this.error = 'No pudimos cargar los clubes.';
      }
    });
  }

  estadoLabel(estado: number): string {
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Habilitado';
      case 3: return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  estadoClass(estado: number): string {
    switch (estado) {
      case 1: return 'badge bg-warning text-dark';
      case 2: return 'badge bg-success';
      case 3: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  formatDate(date?: string | null): string {
    if (!date) return 'N/D';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/D';
    return d.toLocaleString();
  }

  private descripcionPorEstadoClub(estado: number): string {
    switch (estado) {
      case 1: return 'En revisión..';
      case 2: return 'Habilitado como club';
      case 3: return 'Club no cumple con los requisitos para ser autorizado';
      default: return 'Actualización de estado';
    }
  }

  setEstado(club: Club, estado: number): void {
    if (this.actingClubId) return;

    this.error = null;
    this.message = null;
    this.actingClubId = club.idClub;
    this.actingState = estado;

    // 1) Cambia estado del club
    this.clubService.actualizarClub(club.idClub, { idEstadoClub: estado }).pipe(
      // 2) Luego cambia estado del rol CLUB (idRol=3) del usuario dueño del club
      switchMap(() => {
        const idUsuario = Number((club as any)?.idUsuario);
        if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
          // Si por alguna razón no viene idUsuario, no rompemos todo el flujo.
          return of(null);
        }

        return this.usuarioService.actualizarRoles(idUsuario, {
          roles: [ROLES.CLUB],
          estados: [{
            idRol: ROLES.CLUB,
            idEstado: estado, // 1 pendiente, 2 habilitado, 3 rechazado
            descripcion: this.descripcionPorEstadoClub(estado)
          }],
          defaultEstado: estado
        }).pipe(
          // Si falla roles, mostramos mensaje pero no deshacemos el cambio de club.
          catchError((e) => {
            console.error('[AdminClubs] actualizarRoles error:', e);
            // devolvemos null para continuar al next del subscribe
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.actingClubId = null;
        this.actingState = null;
      })
    ).subscribe({
      next: () => {
        // Actualizar en memoria para no recargar todo
        this.clubs = this.clubs.map(c =>
          c.idClub === club.idClub ? { ...c, idEstadoClub: estado, updatedAt: new Date().toISOString() } : c
        );

        const label = this.estadoLabel(estado);
        this.message = `El club "${club.nombreFantasia ?? club.razonSocial ?? club.idClub}" ahora está ${label}.`;
      },
      error: (e) => {
        console.error(e);
        this.error = 'No se pudo actualizar el estado del club.';
      }
    });
  }
}
