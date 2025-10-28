import { Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { CalendarComponent } from "../../shared/calendar/calendar.component";

@Component({
  selector: 'app-player-dashboard',
  templateUrl: './player-dashboard.component.html',
  styleUrls: ['./player-dashboard.component.css'],
  imports: [CalendarComponent]
})
export class PlayerDashboardComponent implements OnInit {
  playerName: string = 'Jugador';
  calendarUrl!: SafeResourceUrl;
  currentView: string = 'week';
  calendarId: string = 'primary';

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer 
  ) {}

  ngOnInit() {
    this.updateCalendarUrl();
  }

  updateCalendarUrl(): void {
    const baseUrl = 'https://calendar.google.com/calendar/embed';
    const params = `?src=${this.calendarId}&mode=${this.currentView}&hl=es&ctz=America%2FArgentina%2FBuenos_Aires`;

    this.calendarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(baseUrl + params);
  }

  changeView(view: string): void {
    this.currentView = view;
    this.updateCalendarUrl();
  }

  get googleCalendarCreateUrl(): string {
    return `https://calendar.google.com/calendar/r/eventedit?src=${this.calendarId}`;
  }

  logout(): void {
    // Lógica para cerrar sesión
    console.log('Cerrando sesión...');
    // Ejemplo: this.authService.logout();
    // this.router.navigate(['/login']);
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }
}
