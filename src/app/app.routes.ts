// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NotAuthGuard } from './guards/not-auth.guard';

// Componentes Auth
import { RegisterComponent } from './components/auth/register-component/register-component';
import { UpdateProfileComponent } from './components/player/update-profile/update-profile.component';
import { RegisterWithoutCourtsComponent } from './components/auth/register-without-courts/register-without-courts.component';
import { RegisterSuccessComponent } from './components/auth/register-success/register-success.component';

// Componentes Main
import { HomeComponent } from './components/shared/home/home.component';
import { CourtDataFormComponent } from './components/club/court-data-form/court-data-form.component';
import { PayDataFormComponent } from './components/club/pay-data-form/pay-data-form.component';
import { RolSelectorComponent } from './components/auth/rol-selector/rol-selector.component';

// Error
import { Error404 } from './components/shared/error404/error404';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { MainLayoutComponent } from './layouts/main/main-layout.component';

export const routes: Routes = [
  // Layout Auth (para registro o inicio de sesión)
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [NotAuthGuard],
    children: [
      { path: 'register', component: RegisterComponent },
    ]
  },

  // Layout Main (para contenido protegido)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'update-profile', component: UpdateProfileComponent }, 
      { path: 'court-data', component: CourtDataFormComponent },
      { path: 'pay-data', component: PayDataFormComponent },
      { path: 'rol-selector', component: RolSelectorComponent },
      {
        path: 'player',
        loadChildren: () => import('./components/player/player.module').then(m => m.PlayerModule)
      },
      //esta vistas van acá porque se necesita estar logueado para ver esa información
      { path: 'register-withouts', component: RegisterWithoutCourtsComponent },
      { path: 'register-success', component: RegisterSuccessComponent },
    ]
  },

  // Rutas de error (pueden acceder todos)
  { path: '404', component: Error404 },
  { path: '**', redirectTo: '404' },
];
