import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { RolService, ROLES } from '../../../services/rol/rol.service';

@Component({
  selector: 'app-rol-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rol-selector.component.html',
  styleUrls: ['./rol-selector.component.css']
})
export class RolSelectorComponent implements OnInit {
  ROLES = ROLES;
  availableRoles: number[] = [];
  currentRole: number | null = null;
  message: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private rolService: RolService
  ) {}

  ngOnInit(): void {
    this.availableRoles = this.rolService.getUserRoles();
    this.currentRole = this.rolService.getCurrentRole();
  }

  hasRole(roleId: number): boolean {
    return this.availableRoles.includes(roleId);
  }

  isCurrentRole(roleId: number): boolean {
    return this.currentRole === roleId;
  }

  selectRole(roleId: number): void {
    const route = this.getDashboardRoute(roleId);
    if (!route) {
      this.message = 'No encontramos la ruta para este rol.';
      return;
    }

    if (this.hasRole(roleId)) {
      this.rolService.setCurrentRole(roleId);
      this.message = `Estás navegando como ${this.rolService.getRoleName(roleId)}.`;
    } else {
      // Permite navegar igual (modo testing) forzando el rol
      this.rolService.forceCurrentRole(roleId);
      this.message = `Rol ${this.rolService.getRoleName(roleId)} forzado para probar la vista.`;
    }

    this.currentRole = roleId;
    this.router.navigate([route]);
  }

  getDashboardRoute(roleId: number): string | null {
    switch (roleId) {
      case ROLES.ADMIN:
        return '/admin-dashboard';
      case ROLES.CLUB:
        return '/club-dashboard';
      case ROLES.JUGADOR:
        return '/player-dashboard';
      default:
        return null;
    }
  }

  getCurrentRoleName(): string {
    return this.currentRole ? this.rolService.getRoleName(this.currentRole) : 'Sin rol seleccionado';
  }

  logout(): void {
    this.authService.logout();
  }

  getEnabledRoleNames(): string {
    if (this.availableRoles.length === 0) {
      return 'Sin roles habilitados';
    }
    return this.availableRoles
      .map(role => this.rolService.getRoleName(role))
      .join(', ');
  }
}
