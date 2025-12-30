import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { RolService, ROLES } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";
import { UsuarioService } from "../../../services/usuario/usuario.service";

type EstadoUsuarioRol = 'HABILITADO' | 'PENDIENTE' | 'BANEADO' | 'SIN_ROL' | 'DESCONOCIDO';

@Component({
  selector: 'app-club-dashboard',
  standalone: true,
  templateUrl: './club-dashboard.component.html',
  styleUrls: ['./club-dashboard.component.css'],
  imports: [CommonModule]
})
export class ClubDashboardComponent implements OnInit {
  clubName: string = 'Club';

  accesoPermitido = true;
  estadoRol: EstadoUsuarioRol = 'DESCONOCIDO';
  motivoBaneo: string | null = null;

  constructor(
    private router: Router,
    private rolService: RolService,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    const userData = this.rolService.getUserData();
    if (userData) {
      this.clubName = userData.nombres || 'Club';
    }

    this.checkAccessByUsuarioRol();
  }

  private checkAccessByUsuarioRol(): void {
    this.authService.getVerifiedUserId().subscribe({
      next: (userId) => {
        this.usuarioService.obtenerUsuario(userId).subscribe({
          next: (usuarioRaw: any) => {
            const usuario = usuarioRaw?.usuario ?? usuarioRaw;

            const roles = Array.isArray(usuario?.roles) ? usuario.roles : [];
            const urClub = roles.find((r: any) => Number(r?.idRol) === ROLES.CLUB);

            if (!urClub) {
              // El usuario no tiene rol CLUB realmente
              this.accesoPermitido = false;
              this.estadoRol = 'SIN_ROL';
              this.motivoBaneo = null;
              return;
            }

            const idEstado = Number(urClub?.idEstado);
            const descripcion = (urClub?.descripcion ?? null) as string | null;

            if (idEstado === 2) {
              this.accesoPermitido = true;
              this.estadoRol = 'HABILITADO';
              this.motivoBaneo = null;
              return;
            }

            if (idEstado === 1) {
              this.accesoPermitido = false;
              this.estadoRol = 'PENDIENTE';
              this.motivoBaneo = null;
              return;
            }

            if (idEstado === 3) {
              this.accesoPermitido = false;
              this.estadoRol = 'BANEADO';
              this.motivoBaneo = descripcion;
              return;
            }

            this.accesoPermitido = false;
            this.estadoRol = 'DESCONOCIDO';
            this.motivoBaneo = null;
          },
          error: () => {
            this.accesoPermitido = false;
            this.estadoRol = 'DESCONOCIDO';
            this.motivoBaneo = null;
          }
        });
      },
      error: () => {
        this.accesoPermitido = false;
        this.estadoRol = 'DESCONOCIDO';
      }
    });
  }

  get overlayTitle(): string {
    if (this.estadoRol === 'BANEADO') return 'Acceso bloqueado';
    if (this.estadoRol === 'PENDIENTE') return 'Pendiente de aprobación';
    if (this.estadoRol === 'SIN_ROL') return 'Rol no disponible';
    return 'Acceso restringido';
  }

  get overlayMessage(): string {
    if (this.estadoRol === 'BANEADO') {
      const motivo = this.motivoBaneo?.trim();
      return motivo ? `Ud ha sido baneado por: ${motivo}` : 'Ud ha sido baneado.';
    }
    if (this.estadoRol === 'PENDIENTE') {
      return 'Tu usuario está pendiente de aprobación.';
    }
    if (this.estadoRol === 'SIN_ROL') {
      return 'Tu usuario no posee el rol CLUB.';
    }
    return 'No pudimos validar el estado de tu rol. Intentá nuevamente.';
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
}
