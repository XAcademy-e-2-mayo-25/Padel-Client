import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerRoutingModule } from './player-routing.module';
import { PlayerDashboardComponent } from './player-dashboard/player-dashboard.component';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { FindMatchesComponent } from './find-matches/find-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PlayerRoutingModule,

    PlayerDashboardComponent,
    PlayerReservationsComponent,
    FindMatchesComponent,
    FriendsComponent,
    PlayerProfileComponent,
  ],
})
export class PlayerModule {}
