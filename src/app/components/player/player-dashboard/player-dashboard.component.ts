import { Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";

import { CalendarComponent } from "../../shared/calendar/calendar.component";
import { RolService, ROLES } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";
import { UsuarioService } from "../../../services/usuario/usuario.service";
import { ClubService } from "../../../services/club/club.service";

type EstadoRol = 'PENDIENTE' | 'HABILITADO' | 'BANEADO';

@Component({
  selector: 'app-player-dashboard',
  templateUrl: './player-dashboard.component.html',
  styleUrls: ['./player-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, CalendarComponent, RouterModule]
})
export class PlayerDashboardComponent implements OnInit {
  playerName: string = 'Jugador';
  calendarUrl!: SafeResourceUrl;
  currentView: string = 'week';
  calendarId: string = 'primary';
  tieneClub = false;

  //BLOQUEO POR ESTADO DE ROL
  roleEstado: EstadoRol | null = null;
  roleDescripcion: string | null = null;

  get isBlocked(): boolean {
    return this.roleEstado === 'PENDIENTE' || this.roleEstado === 'BANEADO';
  }

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private rolService: RolService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private clubService: ClubService
  ) {}

  ngOnInit() {
    this.updateCalendarUrl();
    this.checkRoleAccess();
    this.checkTieneClub();
  }

  private checkRoleAccess(): void {
    this.authService.getVerifiedUserId().subscribe({
      next: (userId) => {
        this.usuarioService.obtenerUsuario(userId).subscribe({
          next: (usuario: any) => {
            const roles = Array.isArray(usuario?.roles) ? usuario.roles : [];

            const ur = roles.find((r: any) => Number(r?.idRol) === ROLES.JUGADOR);

            // Si por algún motivo no viene el rol, lo dejamos pasar (no bloqueamos)
            if (!ur) {
              this.roleEstado = 'HABILITADO';
              this.roleDescripcion = null;
              return;
            }

            const idEstado = Number(ur?.idEstado);
            this.roleDescripcion = ur?.descripcion ?? null;

            // 1=PENDIENTE 2=HABILITADO 3=BANEADO
            if (idEstado === 2) this.roleEstado = 'HABILITADO';
            else if (idEstado === 3) this.roleEstado = 'BANEADO';
            else this.roleEstado = 'PENDIENTE';
          },
          error: () => {
            // si falla, no bloqueamos para no romper UX
            this.roleEstado = 'HABILITADO';
            this.roleDescripcion = null;
          }
        });
      },
      error: () => {
        // pero igual por seguridad:
        this.authService.logout();
      }
    });
  }

  updateCalendarUrl(): void {
    const baseUrl = 'https://calendar.google.com/calendar/embed';
    const params = `?src=${this.calendarId}&mode=${this.currentView}&hl=es&ctz=America%2FArgentina%2FBuenos_Aires`;
    this.calendarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(baseUrl + params);
  }

  changeView(view: string): void {
    this.currentView = view;
    this.updateCalendarUrl();
  }

  get googleCalendarCreateUrl(): string {
    return `https://calendar.google.com/calendar/r/eventedit?src=${this.calendarId}`;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }

  goToRoleSelector(): void {
    this.router.navigate(['/rol-selector']);
  }

  private checkTieneClub(): void {
    this.authService.getVerifiedUserId().subscribe({
      next: (userId) => {
        this.clubService.buscarClubPorUsuario(userId).subscribe({
          next: (club) => {
            this.tieneClub = !!club; // si existe club, true
          },
          error: () => {
            this.tieneClub = false; // si falla, mostramos CTA por defecto
          }
        });
      },
      error: () => {
        this.tieneClub = false;
      }
    });
  }
}
