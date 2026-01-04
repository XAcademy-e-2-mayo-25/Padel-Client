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

  setRoleState(user: UserWithRoles, roleId: number, idEstado: number): void {
    if (this.actingUserId) return;
    this.error = null;
    this.message = null;
    this.actingUserId = user.idUsuario;
    this.actingRoleId = roleId;
    this.actingState = idEstado;

    const roles = (user.usuarioRoles ?? []).map(ur => ({
      idRol: ur.idRol,
      idEstado: ur.idRol === roleId ? idEstado : (ur.idEstado ?? ur.estado?.idEstado ?? 2),
      descripcion: ur.estado?.descripcion ?? 'Estado actualizado'
    }));

    this.usuarioService.actualizarRoles(user.idUsuario, {
      roles: roles.map(r => r.idRol),
      estados: roles
    }).pipe(
      finalize(() => {
        this.actingUserId = null;
        this.actingRoleId = null;
        this.actingState = null;
      })
    ).subscribe({
      next: () => {
        // actualizar en memoria
        this.users = this.users.map(u => {
          if (u.idUsuario !== user.idUsuario) return u;
          const nuevosRoles = (u.usuarioRoles ?? []).map(ur =>
            ur.idRol === roleId ? { ...ur, idEstado } : ur
          );
          return { ...u, usuarioRoles: nuevosRoles };
        });
        const label = this.roleEstadoLabel(idEstado);
        this.message = `Rol actualizado a ${label} para ${user.nombres ?? 'usuario'} (#${user.idUsuario}).`;
      },
      error: () => {
        this.error = 'No se pudo actualizar el estado del rol.';
      }
    });
  }

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

  hasPlayerRole(user: UserWithRoles): boolean {
    return (user.usuarioRoles ?? []).some(r => Number(r.idRol) === ROLES.JUGADOR);
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
}
