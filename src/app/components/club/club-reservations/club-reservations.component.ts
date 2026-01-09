import esLocale from '@fullcalendar/core/locales/es';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, catchError, of } from 'rxjs';

import { AuthService } from '../../../services/auth/auth.service';
import { ClubService } from '../../../services/club/club.service';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

type Club = {
  idClub: number;
  nombreFantasia: string | null;
  razonSocial?: string | null;
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

  diasSemana?: number;        // bitmask dom a sab
  horaDesde?: string;         // "HH:mm"
  horaHasta?: string;         // "HH:mm"
  rangoSlotMinutos?: number;  // 30|60
  precio?: number;
};

type Slot = { index: number; start: Date; end: Date };

@Component({
  selector: 'app-club-reservations',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './club-reservations.component.html',
  styleUrls: ['./club-reservations.component.css'],
})
export class ClubReservationsComponent implements OnInit {
  // UI
  error: string | null = null;
  feedback: string | null = null;

  // Club actual
  club: Club | null = null;
  cargandoClub = false;

  // Canchas del club
  canchas: Cancha[] = [];
  cargandoCanchas = false;
  selectedCancha: Cancha | null = null;

  // Reservas de la cancha
  reservas: any[] = [];
  cargandoReservas = false;

  // Slots ocupados
  takenSlotsByDate: Record<string, number[]> = {};

  // rango visible actual del calendar (la semana actual)
  private currentRange: { start: Date; end: Date } | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [interactionPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    firstDay: 0, // Domingo
    locales: [esLocale],
    locale: 'es',
    height: 'auto',
    nowIndicator: true,
    allDaySlot: false,

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek'
    },

    slotMinTime: '06:00:00',
    slotMaxTime: '24:00:00',
    slotDuration: '01:00:00',
    slotLabelInterval: '01:00:00',

    selectable: false,
    events: [],
    eventDisplay: 'block',

    eventContent: (arg) => ({ html: arg.event.title }),

    // grisado días pasados/inactivos
    dayCellClassNames: (arg) => this.dayCellClasses(arg.date),
    dayHeaderClassNames: (arg) => this.dayHeaderClasses(arg.date),

    datesSet: (arg) => this.onDatesSet(arg),
  };

  constructor(
    private authService: AuthService,
    private clubService: ClubService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bootstrapClubAndCanchas();
  }

  goBack(): void {
    this.router.navigate(['/club-dashboard']);
  }

  // club + canchas
  private bootstrapClubAndCanchas(): void {
    this.error = null;
    this.feedback = null;

    const currentClubId = this.clubService.getCurrentClubId();

    if (currentClubId && Number.isFinite(currentClubId) && currentClubId > 0) {
      this.cargandoClub = true;
      this.clubService.obtenerClub(currentClubId).pipe(
        finalize(() => (this.cargandoClub = false)),
        catchError((e) => {
          console.error(e);
          return of(null);
        })
      ).subscribe((club) => {
        if (!club) {
          this.error = 'No se pudo cargar el club actual.';
          return;
        }
        this.club = club as any;
        this.loadCanchas();
      });
      return;
    }

    // buscar club por usuario logueado
    this.cargandoClub = true;
    this.authService.getVerifiedUserId().pipe(
      catchError((e) => {
        console.error(e);
        return of(null);
      }),
      finalize(() => (this.cargandoClub = false))
    ).subscribe((idUsuario) => {
      if (!idUsuario) {
        this.error = 'No se pudo identificar el usuario logueado.';
        return;
      }

      this.cargandoClub = true;
      this.clubService.buscarClubPorUsuario(idUsuario).pipe(
        finalize(() => (this.cargandoClub = false)),
        catchError((e) => {
          console.error(e);
          return of(null);
        })
      ).subscribe((club) => {
        if (!club) {
          this.error = 'Este usuario no tiene un club asociado.';
          return;
        }
        this.club = club as any;
        this.loadCanchas();
      });
    });
  }

  private loadCanchas(): void {
    if (!this.club) return;

    this.cargandoCanchas = true;
    this.canchas = [];
    this.selectedCancha = null;

    this.clubService.listarCanchas(this.club.idClub, { page: 1, limit: 100 }).pipe(
      finalize(() => (this.cargandoCanchas = false)),
      catchError((e) => {
        console.error(e);
        this.error = 'No pudimos cargar las canchas del club.';
        return of({ items: [] });
      })
    ).subscribe((resp: any) => {
      const items = resp?.items ?? resp ?? [];
      this.canchas = Array.isArray(items) ? items : [];
    });
  }

  // Selección cancha
  verReservasDeCancha(cancha: Cancha): void {
    this.error = null;
    this.feedback = null;

    this.selectedCancha = cancha;

    // recortar horario visible según cancha
    const rango = Number(cancha.rangoSlotMinutos || 60);
    const slotDuration = rango === 30 ? '00:30:00' : '01:00:00';

    const minTime = this.toTimeHHMMSS(cancha.horaDesde || '00:00:00');
    const maxTime = this.toTimeHHMMSS(cancha.horaHasta || '24:00:00');

    this.calendarOptions = {
      ...this.calendarOptions,
      slotDuration,
      slotMinTime: minTime,
      slotMaxTime: maxTime,
      slotLabelInterval: '01:00:00',
      events: [],
    };

    // si ya hay rango visible, refrescamos
    if (this.currentRange) {
      this.fetchReservasForRange(this.currentRange.start, this.currentRange.end);
    }
  }

  // FullCalendar
  private onDatesSet(arg: DatesSetArg): void {
    this.currentRange = { start: new Date(arg.start), end: new Date(arg.end) };

    // si hay cancha seleccionada, traer reservas y pintar
    if (this.club && this.selectedCancha) {
      this.fetchReservasForRange(arg.start, arg.end);
    } else {
      // sin cancha, vacío
      this.reservas = [];
      this.takenSlotsByDate = {};
      this.calendarOptions = { ...this.calendarOptions, events: [] };
    }
  }

  // GET reservas + pintar slots ocupados
  private fetchReservasForRange(rangeStart: Date, rangeEnd: Date): void {
    if (!this.club || !this.selectedCancha) return;

    const idClub = this.club.idClub;
    const idCancha = this.selectedCancha.idCancha;

    const desde = this.toISODate(this.startOfDay(rangeStart));
    const endDayInclusive = this.addDays(this.startOfDay(rangeEnd), -1);
    const hasta = this.toISODate(endDayInclusive);

    this.cargandoReservas = true;

    this.clubService.listarReservas(idClub, {
      page: 1,
      limit: 5000,
      sortBy: 'fecha',
      sortDir: 'ASC',
      idCancha,
      fechaDesde: desde,
      fechaHasta: hasta,
    }).pipe(
      catchError((e) => {
        console.error(e);
        return of({ items: [] });
      }),
      finalize(() => (this.cargandoReservas = false))
    ).subscribe((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? []);
      this.reservas = Array.isArray(items) ? items : [];

      // construir mapa de slots ocupados por fecha
      const map: Record<string, number[]> = {};

      for (const r of this.reservas) {
        const iso = String(r.fecha);
        const from = Number(r.slotIndexDesde);
        const count = Number(r.slotCount);

        if (!iso || !Number.isFinite(from) || !Number.isFinite(count) || count <= 0) continue;

        const set = new Set<number>(map[iso] ?? []);
        for (let i = from; i < from + count; i++) set.add(i);
        map[iso] = Array.from(set).sort((a, b) => a - b);
      }

      this.takenSlotsByDate = map;

      // repintar semana con slots
      this.refreshWeekEvents(rangeStart, rangeEnd);
    });
  }

  // Construcción de semana (copiado de payer-reservation)
  private refreshWeekEvents(rangeStart: Date, rangeEnd: Date): void {
    if (!this.selectedCancha) {
      this.calendarOptions = { ...this.calendarOptions, events: [] };
      return;
    }

    const cancha = this.selectedCancha;
    const events: any[] = [];
    const today = this.startOfDay(new Date());

    for (let d = this.startOfDay(rangeStart); d < rangeEnd; d = this.addDays(d, 1)) {
      const iso = this.toISODate(d);

      const isPastDay = d < today;
      const isActive = this.isActiveDay(d, cancha.diasSemana ?? 0);

      // días pasados o no habilitados
      if (isPastDay || !isActive) continue;

      const daySlots = this.buildSlotsForDay(iso, cancha);

      for (const s of daySlots) {
        const taken = this.isTaken(iso, s.index);

        const precio = Number(cancha.precio ?? 0);
        const slotDesde = this.formatTime(s.start);
        const slotHasta = this.formatTime(s.end);

        const classNames = [
          'slot-event',
          taken ? 'slot-taken' : 'slot-free',
        ];

        const html = taken
          ? `<div class="slot-lines">
              <div class="slot-line slot-title">Ocupado</div>
              <div class="slot-line">${slotDesde} → ${slotHasta}</div>
            </div>`
          : `<div class="slot-lines">
              <div class="slot-line"><strong>${slotDesde}</strong> → <strong>${slotHasta}</strong></div>
              <div class="slot-line">Precio</div>
              <div class="slot-line"><strong>$ ${precio}</strong></div>
            </div>`;

        events.push({
          id: `slot-${iso}-${s.index}`,
          title: html,
          start: s.start,
          end: s.end,
          editable: false,
          selectable: false,
          extendedProps: {
            slotIndex: s.index,
            isoDate: iso,
            taken,
            blocked: false,
          },
          classNames,
        });
      }
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
    };
  }

  // Tabla: helpers de horario / estado / usuario
  reservaCodigo(r: any): number | string {
    return r?.idReservaTurno ?? r?.id ?? '-';
  }

  reservaUsuarioLabel(r: any): string {
    // formatos comunes
    const jugador = r?.jugador ?? r?.usuario ?? null;
    if (jugador) {
      const nombre = jugador?.nombre ?? jugador?.name ?? '';
      const email = jugador?.email ?? '';
      const id = jugador?.idUsuario ?? jugador?.id ?? jugador?.idJugador ?? '';
      const txt = [nombre, email].filter(Boolean).join(' · ');
      return txt || (id ? `Usuario #${id}` : 'Usuario');
    }

    const idJugador = r?.idJugador ?? r?.idUsuario ?? null;
    return idJugador ? `Usuario #${idJugador}` : 'Usuario';
  }

  reservaHorarioLabel(r: any): string {
    if (!this.selectedCancha) return '-';

    const from = Number(r?.slotIndexDesde);
    const count = Number(r?.slotCount);

    if (!Number.isFinite(from) || !Number.isFinite(count) || count <= 0) return '-';

    const cancha = this.selectedCancha;
    const iso = String(r?.fecha || '');
    if (!iso) return '-';

    const rango = Number(cancha.rangoSlotMinutos || 60);
    const { startMin } = this.getHorarioMinutes(cancha);
    if (startMin === null || !rango) return '-';

    const start = startMin + from * rango;
    const end = startMin + (from + count) * rango;

    return `${this.minutesToHHMM(start)} → ${this.minutesToHHMM(end)}`;
  }

  reservaMonto(r: any): string {
    const v = Number(r?.precioAplicado ?? r?.monto ?? r?.total ?? 0);
    if (!Number.isFinite(v)) return '$ 0';
    return `$ ${v}`;
  }

  reservaEstadoLabel(r: any): { text: string; badge: string } {
    const pagado = !!r?.pagado;
    // pagado = confirmada
    // no pagado = cancelada
    return pagado
      ? { text: 'CONFIRMADA', badge: 'badge bg-success' }
      : { text: 'CANCELADA', badge: 'badge bg-secondary' };
  }

  // Helpers visuales (grisado igual a jugador)
  private dayCellClasses(date: Date): string[] {
    if (!this.selectedCancha) return [];

    const today = this.startOfDay(new Date());
    const d = this.startOfDay(date);

    const out: string[] = [];
    if (d < today) out.push('fc-day-past-custom');

    const mask = this.selectedCancha.diasSemana ?? 0;
    if (!this.isActiveDay(d, mask)) out.push('fc-day-inactive-custom');

    return out;
  }

  private dayHeaderClasses(date: Date): string[] {
    return this.dayCellClasses(date);
  }

  private isActiveDay(date: Date, mask: number): boolean {
    const day = date.getDay(); // 0..6
    return (mask & (1 << day)) !== 0;
  }

  private isTaken(iso: string, slotIndex: number): boolean {
    const taken = this.takenSlotsByDate[iso] ?? [];
    return taken.includes(slotIndex);
  }

  // Slots según horaDesde/horaHasta y rango
  private buildSlotsForDay(iso: string, cancha: Cancha): Slot[] {
    const rango = Number(cancha.rangoSlotMinutos || 60);
    const { startMin, endMin } = this.getHorarioMinutes(cancha);
    if (startMin === null || endMin === null) return [];
    if (!rango || endMin <= startMin) return [];

    const base = new Date(iso + 'T00:00:00');
    const slots: Slot[] = [];
    let idx = 0;

    for (let t = startMin; t + rango <= endMin; t += rango) {
      const start = new Date(base);
      start.setMinutes(t);

      const end = new Date(base);
      end.setMinutes(t + rango);

      slots.push({ index: idx, start, end });
      idx++;
    }

    return slots;
  }

  private getHorarioMinutes(cancha: Cancha): { startMin: number | null; endMin: number | null } {
    const desde = (cancha.horaDesde || '').trim();
    const hasta = (cancha.horaHasta || '').trim();
    if (!desde || !hasta) return { startMin: null, endMin: null };

    const [dh, dm] = desde.split(':').slice(0, 2).map(Number);
    const [hh, hm] = hasta.split(':').slice(0, 2).map(Number);
    if ([dh, dm, hh, hm].some(n => Number.isNaN(n))) return { startMin: null, endMin: null };

    return { startMin: dh * 60 + dm, endMin: hh * 60 + hm };
  }

  private minutesToHHMM(totalMin: number): string {
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  private toTimeHHMMSS(v: string): string {
    const s = (v || '').trim();
    if (!s) return '00:00:00';
    const parts = s.split(':');
    const hh = (parts[0] ?? '00').padStart(2, '0');
    const mm = (parts[1] ?? '00').padStart(2, '0');
    return `${hh}:${mm}:00`;
  }

  private formatTime(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  formatDiasSemana(mask?: number): string {
    const m = Number(mask ?? 0);
    if (!m) return '-';
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const enabled: string[] = [];
    for (let i = 0; i < 7; i++) if (m & (1 << i)) enabled.push(labels[i]);
    return enabled.length ? enabled.join(', ') : '-';
  }
}
