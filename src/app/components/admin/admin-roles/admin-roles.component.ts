import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { catchError, finalize, of, switchMap, throwError } from "rxjs";
import { Club, ClubService, Paginado } from "../../../services/club/club.service";
import { UsuarioService } from "../../../services/usuario/usuario.service";
import { RolService, ROLES, UserWithRoles } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.css'],
  imports: [CommonModule]
})
export class AdminRolesComponent implements OnInit {
  pendingClubs: Club[] = [];
  pendingLoading = false;
  pendingError: string | null = null;
  approvingClubId: number | null = null;
  approveMessage: string | null = null;
  actingClubId: number | null = null;
  actingState: number | null = null;

  constructor(
    private router: Router,
    private clubService: ClubService,
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPendingClubs();
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }

  loadPendingClubs(): void {
    this.pendingLoading = true;
    this.pendingError = null;
    this.clubService.listarClubs({ idEstadoClub: 1, page: 1, limit: 20 }).pipe(
      finalize(() => this.pendingLoading = false)
    ).subscribe({
      next: (resp: Paginado<Club>) => {
        // Solo mostramos pendientes en este panel
        this.pendingClubs = (resp.items ?? []).filter(c => c.idEstadoClub === 1);
      },
      error: () => {
        this.pendingError = 'No pudimos cargar las solicitudes.';
      }
    });
  }

  approveClub(club: Club): void {
    if (this.approvingClubId) return;
    this.pendingError = null;
    this.approveMessage = null;
    this.approvingClubId = club.idClub;

    this.clubService.actualizarClub(club.idClub, { idEstadoClub: 2 }).pipe(
      switchMap(() => this.ensureClubRole(club.idUsuario, 2, "Habilitado como Club.")),
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

  rejectClub(club: Club): void {
    if (this.approvingClubId) return;
    this.pendingError = null;
    this.approveMessage = null;
    this.approvingClubId = club.idClub;

    this.clubService.actualizarClub(club.idClub, { idEstadoClub: 3 }).pipe(
      switchMap(() =>
        this.ensureClubRole(
          club.idUsuario,
          3,
          'Club no cumple con los requisitos para ser autorizado'
        )
      ),
      finalize(() => this.approvingClubId = null)
    ).subscribe({
      next: () => {
        this.approveMessage = `El club "${club.nombreFantasia ?? club.razonSocial ?? club.idClub}" fue rechazado.`;
        this.pendingClubs = this.pendingClubs.filter(c => c.idClub !== club.idClub);
      },
      error: () => {
        this.pendingError = 'Hubo un problema al rechazar el club.';
      }
    });
  }

  setEstado(club: Club, estado: number): void {
    if (this.actingClubId) return;
    this.pendingError = null;
    this.approveMessage = null;
    this.actingClubId = club.idClub;
    this.actingState = estado;

    const patch$ = this.clubService.actualizarClub(club.idClub, { idEstadoClub: estado });

    patch$.pipe(
      switchMap(() => this.ensureClubRole(club.idUsuario, 2, "Habilitado como Club.")),
      finalize(() => {
        this.actingClubId = null;
        this.actingState = null;
      })
    ).subscribe({
      next: () => {
        const label = this.estadoLabel(estado);
        this.approveMessage = `El club "${club.nombreFantasia ?? club.razonSocial ?? club.idClub}" ahora está en estado ${label}.`;
        this.loadPendingClubs();
      },
      error: () => {
        this.pendingError = 'No se pudo actualizar el estado del club.';
      }
    });
  }

  estadoLabel(estado: number): string {
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Habilitado';
      case 3: return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  estadoClass(estado: number): string {
    switch (estado) {
      case 1: return 'badge bg-warning text-dark';
      case 2: return 'badge bg-success';
      case 3: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  formatDate(date?: string | null): string {
    if (!date) return 'N/D';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/D';
    return d.toLocaleString();
  }

  private ensureClubRole(
    idUsuario: number,
    clubEstado: number,
    descripcionClub: string
  ) {
    type UsuarioRolLike = {
      idRol?: number;
      rol?: { idRol?: number };
      idEstado?: number;
      estado?: { idEstado?: number };
      descripcion?: string | null;
    };

    return this.usuarioService.obtenerUsuario(idUsuario).pipe(
      switchMap((user: UserWithRoles) => {
        if (!user) throw new Error('No encontramos el usuario del club');

        const rolesActualesRaw = (user.usuarioRoles ?? []) as UsuarioRolLike[];

        const rolesActuales = Array.from(
          rolesActualesRaw.reduce((acc, ur) => {
            const idRol = Number(ur.idRol ?? ur.rol?.idRol);
            if (!Number.isFinite(idRol)) return acc;
            if (!acc.has(idRol)) acc.set(idRol, ur);
            return acc;
          }, new Map<number, UsuarioRolLike>()).values()
        );

        const rolesSet = new Set<number>(
          rolesActuales
            .map((ur) => Number(ur.idRol ?? ur.rol?.idRol))
            .filter((n) => Number.isFinite(n))
        );

        // asegurar rol CLUB
        rolesSet.add(ROLES.CLUB);

        const rolesPayload = Array.from(rolesSet).sort((a, b) => a - b);

        const estadosPayload = rolesPayload.map((idRol) => {
          const ur = rolesActuales.find((x) => Number(x.idRol ?? x.rol?.idRol) === idRol);

          const estadoActual = Number(ur?.idEstado ?? ur?.estado?.idEstado);
          const descripcionActual = ur?.descripcion ?? undefined;

          if (idRol === ROLES.CLUB) {
            return {
              idRol,
              idEstado: clubEstado,
              descripcion: descripcionClub,
            };
          }

          return {
            idRol,
            idEstado: Number.isFinite(estadoActual) ? estadoActual : 2,
            descripcion: descripcionActual ?? undefined,
          };
        });

        return this.usuarioService.actualizarRoles(user.idUsuario, {
          roles: rolesPayload,
          estados: estadosPayload,
          defaultEstado: 2,
        });
      })
    );
  }
}
