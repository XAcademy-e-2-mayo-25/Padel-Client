import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { UsuarioService } from "../../../services/usuario/usuario.service";
import { ParamListarUsuario } from "../../../interfaces/lista-usuarios.interface";
import { RolService, ROLES, UserWithRoles } from "../../../services/rol/rol.service";
import { AuthService } from "../../../services/auth/auth.service";

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule, FormsModule]
})
export class AdminUsersComponent implements OnInit {
  users: UserWithRoles[] = [];
  loading = false;
  error: string | null = null;
  message: string | null = null;
  actingUserId: number | null = null;
  actingRoleId: number | null = null;
  actingState: number | null = null;

  // Modal ban
  banModalOpen = false;
  banMotivo = '';
  banTargetUser: UserWithRoles | null = null;

  filters: {
    nombre: string;
    email: string;
    idRol: string;
    sortBy: ParamListarUsuario['sortBy'];
    sortDir: ParamListarUsuario['sortDir'];
  } = {
    nombre: '',
    email: '',
    idRol: '',
    sortBy: 'idUsuario',
    sortDir: 'ASC'
  };

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  resetFilters(): void {
    this.filters = {
      nombre: '',
      email: '',
      idRol: '',
      sortBy: 'idUsuario',
      sortDir: 'ASC'
    };
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.message = null;

    const params: ParamListarUsuario = {
      page: 1,
      limit: 100,
      nombre: this.filters.nombre.trim() || undefined,
      email: this.filters.email.trim() || undefined,
      idRol: this.filters.idRol ? Number(this.filters.idRol) : undefined,
      sortBy: this.filters.sortBy,
      sortDir: this.filters.sortDir
    };

    this.usuarioService.listarUsuarios(params).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (resp: any) => {
        const list =
          Array.isArray(resp?.items) ? resp.items :
          Array.isArray(resp?.usuarios) ? resp.usuarios :
          Array.isArray(resp) ? resp : [];

        this.users = (list as any[]).map(u => this.mapUser(u));
      },
      error: () => {
        this.error = 'No pudimos cargar los usuarios.';
      }
    });
  }

  // Rol Jugador helpers
  hasPlayerRole(user: UserWithRoles): boolean {
    return (user.usuarioRoles ?? []).some(r => Number(r.idRol) === ROLES.JUGADOR);
  }

  getPlayerRoleState(user: UserWithRoles): number | null {
    const ur = (user.usuarioRoles ?? []).find(r => Number(r.idRol) === ROLES.JUGADOR);
    if (!ur) return null;
    const st = Number((ur as any).idEstado ?? (ur as any).estado?.idEstado);
    return Number.isFinite(st) ? st : null;
  }

  isPlayerEnabled(user: UserWithRoles): boolean {
    return this.getPlayerRoleState(user) === 2;
  }

  isPlayerBanned(user: UserWithRoles): boolean {
    return this.getPlayerRoleState(user) === 3;
  }

  // Ban / Unban (con modal)
  openBanModal(user: UserWithRoles): void {
    if (this.actingUserId) return;
    this.error = null;
    this.message = null;

    this.banTargetUser = user;
    this.banMotivo = '';
    this.banModalOpen = true;
  }

  closeBanModal(): void {
    if (this.actingUserId) return;
    this.banModalOpen = false;
    this.banTargetUser = null;
    this.banMotivo = '';
  }

  confirmarBanJugador(): void {
    if (!this.banTargetUser) return;
    if (this.actingUserId) return;

    const motivo = (this.banMotivo || '').trim();
    if (!motivo) {
      this.error = 'Ingresá un motivo para banear al jugador.';
      return;
    }

    const user = this.banTargetUser;

    this.error = null;
    this.message = null;
    this.actingUserId = user.idUsuario;
    this.actingRoleId = ROLES.JUGADOR;
    this.actingState = 3;

    this.banJugadorRequest(user.idUsuario, motivo).pipe(
      finalize(() => {
        this.actingUserId = null;
        this.actingRoleId = null;
        this.actingState = null;
      })
    ).subscribe({
      next: () => {
        this.message = `Jugador baneado (#${user.idUsuario}).`;
        this.closeBanModal();
        this.loadUsers(); //refrescar dashboard al banear un jugador
      },
      error: (e) => {
        console.error(e);
        const msg = e?.error?.message;
        this.error = typeof msg === 'string' ? msg : 'No se pudo banear el jugador.';
      }
    });
  }

  habilitarJugador(user: UserWithRoles): void {
    if (this.actingUserId) return;

    this.error = null;
    this.message = null;
    this.actingUserId = user.idUsuario;
    this.actingRoleId = ROLES.JUGADOR;
    this.actingState = 2;

    this.unbanJugadorRequest(user.idUsuario).pipe(
      finalize(() => {
        this.actingUserId = null;
        this.actingRoleId = null;
        this.actingState = null;
      })
    ).subscribe({
      next: () => {
        this.message = `Jugador habilitado (#${user.idUsuario}).`;
        this.loadUsers(); //refrescar dashboard al desbanear un jugador
      },
      error: (e) => {
        console.error(e);
        const msg = e?.error?.message;
        this.error = typeof msg === 'string' ? msg : 'No se pudo habilitar el jugador.';
      }
    });
  }

  // Mapeo de usuarios
  private mapUser(u: any): UserWithRoles {
    const rolesRaw: any[] = Array.isArray(u?.usuarioRoles)
      ? u.usuarioRoles
      : Array.isArray(u?.roles)
        ? u.roles
        : [];

    const priority: Record<number, number> = {
      [ROLES.ADMIN]: 1,
      [ROLES.JUGADOR]: 2,
      [ROLES.CLUB]: 3
    };

    const usuarioRoles = rolesRaw.map(r => ({
      idRol: Number(r?.idRol),
      idEstado: Number(r?.idEstado ?? r?.estado?.idEstado ?? 2),
      estado: r?.estado
    }))
    .filter(r => Number.isFinite(r.idRol))
    .sort((a, b) => (priority[a.idRol] ?? 99) - (priority[b.idRol] ?? 99));

    return { ...u, usuarioRoles };
  }

  roleName(idRol: number): string {
    return this.rolService.getRoleName(idRol);
  }

  roleBadgeClass(idRol: number): string {
    switch (idRol) {
      case ROLES.ADMIN: return 'badge bg-danger';
      case ROLES.JUGADOR: return 'badge bg-primary';
      case ROLES.CLUB: return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }

  roleEstadoLabel(idEstado?: number): string {
    switch (Number(idEstado)) {
      case 1: return 'Pendiente';
      case 2: return 'Habilitado';
      case 3: return 'Baneado/Rechazado';
      default: return 'N/D';
    }
  }

  roleEstadoClass(idEstado?: number): string {
    switch (Number(idEstado)) {
      case 1: return 'badge bg-warning text-dark';
      case 2: return 'badge bg-success';
      case 3: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  //Helpers
  private banJugadorRequest(idUsuario: number, motivo: string) {
    return this.usuarioService.banearUsuario(idUsuario, {
      idRol: ROLES.JUGADOR,
      descripcion: motivo.trim(),
    });
  }

  private unbanJugadorRequest(idUsuario: number) {
    return this.usuarioService.desbanearUsuario(idUsuario, {
      idRol: ROLES.JUGADOR,
      descripcion: ' ', // limpiar descripción para quitar motivo del ban
    });
  }
}
