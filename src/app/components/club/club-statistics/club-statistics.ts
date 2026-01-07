import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { finalize, switchMap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Cancha } from '../../../services/club/club.service';

type CanchaEstadistica = Cancha & {
  horaDesde?: string;
  horaHasta?: string;
  diasSemana?: number;
  rangoSlotMinutos?: number;
  precio?: number;
};

@Component({
  selector: 'app-club-statistics',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './club-statistics.html',
  styleUrls: ['./club-statistics.css'],
})
export class ClubStatistics implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  loading = false;
  error: string | null = null;
  idClub: number | null = null;

  canchas: CanchaEstadistica[] = [];
  selectedCanchaId: number | null = null;
  canchaActual: CanchaEstadistica | null = null;

  currentRange: { start: Date; end: Date } | null = null;
  takenSlotsByDate: Record<string, number[]> = {};


 calendarOptions: CalendarOptions = {
  plugins: [interactionPlugin, timeGridPlugin],
  initialView: 'timeGridWeek',
  locale: 'es',
  locales: [esLocale],

  height: 'auto',
  allDaySlot: false,

  slotMinTime: '07:00:00',
  slotMaxTime: '24:00:00',

  slotDuration: '00:30:00',
  slotLabelInterval: '00:30:00',

  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridWeek,timeGridDay'
  },

  events: [],
  datesSet: (arg) => this.onDatesSet(arg),

  eventContent: (arg) => ({ html: arg.event.title }),
};


  constructor(
    private authService: AuthService,
    private clubService: ClubService,
    private router:Router,
  ) {}

  
  logout() { this.authService.logout(); }

  goBack(): void { this.router.navigate(['/club-dashboard']); }

  ngOnInit(): void {
    this.loading = true;

    this.authService.verifyToken().pipe(
      switchMap(resp => {
        const userId = resp?.id;
        if (!userId) throw new Error('Usuario no identificado');
        return this.clubService.buscarClubPorUsuario(userId);
      }),
      switchMap(club => {
        if (!club?.idClub) throw new Error('No se encontró club vinculado');
        this.idClub = club.idClub;
        return this.clubService.listarCanchas(this.idClub, { page: 1, limit: 100 });
      }),
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (resp: any) => {
        this.canchas = Array.isArray(resp) ? resp : (resp?.items ?? []);
        
        if (this.canchas.length > 0) {
          this.seleccionarCancha(this.canchas[0].idCancha);
        }
      },
      error: (e) => {
        console.error(e);
        this.error = 'No pudimos cargar tus canchas.';
      }
    });
  }

  onChangeCancha(event: any) {
    const id = Number(event.target.value);
    this.seleccionarCancha(id);
  }

  seleccionarCancha(idCancha: number) {
    this.selectedCanchaId = idCancha;
    this.canchaActual = this.canchas.find(c => c.idCancha === idCancha) || null;

    if (this.canchaActual) {
      this.calendarOptions = {
        ...this.calendarOptions,
        slotMinTime: this.fixTimeFormat(this.canchaActual.horaDesde || '07:00'),
        slotMaxTime: this.fixTimeFormat(this.canchaActual.horaHasta || '24:00'),
        slotDuration: Number(this.canchaActual.rangoSlotMinutos) === 30 ? '00:30:00' : '01:00:00',
        events: [] 
      };

      if (this.currentRange) {
        this.cargarReservasYRenderizar();
      }
    }
  }

  onDatesSet(arg: DatesSetArg) {
    this.currentRange = { start: arg.start, end: arg.end };
    if (this.idClub && this.selectedCanchaId) {
      this.cargarReservasYRenderizar();
    }
  }

  cargarReservasYRenderizar() {
    if (!this.idClub || !this.selectedCanchaId || !this.currentRange) return;

    const desdeISO = this.toISODate(this.currentRange.start);
    const hastaISO = this.toISODate(this.currentRange.end);

    this.loading = true;

    this.clubService.listarReservas(this.idClub, {
      page: 1, limit: 2000,
      idCancha: this.selectedCanchaId,
      fechaDesde: desdeISO,
      fechaHasta: hastaISO
    }).pipe(
      catchError(() => of([])),
      finalize(() => this.loading = false)
    ).subscribe((resp: any) => {
      const reservas = Array.isArray(resp) ? resp : (resp?.items ?? []);
      this.procesarOcupacion(reservas);
      this.generarEventosVisuales();
    });
  }

  procesarOcupacion(reservas: any[]) {
    this.takenSlotsByDate = {};
    reservas.forEach(r => {
      const fecha = String(r.fecha).split('T')[0];
      const startIdx = Number(r.slotIndexDesde);
      const count = Number(r.slotCount);
      if (!this.takenSlotsByDate[fecha]) this.takenSlotsByDate[fecha] = [];
      for (let i = 0; i < count; i++) {
        this.takenSlotsByDate[fecha].push(startIdx + i);
      }
    });
  }

  generarEventosVisuales() {
    if (!this.canchaActual || !this.currentRange) return;

    const events = [];
    const rangoMinutos = Number(this.canchaActual.rangoSlotMinutos || 60);
    const { startMin, endMin } = this.parseHorarios(this.canchaActual);

    const loopDate = new Date(this.currentRange.start);
    while (loopDate < this.currentRange.end) {
      const isoDate = this.toISODate(loopDate);
      const diaSemana = loopDate.getDay();
      const abreHoy = (Number(this.canchaActual.diasSemana || 0) & (1 << diaSemana)) !== 0;

      if (abreHoy) {
        let slotIndex = 0;
        for (let time = startMin; time + rangoMinutos <= endMin; time += rangoMinutos) {
          const start = new Date(loopDate);
          start.setHours(Math.floor(time / 60), time % 60);
          const end = new Date(loopDate);
          end.setHours(Math.floor((time + rangoMinutos) / 60), (time + rangoMinutos) % 60);

          const isTaken = (this.takenSlotsByDate[isoDate] || []).includes(slotIndex);
          const cssClass = isTaken ? 'slot-occupied' : 'slot-available';
          const titulo = isTaken ? 'OCUPADO' : 'LIBRE';
          
          events.push({
            start: start,
            end: end,
            title: `<div class="slot-content"><div class="slot-status fw-bold">${titulo}</div></div>`,
            classNames: [cssClass],
            display: 'block'
          });
          slotIndex++;
        }
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private parseHorarios(c: CanchaEstadistica) {
    const [h1, m1] = (c.horaDesde || '00:00').split(':').map(Number);
    const [h2, m2] = (c.horaHasta || '23:59').split(':').map(Number);
    return { startMin: h1 * 60 + m1, endMin: h2 * 60 + m2 };
  }

  private fixTimeFormat(time: string): string {
    return time.length === 5 ? time + ':00' : time;
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}