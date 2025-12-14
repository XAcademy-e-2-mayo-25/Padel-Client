import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolService, ROLES } from '../../../services/rol/rol.service';

/**
 * Componente para testing - Permite cambiar de rol sin modificar la BD
 *
 * USO: Agregar <app-role-switcher></app-role-switcher> en cualquier vista
 * o navegar a /role-switcher
 */
@Component({
  selector: 'app-role-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-switcher-container">
      <div class="card">
        <div class="card-header bg-warning text-dark">
          <h5 class="mb-0"><i class="fas fa-flask me-2"></i>Testing - Cambiar Rol</h5>
        </div>
        <div class="card-body">
          <p class="text-muted small mb-3">
            Esta herramienta es solo para testing. Permite simular diferentes roles
            sin modificar la base de datos.
          </p>

          <!-- Rol actual -->
          <div class="mb-3">
            <strong>Rol actual:</strong>
            <span class="badge ms-2" [ngClass]="getCurrentRoleBadgeClass()">
              {{ getCurrentRoleName() }}
            </span>
          </div>

          <!-- Roles disponibles -->
          <div class="mb-3">
            <strong>Roles del usuario:</strong>
            <div class="mt-2">
              <span *ngFor="let rol of getUserRoles()"
                    class="badge bg-secondary me-1">
                {{ getRoleName(rol) }}
              </span>
              <span *ngIf="getUserRoles().length === 0" class="text-muted">
                Sin roles asignados
              </span>
            </div>
          </div>

          <hr>

          <!-- Botones para cambiar rol -->
          <div class="d-grid gap-2">
            <button class="btn btn-primary"
                    (click)="switchToRole(ROLES.JUGADOR)"
                    [disabled]="isCurrentRole(ROLES.JUGADOR)">
              <i class="fas fa-user me-2"></i>
              Rol Jugador
            </button>

            <button class="btn btn-success"
                    (click)="switchToRole(ROLES.CLUB)"
                    [disabled]="isCurrentRole(ROLES.CLUB)">
              <i class="fas fa-building me-2"></i>
              Cambiar a CLUB
            </button>

            <button class="btn btn-danger"
                    (click)="switchToRole(ROLES.ADMIN)"
                    [disabled]="isCurrentRole(ROLES.ADMIN)">
              <i class="fas fa-shield-alt me-2"></i>
              Cambiar a ADMINISTRADOR
            </button>
          </div>

          <hr>

          <!-- Navegacion rapida a dashboards -->
          <p class="small text-muted mb-2">Navegar a dashboard:</p>
          <div class="btn-group w-100" role="group">
            <button class="btn btn-outline-primary btn-sm" (click)="goToDashboard('player')">
              Jugador
            </button>
            <button class="btn btn-outline-success btn-sm" (click)="goToDashboard('club')">
              Club
            </button>
            <button class="btn btn-outline-danger btn-sm" (click)="goToDashboard('admin')">
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-switcher-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .card-header {
      font-weight: 600;
    }

    code {
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
  `]
})
export class RoleSwitcherComponent implements OnInit {
  ROLES = ROLES;

  constructor(
    private rolService: RolService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('[RoleSwitcher] Componente de testing cargado');
    console.log('[RoleSwitcher] Rol actual:', this.getCurrentRoleName());
  }

  getCurrentRoleName(): string {
    const currentRole = this.rolService.getCurrentRole();
    return currentRole ? this.rolService.getRoleName(currentRole) : 'Sin rol';
  }

  getCurrentRoleBadgeClass(): string {
    const currentRole = this.rolService.getCurrentRole();
    switch (currentRole) {
      case ROLES.ADMIN: return 'bg-danger';
      case ROLES.JUGADOR: return 'bg-primary';
      case ROLES.CLUB: return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getUserRoles(): number[] {
    return this.rolService.getUserRoles();
  }

  getRoleName(roleId: number): string {
    return this.rolService.getRoleName(roleId);
  }

  isCurrentRole(roleId: number): boolean {
    return this.rolService.isCurrentRole(roleId);
  }

  switchToRole(roleId: number): void {
    console.log('[RoleSwitcher] Cambiando a rol:', this.getRoleName(roleId));
    this.rolService.forceCurrentRole(roleId);

    // Recargar la pagina para que los guards se reevaluen
    window.location.reload();
  }

  goToDashboard(type: 'player' | 'club' | 'admin'): void {
    const routes = {
      player: '/player-dashboard',
      club: '/club-dashboard',
      admin: '/admin-dashboard'
    };
    this.router.navigate([routes[type]]);
  }
}
