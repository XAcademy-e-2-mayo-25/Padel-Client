import esLocale from '@fullcalendar/core/locales/es';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, catchError, of } from 'rxjs';

import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, DatosPago } from '../../../services/club/club.service';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DatesSetArg } from '@fullcalendar/core';
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

  diasSemana?: number;        // bitmask dom->sab
  horaDesde?: string;         // "HH:mm" o "HH:mm:ss"
  horaHasta?: string;         // "HH:mm" o "HH:mm:ss"
  rangoSlotMinutos?: number;  // 30|60
  precio?: number;
};

type Slot = { index: number; start: Date; end: Date };

@Component({
  selector: 'app-player-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FullCalendarModule, FormsModule],
  templateUrl: './player-reservations.component.html',
  styleUrls: ['./player-reservations.component.css'],
})
export class PlayerReservationsComponent implements OnInit {
  // UI
  error: string | null = null;
  feedback: string | null = null;
  creatingReserva = false;

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

  // Turnos / Calendar
  canchaTurnos: Cancha | null = null;
  selectedDateISO: string | null = null; // YYYY-MM-DD
  daySlots: Slot[] = [];
  selectedSlotRange: { from: number; to: number } | null = null;

  // slots tomados
  takenSlotsByDate: Record<string, number[]> = {};
  cargandoReservas = false;

  // rango visible actual del calendar (semana)
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

    // defaults (se ajusta dinámico con la cancha)
    slotMinTime: '06:00:00',
    slotMaxTime: '24:00:00',
    slotDuration: '01:00:00',
    slotLabelInterval: '01:00:00',

    selectable: false,
    eventClick: (arg) => this.onEventClick(arg),
    datesSet: (arg) => this.onDatesSet(arg),

    events: [],
    eventDisplay: 'block',

    eventContent: (arg) => {
      // renderiza HTML del title
      return { html: arg.event.title };
    },

    // grisar días pasados e inactivos (body)
    dayCellClassNames: (arg) => this.dayCellClasses(arg.date),
    //grisar también el header (rótulos)
    dayHeaderClassNames: (arg) => this.dayHeaderClasses(arg.date),
  };

  // MODAL PAGO
  pagoModalOpen = false;
  pagoReservaId: number | null = null;

  metodosPago: DatosPago[] = [];
  cargandoMetodosPago = false;

  metodoPagoSeleccionadoId: number | null = null;
  metodoPagoSeleccionado: DatosPago | null = null;

  procesandoPago = false;

  // para poder deshacer si cancela
  private lastCreatedContext: null | { iso: string; from: number; to: number } = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService,
    private router: Router
  ) {
    this.formBuscar = this.fb.group({
      provincia: [''],
      localidad: [''],
      nombre: [''], // se manda como q (contains en backend)
    });
  }

  ngOnInit(): void {}

  logout() { this.authService.logout(); }

  goBack(): void { this.router.navigate(['/player/player-dashboard']); }

  // Buscar clubs
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

    this.resetSeleccion();

    const params: any = { page: 1, limit: 20 };
    if (provincia) params.provincia = provincia;
    if (localidad) params.localidad = localidad;
    if (nombre) params.q = nombre; // contains (razonSocial OR nombreFantasia)

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

  private resetSeleccion(): void {
    this.selectedClub = null;
    this.canchas = [];
    this.selectedCancha = null;
    this.detalleCancha = null;
    this.closeTurnos();
  }

  // Ver canchas
  verCanchas(club: Club): void {
    this.error = null;
    this.feedback = null;

    this.selectedClub = club;
    this.canchas = [];
    this.selectedCancha = null;
    this.detalleCancha = null;
    this.closeTurnos();

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

  // Detalle cancha (overlay)
  openDetalleCancha(cancha: Cancha): void { this.detalleCancha = cancha; }
  closeDetalleCancha(): void { this.detalleCancha = null; }

  // Turnos + FullCalendar
  verTurnos(cancha: Cancha): void {
    this.selectedCancha = cancha;
    this.canchaTurnos = cancha;
    this.selectedDateISO = null;
    this.daySlots = [];
    this.selectedSlotRange = null;

    const rango = Number(cancha.rangoSlotMinutos || 60);
    const slotDuration = rango === 30 ? '00:30:00' : '01:00:00';

    // recortar horario visible
    const minTime = this.toTimeHHMMSS(cancha.horaDesde || '00:00:00');
    const maxTime = this.toTimeHHMMSS(cancha.horaHasta || '24:00:00');

    this.calendarOptions = {
      ...this.calendarOptions,
      initialView: 'timeGridWeek',
      slotDuration,
      slotMinTime: minTime,
      slotMaxTime: maxTime,
      slotLabelInterval: '01:00:00',
      events: [],
    };

    //traemos reservas reales para pintar ocupados
    if (this.currentRange && this.selectedClub) {
      this.fetchTakenSlotsForRange(this.currentRange.start, this.currentRange.end);
    }
  }

  closeTurnos(): void {
    this.canchaTurnos = null;
    this.selectedDateISO = null;
    this.daySlots = [];
    this.selectedSlotRange = null;
    this.currentRange = null;
    this.calendarOptions = { ...this.calendarOptions, events: [] };
  }

  private onDatesSet(arg: DatesSetArg): void {
    this.currentRange = { start: new Date(arg.start), end: new Date(arg.end) };

    // Cuando cambia la semana, limpiamos selección
    this.selectedDateISO = null;
    this.daySlots = [];
    this.selectedSlotRange = null;

    //Cargar reservas reales y luego pintar semana
    if (this.canchaTurnos && this.selectedClub) {
      this.fetchTakenSlotsForRange(arg.start, arg.end);
    } else {
      this.refreshWeekEvents(arg.start, arg.end);
    }
  }

  private onEventClick(arg: EventClickArg): void {
    if (!this.canchaTurnos) return;

    const ext = (arg.event.extendedProps || {}) as any;

    // solo slots
    const slotIndex: number | undefined = ext.slotIndex;
    const iso: string | undefined = ext.isoDate;
    const isBlocked: boolean = !!ext.blocked;
    const isTaken: boolean = !!ext.taken;

    if (!iso || slotIndex === undefined) return;
    if (isBlocked || isTaken) return;

    const clickedDate = new Date(iso + 'T00:00:00');
    const today = this.startOfDay(new Date());
    if (this.startOfDay(clickedDate) < today) return;
    if (!this.isActiveDay(clickedDate, this.canchaTurnos.diasSemana ?? 0)) return;

    // bloquear slots ya pasados dentro del día actual
    if (this.isPastSlot(iso, slotIndex, this.canchaTurnos)) return;

    // Si cambia de día se resetea selección
    if (this.selectedDateISO !== iso) {
      this.selectedDateISO = iso;
      this.selectedSlotRange = { from: slotIndex, to: slotIndex };
    } else {
      // si hay selección exacta de 1 slot y clickeo el mismo se desmarca
      if (this.selectedSlotRange && this.selectedSlotRange.from === slotIndex && this.selectedSlotRange.to === slotIndex) {
        this.selectedSlotRange = null;
      } else {
        // Selección continua
        if (!this.selectedSlotRange) {
          this.selectedSlotRange = { from: slotIndex, to: slotIndex };
        } else {
          const { from, to } = this.selectedSlotRange;

          if (slotIndex >= from && slotIndex <= to) {
            this.selectedSlotRange = { from, to };
          } else if (slotIndex === from - 1) {
            this.selectedSlotRange = { from: slotIndex, to };
          } else if (slotIndex === to + 1) {
            this.selectedSlotRange = { from, to: slotIndex };
          } else {
            this.selectedSlotRange = { from: slotIndex, to: slotIndex };
          }
        }
      }
    }

    if (this.currentRange) {
      this.refreshWeekEvents(this.currentRange.start, this.currentRange.end);
    }
  }

  private fetchTakenSlotsForRange(rangeStart: Date, rangeEnd: Date): void {
    if (!this.canchaTurnos || !this.selectedClub) return;

    const idClub = this.selectedClub.idClub;
    const idCancha = this.canchaTurnos.idCancha;

    const desde = this.toISODate(this.startOfDay(rangeStart));
    const endDayInclusive = this.addDays(this.startOfDay(rangeEnd), -1);
    const hasta = this.toISODate(endDayInclusive);

    this.cargandoReservas = true;

    this.clubService.listarReservas(idClub, {
      page: 1,
      limit: 2000,
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

      const map: Record<string, number[]> = {};

      for (const r of items) {
        const iso = String(r.fecha);
        const from = Number(r.slotIndexDesde);
        const count = Number(r.slotCount);

        if (!iso || !Number.isFinite(from) || !Number.isFinite(count) || count <= 0) continue;

        const set = new Set<number>(map[iso] ?? []);
        for (let i = from; i < from + count; i++) set.add(i);
        map[iso] = Array.from(set).sort((a, b) => a - b);
      }

      this.takenSlotsByDate = map;
      this.refreshWeekEvents(rangeStart, rangeEnd);
    });
  }

  private refreshWeekEvents(rangeStart: Date, rangeEnd: Date): void {
    if (!this.canchaTurnos) {
      this.calendarOptions = { ...this.calendarOptions, events: [] };
      return;
    }

    const events: any[] = [];
    const today = this.startOfDay(new Date());

    for (let d = this.startOfDay(rangeStart); d < rangeEnd; d = this.addDays(d, 1)) {
      const iso = this.toISODate(d);

      const isPastDay = d < today;
      const isActive = this.isActiveDay(d, this.canchaTurnos.diasSemana ?? 0);

      if (isPastDay || !isActive) continue;

      const daySlots = this.buildSlotsForDay(iso, this.canchaTurnos);

      if (this.selectedDateISO === iso) {
        this.daySlots = daySlots;
      }

      for (const s of daySlots) {
        const taken = this.isTaken(iso, s.index);
        const selected = this.selectedDateISO === iso && this.selectedSlotRange
          ? (s.index >= this.selectedSlotRange.from && s.index <= this.selectedSlotRange.to)
          : false;

        const pastSlot = this.isPastSlot(iso, s.index, this.canchaTurnos);

        const precio = Number(this.canchaTurnos?.precio ?? 0);
        const slotDesde = this.formatTime(s.start);
        const slotHasta = this.formatTime(s.end);

        const blocked = pastSlot;

        const classNames = [
          'slot-event',
          taken ? 'slot-taken' : (blocked ? 'slot-blocked' : 'slot-free'),
          selected ? 'slot-selected' : '',
        ].filter(Boolean);

        const html = taken
          ? `<div class="slot-lines">
              <div class="slot-line slot-title">Ocupado</div>
              <div class="slot-line">${slotDesde} → ${slotHasta}</div>
            </div>`
          : blocked
            ? `<div class="slot-lines">
                <div class="slot-line slot-title">No disponible</div>
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
            blocked,
          },
          classNames,
        });
      }
    }

    if (this.selectedDateISO) {
      const sel = new Date(this.selectedDateISO + 'T00:00:00');
      if (sel < this.startOfDay(rangeStart) || sel >= rangeEnd) {
        this.selectedDateISO = null;
        this.selectedSlotRange = null;
      }
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
    };
  }

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

  private isPastSlot(iso: string, slotIndex: number, cancha: Cancha): boolean {
    const todayIso = this.toISODate(new Date());
    if (iso !== todayIso) return false;

    const rango = Number(cancha.rangoSlotMinutos || 60);
    const { startMin } = this.getHorarioMinutes(cancha);
    if (startMin === null || !rango) return false;

    const slotStartMin = startMin + slotIndex * rango;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    return slotStartMin <= nowMin;
  }

  private dayCellClasses(date: Date): string[] {
    if (!this.canchaTurnos) return [];

    const today = this.startOfDay(new Date());
    const d = this.startOfDay(date);

    const out: string[] = [];
    if (d < today) out.push('fc-day-past-custom');

    const mask = this.canchaTurnos.diasSemana ?? 0;
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

  canStartReserva(): boolean {
    return !!(this.canchaTurnos && this.selectedDateISO && this.selectedSlotRange);
  }

  iniciarReservaReal(): void {
    if (!this.selectedClub || !this.canchaTurnos || !this.selectedDateISO || !this.selectedSlotRange) {
      this.error = 'Falta seleccionar club, cancha, día y slots.';
      return;
    }

    this.error = null;
    this.feedback = null;

    const club = this.selectedClub;
    const cancha = this.canchaTurnos;
    const iso = this.selectedDateISO;
    const range = this.selectedSlotRange;

    const idClub = club.idClub;
    const idCancha = cancha.idCancha;

    const { from, to } = range;
    const slotCount = (to - from) + 1;

    const payload = {
      idCancha,
      fecha: iso,
      slotIndexDesde: from,
      slotCount,
    };

    this.creatingReserva = true;

    this.clubService.crearReservaJugador(idClub, payload).pipe(
      finalize(() => (this.creatingReserva = false))
    ).subscribe({
      next: (resp: any) => {
        const idReserva = resp?.reserva?.idReservaTurno ?? resp?.reserva?.id ?? resp?.idReservaTurno;

        if (!idReserva) {
          this.error = 'Reserva creada pero no pude obtener el idReservaTurno para pagar.';
          return;
        }

        this.lastCreatedContext = { iso, from, to };

        const set = new Set<number>(this.takenSlotsByDate[iso] ?? []);
        for (let i = from; i <= to; i++) set.add(i);
        this.takenSlotsByDate[iso] = Array.from(set).sort((a, b) => a - b);

        this.selectedSlotRange = null;

        if (this.currentRange) {
          this.refreshWeekEvents(this.currentRange.start, this.currentRange.end);
        }

        // abrir modal + cargar métodos de pago del club
        this.pagoReservaId = Number(idReserva);
        this.pagoModalOpen = true;

        this.metodoPagoSeleccionadoId = null;
        this.metodoPagoSeleccionado = null;
        this.cargarMetodosPagoDelClub();
      },
      error: (e) => {
        console.error(e);

        const msg = e?.error?.message;
        if (Array.isArray(msg)) {
          this.error = msg.join(' · ');
        } else if (typeof msg === 'string') {
          this.error = msg;
        } else {
          this.error = 'No pudimos crear la reserva. Intentá nuevamente.';
        }
      }
    });
  }

  // MODAL: carga métodos pago reales
  private cargarMetodosPagoDelClub(): void {
    if (!this.selectedClub) {
      this.metodosPago = [];
      return;
    }

    this.cargandoMetodosPago = true;
    this.metodosPago = [];

    this.clubService.listarDatosPagos(this.selectedClub.idClub, { page: 1, limit: 50, activo: true }).pipe(
      catchError((e) => {
        console.error(e);
        return of({ items: [] });
      }),
      finalize(() => (this.cargandoMetodosPago = false))
    ).subscribe((resp: any) => {
      const items = resp?.items ?? resp ?? [];
      const arr = Array.isArray(items) ? items : [];

      // por las dudas, filtramos activos también
      this.metodosPago = arr.filter((x: DatosPago) => !!x && x.activo !== false);
    });
  }

  onMetodoPagoSeleccionadoChange(raw: any): void {
    const id = Number(raw);

    if (!Number.isFinite(id) || id <= 0) {
      this.metodoPagoSeleccionadoId = null;
      this.metodoPagoSeleccionado = null;
      return;
    }

    this.metodoPagoSeleccionadoId = id;
    this.metodoPagoSeleccionado = this.metodosPago.find(m => Number(m.idDatosPago) === id) ?? null;
  }

  confirmarPagoFicticio(): void {
    if (!this.selectedClub || !this.pagoReservaId) return;
    if (!this.metodoPagoSeleccionadoId || !this.metodoPagoSeleccionado) return;

    this.error = null;
    this.feedback = null;
    this.procesandoPago = true;

    const idClub = this.selectedClub.idClub;
    const idReserva = this.pagoReservaId;

    this.clubService.pagarReservaJugador(idClub, idReserva, { pagado: true }).pipe(
      finalize(() => (this.procesandoPago = false))
    ).subscribe({
      next: () => {
        this.feedback = 'Pago registrado (ficticio). ¡Reserva confirmada!';
        setTimeout(() => (this.feedback = null), 3000);

        this.pagoModalOpen = false;
        this.pagoReservaId = null;
        this.lastCreatedContext = null;

        if (this.currentRange) {
          this.fetchTakenSlotsForRange(this.currentRange.start, this.currentRange.end);
        }
      },
      error: (e) => {
        console.error(e);
        const msg = e?.error?.message;
        this.error = Array.isArray(msg) ? msg.join(' · ') : (msg || 'No pudimos registrar el pago.');
      }
    });
  }

  cancelarReservaRecienCreada(): void {
    if (!this.selectedClub || !this.pagoReservaId) return;

    this.error = null;
    this.feedback = null;
    this.procesandoPago = true;

    const idClub = this.selectedClub.idClub;
    const idReserva = this.pagoReservaId;

    this.clubService.eliminarReservaJugador(idClub, idReserva).pipe(
      finalize(() => (this.procesandoPago = false))
    ).subscribe({
      next: () => {
        this.feedback = 'Reserva cancelada.';
        setTimeout(() => (this.feedback = null), 2500);

        if (this.lastCreatedContext) {
          const { iso, from, to } = this.lastCreatedContext;
          const arr = new Set<number>(this.takenSlotsByDate[iso] ?? []);
          for (let i = from; i <= to; i++) arr.delete(i);
          this.takenSlotsByDate[iso] = Array.from(arr).sort((a, b) => a - b);

          if (this.currentRange) {
            this.refreshWeekEvents(this.currentRange.start, this.currentRange.end);
          }
        }

        this.pagoModalOpen = false;
        this.pagoReservaId = null;
        this.lastCreatedContext = null;

        if (this.currentRange) {
          this.fetchTakenSlotsForRange(this.currentRange.start, this.currentRange.end);
        }
      },
      error: (e) => {
        console.error(e);
        const msg = e?.error?.message;
        this.error = Array.isArray(msg) ? msg.join(' · ') : (msg || 'No pudimos cancelar la reserva.');
      }
    });
  }

  closePagoModal(): void {
    this.pagoModalOpen = false;
  }

  // helpers clubs
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

  formatDiasSemana(mask?: number): string {
    const m = Number(mask ?? 0);
    if (!m) return '-';
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const enabled: string[] = [];
    for (let i = 0; i < 7; i++) if (m & (1 << i)) enabled.push(labels[i]);
    return enabled.length ? enabled.join(', ') : '-';
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
}
