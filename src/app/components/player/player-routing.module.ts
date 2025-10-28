import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { FindMatchesComponent } from './find-matches/find-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { CalendarComponent } from '../shared/calendar/calendar.component';
import { PlayerDashboardComponent } from './player-dashboard/player-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'player-dashboard', component: PlayerDashboardComponent },
  { path: 'player-reservations', component: PlayerReservationsComponent },
  { path: 'player-matches', component: FindMatchesComponent },
  { path: 'friends', component: FriendsComponent },
  { path: 'profile', component: PlayerProfileComponent },
  { path: 'calendar', component: CalendarComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }