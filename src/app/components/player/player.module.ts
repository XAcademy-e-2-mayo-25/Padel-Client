import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PlayerRoutingModule } from './player-routing.module';

// COMPONENTES DEL MÓDULO PLAYER (todos standalone)
import { PlayerDashboardComponent } from './player-dashboard/player-dashboard.component';
import { PlayerReservationsComponent } from './player-reservations/player-reservations.component';
import { PlayerMatchesComponent } from './player-matches/player-matches.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { UpdateProfileComponent } from './update-profile/update-profile.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PlayerRoutingModule,
    FormsModule,
    ReactiveFormsModule,

    // standalone components
    PlayerDashboardComponent,
    PlayerReservationsComponent,
    PlayerMatchesComponent,
    FriendsComponent,
    PlayerProfileComponent,
    UpdateProfileComponent,   
  ],
})
export class PlayerModule {}
