import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './components/auth/register-component/register-component';
import { RegisterFormComponent } from './components/auth/register-form/register-form.component';
import { CourtDataFormComponent } from './components/club/court-data-form/court-data-form.component';
import { Error404 } from './components/shared/error404/error404';
import { HomeComponent } from './components/shared/home/home.component';
import { PayDataFormComponent } from './components/club/pay-data-form/pay-data-form.component';
import { RegisterSuccessComponent } from './components/auth/register-success/register-success.component';
import { RegisterWithoutCourtsComponent } from './components/auth/register-without-courts/register-without-courts.component';
import { RolSelectorComponent } from './components/auth/rol-selector/rol-selector.component';
import { PlayerDashboardComponent } from './components/player/player-dashboard/player-dashboard.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { CalendarComponent } from './components/shared/calendar/calendar.component';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  //COMPONENTES PARA REGISTRO DE USUARIOS
  { path: 'register', component: RegisterComponent },
  { path: 'register-form', component: RegisterFormComponent },
  //COMPONENTE PARA REGISTRO DE USUARIOS SIN CANCHAS
  { path: 'register-withouts', component: RegisterWithoutCourtsComponent },
  //COMPONENTE PARA CONFIRMACION DE REGISTRO
  { path: 'register-success', component: RegisterSuccessComponent },

  //COMPONENTE PARA FORMULARIO DE DATOS DE CANCHAS
  { path: 'court-data', component: CourtDataFormComponent },
  //COMPONENTE PARA FORMULARIO DE DATOS DE PAGO
  { path: 'pay-data', component: PayDataFormComponent },
  // COMPONENTE PARA SELECCION DE ROL
  { path: 'rol-selector', component: RolSelectorComponent },

  // COMPONENTE PARA CALENDARIO
  { path: 'calendar', component: CalendarComponent },

  { path: 'home', component: HomeComponent },

  // COMPONENTES PARA DASHBOARD DE JUGADOR
  { path: 'player/dashboard', component: PlayerDashboardComponent },
  
  { path: 'footer', component: FooterComponent },
  { path: '404', component: Error404 },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
