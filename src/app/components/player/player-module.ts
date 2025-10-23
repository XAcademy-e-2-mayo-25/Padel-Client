import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayerRoutingModule } from './player-routing-module';
import { DailyCalendarComponent } from '../daily-calendar/daily-calendar.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PlayerRoutingModule,
    DailyCalendarComponent
  ]
})
export class PlayerModule { }
