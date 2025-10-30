
import { Component } from '@angular/core';
import { CalendarComponent } from "../../shared/calendar/calendar.component";

@Component({
  selector: 'app-player-reservations.component',
  imports: [CalendarComponent],
  templateUrl: './player-reservations.component.html',
  styleUrl: './player-reservations.component.css'
})
export class PlayerReservationsComponent {
logout() {
throw new Error('Method not implemented.');
}
playerName: any;

}
