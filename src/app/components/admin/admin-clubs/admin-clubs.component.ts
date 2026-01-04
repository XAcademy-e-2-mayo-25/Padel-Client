import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { Club, ClubService, Paginado } from "../../../services/club/club.service";
import { AuthService } from "../../../services/auth/auth.service";

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

  setEstado(club: Club, estado: number): void {
    if (this.actingClubId) return;
    this.error = null;
    this.message = null;
    this.actingClubId = club.idClub;
    this.actingState = estado;

    this.clubService.actualizarClub(club.idClub, { idEstadoClub: estado }).pipe(
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
      error: () => {
        this.error = 'No se pudo actualizar el estado del club.';
      }
    });
  }
}
