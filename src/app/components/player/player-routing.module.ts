import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { PlayerMatchesComponent } from './player-matches/player-matches.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { CalendarComponent } from '../shared/calendar/calendar.component';
import { PlayerDashboardComponent } from './player-dashboard/player-dashboard.component';
import { CourtBookingComponent } from './court-booking/court-booking.component';

const routes: Routes = [
  { path: '', redirectTo: 'player-dashboard', pathMatch: 'full' },
  { path: 'player-dashboard', component: PlayerDashboardComponent },
  { path: 'player-reservations', component: PlayerReservationsComponent },
  { path: 'player-matches', component: PlayerMatchesComponent },
  { path: 'profile', component: PlayerProfileComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'booking', component: CourtBookingComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    PlayerDashboardComponent,
    PlayerReservationsComponent,
    PlayerMatchesComponent,
    PlayerProfileComponent,
    CalendarComponent,
    CourtBookingComponent
  ],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }
