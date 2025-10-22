import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './components/register-component/register-component';
import { HomeComponent } from './components/home/home.component';
import { Error404 } from './components/error404/error404';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourtDataFormComponent } from './components/court-data-form.component/court-data-form.component';
import { RegisterFormComponent } from './components/register-form.component/register-form.component';
import { PayDataFormComponent } from './components/pay-data-form.component/pay-data-form.component';
import { RegisterSuccessComponent } from './components/register-success.component/register-success.component';
import { RolSelectorComponent } from './components/rol-selector.component/rol-selector.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserModule,
    ReactiveFormsModule,
    RouterModule,
    // Componentes
    FooterComponent,
    RegisterComponent,
    RegisterFormComponent,
    HomeComponent,
    Error404,
    CourtDataFormComponent,
    PayDataFormComponent,
    RegisterSuccessComponent,
    RolSelectorComponent

  ],
  providers: [],
  bootstrap: [],
})
export class AppModule {}
