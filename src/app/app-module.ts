// Padel-Client/src/app/app-module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { RegisterComponent } from './components/auth/register-component/register-component';
import { HomeComponent } from './components/shared/home/home.component';
import { Error404 } from './components/shared/error404/error404';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourtDataFormComponent } from './components/club/court-data-form/court-data-form.component';
import { RegisterFormComponent } from './components/auth/register-form/register-form.component';
import { PayDataFormComponent } from './components/club/pay-data-form/pay-data-form.component';
import { RegisterSuccessComponent } from './components/auth/register-success/register-success.component';
import { RolSelectorComponent } from './components/auth/rol-selector/rol-selector.component';
import { PlayerDashboard } from './components/player/player-dashboard/player-dashboard.component';
import { CalendarComponent } from './components/shared/calendar/calendar.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserModule,
    ReactiveFormsModule,
    RouterModule,
    // Componentes
    RegisterComponent,
    RegisterFormComponent,
    HomeComponent,
    Error404,
    CourtDataFormComponent,
    PayDataFormComponent,
    RegisterSuccessComponent,
    RolSelectorComponent,
    PlayerDashboard,
    CalendarComponent,
    RolSelectorComponent,

  ],
  providers: [],
  bootstrap: [],
})
export class AppModule {}
