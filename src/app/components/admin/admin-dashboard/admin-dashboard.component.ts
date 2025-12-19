import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { finalize, switchMap } from "rxjs";
import { RolService, ROLES, UserWithRoles } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";
import { Club, ClubService, Paginado } from "../../../services/club/club.service";
import { UsuarioService } from "../../../services/usuario/usuario.service";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [CommonModule]
})
export class AdminDashboardComponent implements OnInit {
  adminName: string = 'Administrador';
  pendingClubs: Club[] = [];
  pendingLoading = false;
  pendingError: string | null = null;
  approvingClubId: number | null = null;
  approveMessage: string | null = null;

  constructor(
    private router: Router,
    private rolService: RolService,
    private authService: AuthService,
    private clubService: ClubService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    const userData = this.rolService.getUserData();
    if (userData) {
      this.adminName = userData.nombres || 'Administrador';
    }
    this.loadPendingClubs();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }

  loadPendingClubs(): void {
    this.pendingLoading = true;
    this.pendingError = null;
    this.clubService.listarClubs({ idEstadoClub: 1, page: 1, limit: 20 }).pipe(
      finalize(() => this.pendingLoading = false)
    ).subscribe({
      next: (resp: Paginado<Club>) => {
        this.pendingClubs = resp.items ?? [];
      },
      error: () => {
        this.pendingError = 'No pudimos cargar las solicitudes pendientes.';
      }
    });
  }

  approveClub(club: Club): void {
    if (this.approvingClubId) return;
    this.pendingError = null;
    this.approveMessage = null;
    this.approvingClubId = club.idClub;

    this.clubService.actualizarClub(club.idClub, { idEstadoClub: 2 }).pipe(
      switchMap(() => this.ensureClubRole(club.idUsuario)),
      finalize(() => this.approvingClubId = null)
    ).subscribe({
      next: () => {
        this.approveMessage = `El club "${club.nombreFantasia ?? club.razonSocial ?? club.idClub}" fue aprobado.`;
        this.pendingClubs = this.pendingClubs.filter(c => c.idClub !== club.idClub);
      },
      error: () => {
        this.pendingError = 'Hubo un problema al aprobar el club.';
      }
    });
  }

  private ensureClubRole(idUsuario: number) {
    return this.usuarioService.obtenerUsuario(idUsuario).pipe(
      switchMap((user: UserWithRoles) => {
        if (!user) {
          throw new Error('No encontramos el usuario del club');
        }

        const rolesSet = new Set<number>();
        user.usuarioRoles?.forEach(rol => rolesSet.add(rol.idRol));
        rolesSet.add(ROLES.CLUB);

        const rolesArray = Array.from(rolesSet);
        const estados = rolesArray.map(idRol => {
          const existente = user.usuarioRoles?.find(ur => ur.idRol === idRol);
          const descripcionBase = existente?.estado?.descripcion ?? 'Activo';
          return {
            idRol,
            idEstado: idRol === ROLES.CLUB ? 2 : (existente?.idEstado ?? 2),
            descripcion: idRol === ROLES.CLUB ? 'Habilitado como club' : descripcionBase
          };
        });

        return this.usuarioService.actualizarRoles(user.idUsuario, {
          roles: rolesArray,
          estados,
          defaultEstado: 2
        });
      })
    );
  }
}
