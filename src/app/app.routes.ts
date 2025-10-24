import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './components/register-component/register-component';
import { RegisterFormComponent } from './components/register-form.component/register-form.component';
import { CourtDataFormComponent } from './components/court-data-form.component/court-data-form.component';
import { Error404 } from './components/error404/error404.component';
import { HomeComponent } from './components/home/home.component';
import { PayDataFormComponent } from './components/pay-data-form.component/pay-data-form.component';
import { RegisterSuccessComponent } from './components/register-success.component/register-success.component';
import { RegisterWithoutCourtsComponent } from './components/register-without-courts.component/register-without-courts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'register-form', component: RegisterFormComponent },
  { path: 'court-data', component: CourtDataFormComponent },
  { path: 'pay-data', component: PayDataFormComponent },
  { path: 'register-success', component: RegisterSuccessComponent },
  { path: 'home', component: HomeComponent },
  { path: 'register-withouts', component: RegisterWithoutCourtsComponent },
  { path: 'court-form', component: CourtDataFormComponent },
  { path: '404', component: Error404 },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
