import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../services/auth/auth.service';
import { ClubService } from '../../../services/club/club.service';

type Club = {
  idClub: number;
  nombreFantasia: string | null;
  provincia: string;
  localidad: string;
  direccion: string;
  idEstadoClub: number;
};

type Cancha = {
  idCancha: number;
  idClub: number;
  denominacion: string;
  cubierta: boolean;
  observaciones?: string | null;

  diasSemana?: number;
  horaDesde?: string;
  horaHasta?: string;
  rangoSlotMinutos?: number;
  precio?: number;
};

type SlotUI = {
  index: number;
  label: string; // "16:00"
  desde: string;
  hasta: string;
};

@Component({
  selector: 'app-player-reservations',
  templateUrl: './player-reservations.component.html',
  styleUrls: ['./player-reservations.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class PlayerReservationsComponent implements OnInit {
  // UI
  error: string | null = null;
  feedback: string | null = null;

  // Panel 1
  formBuscar: FormGroup;
  buscandoClubs = false;
  busquedaRealizada = false;

  provincias = [
    'Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes',
    'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta',
    'San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ];

  // Panel 2
  clubs: Club[] = [];
  cargandoClubs = false;
  selectedClub: Club | null = null;

  // Panel 3
  canchas: Cancha[] = [];
  cargandoCanchas = false;
  selectedCancha: Cancha | null = null;
  detalleCancha: Cancha | null = null;

  // Turnos
  canchaTurnos: Cancha | null = null;
  fechaTurnos: string = this.todayISO();
  slots: SlotUI[] = [];
  slotSeleccionado: SlotUI | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService,
    private router: Router
  ) {
    this.formBuscar = this.fb.group({
      provincia: [''],
      localidad: [''],
      nombre: [''],
    });
  }

  ngOnInit(): void {
    // por ahora no cargamos nada, vamos a intentar crear reservas
  }

  logout() {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/player/player-dashboard']);
  }

  // PANEL 1: Buscar clubs
  buscarClubs(): void {
    this.error = null;
    this.feedback = null;

    const v = this.formBuscar.value;
    const provincia = (v.provincia || '').trim();
    const localidad = (v.localidad || '').trim();
    const nombre = (v.nombre || '').trim();

    this.buscandoClubs = true;
    this.cargandoClubs = true;
    this.busquedaRealizada = true;

    // Reset selección previa
    this.selectedClub = null;
    this.canchas = [];
    this.selectedCancha = null;
    this.detalleCancha = null;
    this.cerrarTurnos();

    const params: any = {
      page: 1,
      limit: 20,
    };

    if (provincia) params.provincia = provincia;
    if (localidad) params.localidad = localidad;
    if (nombre) params.q = nombre;

    this.clubService.listarClubs(params).pipe(
      finalize(() => {
        this.buscandoClubs = false;
        this.cargandoClubs = false;
      })
    ).subscribe({
      next: (resp: any) => {
        const items = resp?.items ?? resp ?? [];
        this.clubs = Array.isArray(items) ? items : [];
      },
      error: (e) => {
        console.error(e);
        this.error = 'No pudimos buscar clubs. Intentá nuevamente.';
        this.clubs = [];
      }
    });
  }

  // PANEL 2: Ver canchas
  verCanchas(club: Club): void {
    this.error = null;
    this.feedback = null;

    this.selectedClub = club;
    this.canchas = [];
    this.selectedCancha = null;
    this.detalleCancha = null;
    this.cerrarTurnos();

    this.cargandoCanchas = true;

    this.clubService.listarCanchas(club.idClub, { page: 1, limit: 50 }).pipe(
      finalize(() => (this.cargandoCanchas = false))
    ).subscribe({
      next: (resp: any) => {
        const items = resp?.items ?? resp ?? [];
        this.canchas = Array.isArray(items) ? items : [];
      },
      error: (e) => {
        console.error(e);
        this.error = 'No pudimos cargar las canchas del club.';
      }
    });
  }

  // PANEL 3: Detalle cancha
  openDetalleCancha(cancha: Cancha): void {
    this.detalleCancha = cancha;
  }

  closeDetalleCancha(): void {
    this.detalleCancha = null;
  }
  
  // TURNOS (prototipo)
  verTurnos(cancha: Cancha): void {
    this.selectedCancha = cancha;
    this.canchaTurnos = cancha;
    this.slotSeleccionado = null;
    this.generarSlots();
  }

  cerrarTurnos(): void {
    this.canchaTurnos = null;
    this.slots = [];
    this.slotSeleccionado = null;
  }

  generarSlots(): void {
    const c = this.canchaTurnos;
    if (!c) return;

    const desde = c.horaDesde || '';
    const hasta = c.horaHasta || '';
    const rango = Number(c.rangoSlotMinutos || 60);

    if (!desde || !hasta || !rango) {
      this.slots = [];
      return;
    }

    // validación simple
    if (hasta <= desde) {
      this.slots = [];
      this.error = 'El horario de la cancha es inválido (horaHasta <= horaDesde).';
      return;
    }

    this.error = null;

    const [dh, dm] = desde.split(':').map(Number);
    const [hh, hm] = hasta.split(':').map(Number);

    const startMin = dh * 60 + dm;
    const endMin = hh * 60 + hm;

    const slots: SlotUI[] = [];
    let idx = 0;

    for (let t = startMin; t + rango <= endMin; t += rango) {
      const label = this.minToHHmm(t);
      const hastaLabel = this.minToHHmm(t + rango);

      slots.push({
        index: idx,
        label,
        desde: label,
        hasta: hastaLabel
      });

      idx++;
    }

    this.slots = slots;
  }

  selectSlot(s: SlotUI): void {
    this.slotSeleccionado = s;
  }

  reservarPrototipo(): void {
    if (!this.selectedClub || !this.canchaTurnos || !this.slotSeleccionado) return;

    this.feedback = `Prototipo: reservarías en ${this.selectedClub.nombreFantasia} · ${this.canchaTurnos.denominacion} · ${this.fechaTurnos} ${this.slotSeleccionado.desde}-${this.slotSeleccionado.hasta}`;
    setTimeout(() => (this.feedback = null), 3500);
  }

  // Helpers
  formatDiasSemana(mask?: number): string {
    const m = Number(mask ?? 0);
    if (!m) return '-';
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const enabled: string[] = [];
    for (let i = 0; i < 7; i++) {
      if (m & (1 << i)) enabled.push(labels[i]);
    }
    return enabled.length ? enabled.join(', ') : '-';
  }

  clubEstadoLabel(idEstadoClub: number): string {
    switch (Number(idEstadoClub)) {
      case 2: return 'HABILITADO';
      case 1: return 'PENDIENTE';
      case 3: return 'BANEADO';
      default: return 'DESCONOCIDO';
    }
  }

  clubEstadoBadge(idEstadoClub: number): string {
    switch (Number(idEstadoClub)) {
      case 2: return 'bg-success';
      case 1: return 'bg-warning text-dark';
      case 3: return 'bg-danger';
      default: return 'bg-secondary';
    }
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
