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
      switchMap(() => this.ensureClubRole(club.idUsuario, true, 2)),
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

  setEstado(club: Club, estado: number): void {
    // Mantener compatibilidad si en el futuro se agregan otros estados,
    // pero actualmente no se usa en la UI (solo se muestra aprobar).
    if (this.actingClubId) return;
    this.pendingError = null;
    this.approveMessage = null;
    this.actingClubId = club.idClub;
    this.actingState = estado;

    const patch$ = this.clubService.actualizarClub(club.idClub, { idEstadoClub: estado });

    patch$.pipe(
      switchMap(() => this.ensureClubRole(club.idUsuario, estado === 2, estado)),
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

  private ensureClubRole(idUsuario: number, addIfMissing: boolean = true, forceClubState?: number) {
    return this.usuarioService.obtenerUsuario(idUsuario).pipe(
      switchMap((user: UserWithRoles) => {
        if (!user) {
          throw new Error('No encontramos el usuario del club');
        }

        const rolesActualesRaw = user.usuarioRoles ?? [];
        // Deduplicar por idRol (por si vienen entradas duplicadas de la API)
        const rolesActuales = Array.from(
          rolesActualesRaw.reduce((acc, ur) => {
            if (!acc.has(ur.idRol)) acc.set(ur.idRol, ur);
            return acc;
          }, new Map<number, any>()).values()
        );

        const yaEsClub = rolesActuales.some(ur => ur.idRol === ROLES.CLUB);

        // Preservamos estados actuales; solo agregamos rol de club si no existe
        const estados = rolesActuales.map(ur => ({
          idRol: ur.idRol,
          idEstado: ur.idRol === ROLES.CLUB && forceClubState !== undefined
            ? forceClubState
            : (ur.idEstado ?? ur.estado?.idEstado ?? 2),
          descripcion: ur.estado?.descripcion ?? 'Activo'
        }));

        // Si ya tiene rol de club y debemos cambiar estado, hacemos dos pasos:
        // 1) removemos el rol de club del payload para que el backend lo borre
        // 2) reinsertamos todos los roles con el club en el estado deseado
        if (yaEsClub && forceClubState !== undefined) {
          const estadosSinClub = estados.filter(e => e.idRol !== ROLES.CLUB);
          const estadosConClubActualizados = [
            ...estadosSinClub,
            { idRol: ROLES.CLUB, idEstado: forceClubState, descripcion: forceClubState === 2 ? 'Habilitado como club' : 'Pendiente/Rechazado' }
          ];

          return this.usuarioService.actualizarRoles(user.idUsuario, {
            roles: estadosSinClub.map(e => e.idRol),
            estados: estadosSinClub
          }).pipe(
            catchError(err => this.handleDuplicate(err)),
            switchMap(() => this.usuarioService.actualizarRoles(user.idUsuario, {
              roles: estadosConClubActualizados.map(e => e.idRol),
              estados: estadosConClubActualizados
            }))
          );
        }

        if (!yaEsClub && addIfMissing) {
          estados.push({
            idRol: ROLES.CLUB,
            idEstado: forceClubState ?? 2,
            descripcion: 'Habilitado como club'
          });
        }

        return this.usuarioService.actualizarRoles(user.idUsuario, {
          roles: estados.map(e => e.idRol),
          estados
        });
      }),
      catchError(err => this.handleDuplicate(err))
    );
  }

  private handleDuplicate(err: any) {
    const duplicate =
      err?.code === 'ER_DUP_ENTRY' ||
      err?.original?.code === 'ER_DUP_ENTRY' ||
      err?.sqlMessage?.includes('Duplicate entry') ||
      err?.message?.includes('Duplicate entry');

    // Si ya existe el rol, consideramos la operación como completada
    if (duplicate) {
      return of(null);
    }

    return throwError(() => err);
  }
}
