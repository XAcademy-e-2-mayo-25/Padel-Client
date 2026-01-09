import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Club } from '../../../services/club/club.service';

@Component({
  selector: 'app-club-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-profile.component.html',
  styleUrls: ['./club-profile.component.css'],
})
export class ClubProfileComponent implements OnInit {
  club!: Club;
  loading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private clubService: ClubService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClub();
  }

  private cargarClub(): void {
    this.loading = true;
    this.error = null;

    const idClub = this.clubService.getCurrentClubId();

    if (!idClub) {
      this.error = 'No se encontró el club actual (current_club_id).';
      this.loading = false;
      return;
    }

    this.getClubById(idClub);
  }

  private getClubById(idClub: number): void {
    this.clubService.obtenerClub(idClub).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (club: Club) => {
        this.club = club;
      },
      error: (e) => {
        console.error(e);
        this.error = 'Error cargando el perfil del club.';
      }
    });
  }

  goBack(): void {
    // Dashboard del club
    this.router.navigate(['/club-dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }

  estadoLabel(estado: number): string {
    switch (Number(estado)) {
      case 1: return 'Pendiente';
      case 2: return 'Habilitado';
      case 3: return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  estadoChipClass(estado: number): string {
    switch (Number(estado)) {
      case 2: return 'chip chip-ok';
      case 1: return 'chip chip-warn';
      case 3: return 'chip chip-bad';
      default: return 'chip chip-muted';
    }
  }
}
