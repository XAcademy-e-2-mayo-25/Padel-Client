import { NgModule } from '@angular/core';
import { CalendarComponent } from '../shared/calendar/calendar.component';
import { FindMatchesComponent } from './find-matches/find-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerDashboard } from './player-dashboard/player-dashboard.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { PlayerRoutingModule } from './player-routing.module';

@NgModule({
  imports: [
    PlayerRoutingModule,
    PlayerDashboard,
    PlayerReservationsComponent,
    FindMatchesComponent,
    FriendsComponent,
    PlayerProfileComponent,
    CalendarComponent,
  ],
  declarations: [],
})
export class PlayerModule {}
