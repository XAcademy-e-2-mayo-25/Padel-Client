import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UsuarioService } from '../../../services/usuario/usuario.service';

const ROL_ADMIN = 1;
const ROL_JUGADOR = 2;
const ROL_CLUB = 3;

const ESTADO_PENDIENTE = 1;
const ESTADO_HABILITADO = 2;
const ESTADO_BANEADO = 3;

@Component({
  standalone: true,
  selector: 'app-register-component',
  imports: [],
  templateUrl: './register-component.html',
  styleUrls: ['./register-component.css'],
})
export class RegisterComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];

      // Caso 1: vuelvo del backend con token en query param
      if (token) {
        this.authService.setToken(token);
        this.redirectAfterLogin();
        return;
      }

      // Caso 2: ya tengo token (usuario ya logueado) y entró directo a /register
      const existing = this.authService.getToken();
      if (existing) {
        this.redirectAfterLogin();
        return;
      }

      // Caso 3: no hay token quedo en /register mostrando botón
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  private redirectAfterLogin(): void {
    // No es estrictamente necesario loadUserData() para navegar,
    this.authService.loadUserData().subscribe({
      next: () => this.evaluateProfileAndRoles(),
      error: () => this.authService.logout(),
    });
  }

  private evaluateProfileAndRoles(): void {
    this.authService.getVerifiedUserId().subscribe({
      next: (userId) => {
        this.usuarioService.obtenerUsuario(userId).subscribe({
          next: (rawUsuario) => {
            const usuario = this.normalizeUsuario(rawUsuario);

            // 1) Si perfil incompleto va update-profile SIEMPRE
            if (!this.isProfileComplete(usuario)) {
              this.router.navigate(['/update-profile']);
              return;
            }

            // 2) Perfil completo va decidir por ROLES ASIGNADOS (sin importar estado)
            const rolesAsignados: number[] = (usuario?.roles ?? usuario?.usuarioRoles ?? [])
              .map((r: any) => Number(r?.idRol))
              .filter((id: number) => Number.isFinite(id) && id > 0);

            // Si por algún motivo no vinieron roles, asumimos jugador
            if (rolesAsignados.length <= 1) {
              const rol = rolesAsignados[0] ?? ROL_JUGADOR;
              this.navigateByRol(rol);
              return;
            }

            // 3) Tiene más de un rol asignado va selector
            this.router.navigate(['/rol-selector']);
          },
          error: () => this.router.navigate(['/update-profile']),
        });
      },
      error: () => this.authService.logout(),
    });
  }

  private normalizeUsuario(u: any): any | null {
    if (!u) return null;
    return u.usuario ?? u;
  }

  private isProfileComplete(usuario: any): boolean {
    if (!usuario) return false;
    const requiredFields = ['nombres', 'apellidos', 'dni', 'telefono', 'localidad', 'provincia'];
    return requiredFields.every((f) => !!usuario?.[f]);
  }

  /* Intenta leer roles de distintas formas (porque según Sequelize / includes
   puede variar el nombre de la propiedad). Esperado típico: usuario.UsuarioRols / usuario.UsuarioRol / usuario.usuarioRols etc. */
  private getRolesHabilitados(usuario: any): number[] {
    if (!usuario) return [];

    const rel =
      usuario.UsuarioRols ??
      usuario.UsuarioRol ??
      usuario.usuarioRols ??
      usuario.usuarioRol ??
      usuario.roles ??
      [];

    const arr = Array.isArray(rel) ? rel : [];

    // cada item tiene { idRol, idEstado, Rol, Estado }
    const habilitados = arr
      .filter((ur: any) => {
        const idEstado = Number(ur?.idEstado ?? ur?.Estado?.idEstado);
        return idEstado === ESTADO_HABILITADO; // solo roles habilitados
      })
      .map((ur: any) => Number(ur?.idRol ?? ur?.Rol?.idRol))
      .filter((idRol: number) => Number.isFinite(idRol) && idRol > 0);

    // unique
    return Array.from(new Set(habilitados));
  }

  private navigateByRol(idRol: number): void {
    switch (Number(idRol)) {
      case ROL_ADMIN:
        this.router.navigate(['/admin-dashboard']);
        return;
      case ROL_CLUB:
        this.router.navigate(['/club-dashboard']);
        return;
      case ROL_JUGADOR:
      default:
        this.router.navigate(['/player-dashboard']);
        return;
    }
  }
}
