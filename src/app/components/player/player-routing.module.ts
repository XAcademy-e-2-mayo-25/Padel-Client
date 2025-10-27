import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerDashboard } from './player-dashboard/player-dashboard.component';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { FindMatchesComponent } from './find-matches/find-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { CalendarComponent } from '../shared/calendar/calendar.component';

const routes: Routes = [
  { path: '', component: PlayerDashboard},
  { path: 'player-reservations', component: PlayerReservationsComponent },
  { path: 'matches', component: FindMatchesComponent },
  { path: 'friends', component: FriendsComponent },
  { path: 'profile', component: PlayerProfileComponent },
  { path: 'calendar', component: CalendarComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }
