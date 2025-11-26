import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html'
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendarIframe') calendarIframe!: ElementRef;

  currentView: string = 'week';
  calendarId: string = 'primary'; // Cambiar por tu Calendar ID
  calendarUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.updateCalendarUrl();
  }

  updateCalendarUrl(): void {
    const baseUrl = 'https://calendar.google.com/calendar/embed';
    const params = `?src=${this.calendarId}&mode=${this.currentView}&hl=es&ctz=America%2FArgentina%2FBuenos_Aires`;
    
    this.calendarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(baseUrl + params);
  }

  get googleCalendarCreateUrl(): string {
    return `https://calendar.google.com/calendar/r/eventedit?src=${this.calendarId}`;
  }

  get googleCalendarSettingsUrl(): string {
    return 'https://calendar.google.com/calendar/r/settings';
  }

  get googleCalendarShareUrl(): string {
    return `https://calendar.google.com/calendar/r/settings/share/${this.calendarId}`;
  }

  changeView(view: string): void {
    this.currentView = view;
    this.updateCalendarUrl();
  }

  refreshCalendar(): void {
    const iframe = this.calendarIframe.nativeElement;
    const currentSrc = iframe.src;
    iframe.src = '';
    
    setTimeout(() => {
      iframe.src = currentSrc;
    }, 100);
  }

  onCalendarLoad(): void {
    console.log('Calendario de Google cargado correctamente');
  }

  showInstructions(): void {
    alert(`Para configurar tu calendario:

1. Ve a calendar.google.com
2. Configura tu calendario principal
3. Copia tu Calendar ID (generalmente tu email)
4. Reemplázalo en el código del componente

También puedes crear un calendario específico para las reservas.`);
  }
}