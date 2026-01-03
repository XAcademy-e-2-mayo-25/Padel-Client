import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../services/auth/auth.service';
import {
  ClubService,
  Cancha,
  ReservaTurno
} from '../../../services/club/club.service';

/* ===== Tipos UI ===== */

type CanchaUI = Cancha & {
  precio?: number;
  diasSemana?: number;
  horaDesde?: string;
  horaHasta?: string;
  rangoSlotMinutos?: number;
};

type SlotUI = {
  index: number;
  desde: string;
  hasta: string;
  reservado: boolean;
};

@Component({
  selector: 'app-club-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-statistics.html',
  styleUrls: ['./club-statistics.css'],
})
export class ClubStatistics implements OnInit {

  /* ===== Estado general ===== */

  loading = false;
  error: string | null = null;

  idClub: number | null = null;

  /* ===== Datos ===== */

  canchas: CanchaUI[] = [];
  turnosPorCancha: Record<number, SlotUI[]> = {};

  fechaSeleccionada: string = this.todayISO();
  reservas: ReservaTurno[] = [];

  constructor(
    private authService: AuthService,
    private clubService: ClubService
  ) {}

  /* ===== Ciclo de vida ===== */

  ngOnInit(): void {
    this.loading = true;

    this.authService.verifyToken().pipe(
      switchMap(resp => {
        const userId = resp?.id;
        if (!userId) throw new Error('Usuario no identificado');
        return this.clubService.buscarClubPorUsuario(userId);
      }),
      switchMap(club => {
        if (!club?.idClub) throw new Error('No se encontró club');
        this.idClub = club.idClub;
        return this.clubService.listarCanchas(this.idClub, { page: 1, limit: 50 });
      }),
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (resp: any) => {
        this.canchas = resp?.items ?? resp ?? [];

        // Generar slots por cancha
        this.canchas.forEach(c => this.generarTurnos(c));

        // Cargar reservas del día
        this.cargarReservas();
      },
      error: () => {
        this.error = 'No se pudieron cargar las canchas del club.';
        this.canchas = [];
      }
    });
  }

  /* ===== Reservas ===== */

  cargarReservas(): void {
    if (!this.idClub) return;

    this.clubService
      .listarReservasClub(this.idClub, { fecha: this.fechaSeleccionada })
      .subscribe({
        next: (data) => {
          this.reservas = Array.isArray(data) ? data : [];
          this.aplicarReservasASlots();
        },
        error: () => {
          this.reservas = [];
        }
      });
  }

  aplicarReservasASlots(): void {
    this.canchas.forEach(cancha => {
      const slots = this.turnosPorCancha[cancha.idCancha];
      if (!slots) return;

      const reservasCancha = this.reservas.filter(
        r => r.idCancha === cancha.idCancha
      );

      reservasCancha.forEach(reserva => {
        for (let i = 0; i < reserva.slotCount; i++) {
          const idx = reserva.slotIndexDesde + i;
          if (slots[idx]) {
            slots[idx].reservado = true;
          }
        }
      });
    });
  }

  /* ===== Turnos ===== */

  generarTurnos(cancha: CanchaUI): void {
    if (
      !cancha.horaDesde ||
      !cancha.horaHasta ||
      !cancha.rangoSlotMinutos
    ) {
      this.turnosPorCancha[cancha.idCancha] = [];
      return;
    }

    const [dh, dm] = cancha.horaDesde.split(':').map(Number);
    const [hh, hm] = cancha.horaHasta.split(':').map(Number);

    const startMin = dh * 60 + dm;
    const endMin = hh * 60 + hm;
    const rango = Number(cancha.rangoSlotMinutos);

    const slots: SlotUI[] = [];
    let idx = 0;

    for (let t = startMin; t + rango <= endMin; t += rango) {
      slots.push({
        index: idx++,
        desde: this.minToHHmm(t),
        hasta: this.minToHHmm(t + rango),
        reservado: false,
      });
    }

    this.turnosPorCancha[cancha.idCancha] = slots;
  }

  /* ===== Helpers UI ===== */

  formatHorario(cancha: { horaDesde?: string; horaHasta?: string }): string {
    const desde = cancha.horaDesde ?? '-';
    const hasta = cancha.horaHasta ?? '-';
    return `${desde} - ${hasta}`;
  }

  formatDiasSemana(mask?: number): string {
    const m = Number(mask ?? 0);
    if (!m) return '-';

    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const enabled: string[] = [];

    for (let i = 0; i < 7; i++) {
      if (m & (1 << i)) enabled.push(labels[i]);
    }

    return enabled.join(', ');
  }

  private todayISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private minToHHmm(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
