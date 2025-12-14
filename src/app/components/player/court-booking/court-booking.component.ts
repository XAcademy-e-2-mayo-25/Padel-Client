import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';

@Component({
  selector: 'app-court-booking',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './court-booking.component.html',
  styleUrls: ['./court-booking.component.css']
})
export class CourtBookingComponent implements OnInit {
  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    initialView: 'timeGridWeek',
    locale: esLocale,
    weekends: true,
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '01:00:00',
    slotLabelInterval: '01:00:00',
    allDaySlot: false,
    height: 'auto',
    contentHeight: 600,
    expandRows: true,
    businessHours: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '22:00'
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    events: this.getInitialEvents()
  });

  currentEvents = signal<EventApi[]>([]);
  selectedCourt: string = 'Cancha 1';
  courts = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];

  ngOnInit() {
    console.log('Court Booking Component initialized');
  }

  getInitialEvents() {
    // Eventos de ejemplo: turnos ya reservados y disponibles
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      // Turnos reservados (en rojo)
      {
        id: '1',
        title: '⛔ Reservado - Juan Pérez',
        start: this.formatDate(today, '09:00'),
        end: this.formatDate(today, '10:00'),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        extendedProps: {
          court: 'Cancha 1',
          status: 'reservado',
          player: 'Juan Pérez'
        }
      },
      {
        id: '2',
        title: '⛔ Reservado - María García',
        start: this.formatDate(today, '11:00'),
        end: this.formatDate(today, '12:00'),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        extendedProps: {
          court: 'Cancha 1',
          status: 'reservado',
          player: 'María García'
        }
      },
      {
        id: '3',
        title: '⛔ Reservado - Carlos López',
        start: this.formatDate(today, '17:00'),
        end: this.formatDate(today, '18:00'),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        extendedProps: {
          court: 'Cancha 1',
          status: 'reservado',
          player: 'Carlos López'
        }
      },
      // Turnos disponibles (en verde)
      {
        id: '4',
        title: '✅ Disponible',
        start: this.formatDate(today, '10:00'),
        end: this.formatDate(today, '11:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      },
      {
        id: '5',
        title: '✅ Disponible',
        start: this.formatDate(today, '14:00'),
        end: this.formatDate(today, '15:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      },
      {
        id: '6',
        title: '✅ Disponible',
        start: this.formatDate(today, '15:00'),
        end: this.formatDate(today, '16:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      },
      {
        id: '7',
        title: '✅ Disponible',
        start: this.formatDate(today, '19:00'),
        end: this.formatDate(today, '20:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      },
      // Mañana
      {
        id: '8',
        title: '⛔ Reservado - Ana Martínez',
        start: this.formatDate(tomorrow, '10:00'),
        end: this.formatDate(tomorrow, '11:00'),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        extendedProps: {
          court: 'Cancha 1',
          status: 'reservado',
          player: 'Ana Martínez'
        }
      },
      {
        id: '9',
        title: '✅ Disponible',
        start: this.formatDate(tomorrow, '09:00'),
        end: this.formatDate(tomorrow, '10:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      },
      {
        id: '10',
        title: '✅ Disponible',
        start: this.formatDate(tomorrow, '16:00'),
        end: this.formatDate(tomorrow, '17:00'),
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          court: 'Cancha 1',
          status: 'disponible'
        }
      }
    ];
  }

  formatDate(date: Date, time: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${time}:00`;
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const calendarApi = selectInfo.view.calendar;
    const startTime = selectInfo.start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const endTime = selectInfo.end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const date = selectInfo.start.toLocaleDateString('es-AR');

    const confirmMessage = `¿Deseas reservar este turno?\n\nCancha: ${this.selectedCourt}\nFecha: ${date}\nHorario: ${startTime} - ${endTime}`;

    if (confirm(confirmMessage)) {
      calendarApi.addEvent({
        title: '🎾 Tu Reserva',
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        backgroundColor: '#275c6a',
        borderColor: '#275c6a',
        extendedProps: {
          court: this.selectedCourt,
          status: 'mi-reserva'
        }
      });

      alert('✅ ¡Reserva confirmada!\n\nEn una implementación real, aquí se enviaría la reserva al servidor.');
    }

    calendarApi.unselect();
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const status = event.extendedProps['status'];

    if (status === 'disponible') {
      const date = event.start?.toLocaleDateString('es-AR');
      const startTime = event.start?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const endTime = event.end?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      const confirmMessage = `¿Deseas reservar este turno?\n\nCancha: ${this.selectedCourt}\nFecha: ${date}\nHorario: ${startTime} - ${endTime}`;

      if (confirm(confirmMessage)) {
        event.setProp('title', '🎾 Tu Reserva');
        event.setProp('backgroundColor', '#275c6a');
        event.setProp('borderColor', '#275c6a');
        event.setExtendedProp('status', 'mi-reserva');

        alert('✅ ¡Reserva confirmada!');
      }
    } else if (status === 'mi-reserva') {
      if (confirm('¿Deseas cancelar esta reserva?')) {
        event.remove();
        alert('❌ Reserva cancelada');
      }
    } else {
      const player = event.extendedProps['player'];
      alert(`Este turno ya está reservado por ${player}`);
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
  }

  changeCourt(court: string) {
    this.selectedCourt = court;
    // En una implementación real, aquí se cargarían los eventos de la cancha seleccionada
    alert(`Vista cambiada a: ${court}\n\nEn una implementación real, se cargarían los turnos disponibles para esta cancha.`);
  }

  refreshCalendar() {
    window.location.reload();
  }

  // Métodos para estadísticas en el template
  get availableSlotsCount(): number {
    return this.currentEvents().filter(e => e.extendedProps['status'] === 'disponible').length;
  }

  get reservedSlotsCount(): number {
    return this.currentEvents().filter(e => e.extendedProps['status'] === 'reservado').length;
  }

  get myReservationsCount(): number {
    return this.currentEvents().filter(e => e.extendedProps['status'] === 'mi-reserva').length;
  }
}
