import { NgModule } from '@angular/core';
import { FindMatchesComponent } from './find-matches/find-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { PlayerRoutingModule } from './player-routing.module';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';

@NgModule({
  imports: [
    PlayerRoutingModule,
    PlayerReservationsComponent,
    FindMatchesComponent,
    FriendsComponent,
    PlayerProfileComponent,
  ],
  declarations: [],
})
export class PlayerModule {}
