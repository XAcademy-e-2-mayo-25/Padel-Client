import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Constantes de roles (coinciden con los seeders del backend)
export const ROLES = {
  ADMIN: 1,
  JUGADOR: 2,
  CLUB: 3
} as const;

export type RolId = typeof ROLES[keyof typeof ROLES];

export interface UsuarioRol {
  idRol: number;
  idEstado: number;
  rol?: { idRol: number; nombre: string };
  estado?: { idEstado: number; descripcion: string };
}

export interface UserWithRoles {
  idUsuario: number;
  email: string;
  nombres: string;
  apellidos: string;
  usuarioRoles?: UsuarioRol[];
}

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private readonly STORAGE_KEY = 'user_roles';
  private readonly CURRENT_ROLE_KEY = 'current_role';
  private readonly USER_DATA_KEY = 'user_data';

  // BehaviorSubject para que los componentes puedan suscribirse a cambios de rol
  private currentRoleSubject = new BehaviorSubject<number | null>(this.getCurrentRole());
  public currentRole$ = this.currentRoleSubject.asObservable();

  constructor() {}

  // Guarda los datos del usuario incluyendo sus roles
  setUserData(user: UserWithRoles): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));

    // Extraer los roles del jugador, sin importar su estado
    const rawRoles = (user.usuarioRoles ?? (user as any).roles ?? []) as any[];

    const roles: number[] = rawRoles
      .map(r => Number(r.idRol))
      .filter((id): id is number => Number.isFinite(id) && id > 0);

    const rolesFinal: number[] =
      roles.length > 0 ? Array.from(new Set(roles)) : [ROLES.JUGADOR];

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rolesFinal));

    // Si no hay rol actual seleccionado, establecer el primero disponible
    if (!this.getCurrentRole() && rolesFinal.length > 0) {
      this.setCurrentRole(rolesFinal[0]);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roles));

    // Si no hay rol actual seleccionado, establecer el primero disponible
    if (!this.getCurrentRole() && roles.length > 0) {
      this.setCurrentRole(roles[0]);
    }
  }

  // Obtiene los datos del usuario almacenados
  getUserData(): UserWithRoles | null {
    const data = localStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Obtiene todos los roles del usuario
  getUserRoles(): number[] {
    const roles = localStorage.getItem(this.STORAGE_KEY);
    return roles ? JSON.parse(roles) : [];
  }

  // Establece el rol actualmente activo (para usuarios con múltiples roles)
  setCurrentRole(roleId: number): void {
    const userRoles = this.getUserRoles();
    if (userRoles.includes(roleId)) {
      localStorage.setItem(this.CURRENT_ROLE_KEY, String(roleId));
      this.currentRoleSubject.next(roleId);
    }
  }

  // Obtiene el rol actualmente activo
  getCurrentRole(): number | null {
    const role = localStorage.getItem(this.CURRENT_ROLE_KEY);
    return role ? Number(role) : null;
  }

  // Verifica si el usuario tiene un rol específico
  hasRole(roleId: number): boolean {
    return this.getUserRoles().includes(roleId);
  }

  // Verifica si el usuario tiene alguno de los roles especificados
  hasAnyRole(roleIds: number[]): boolean {
    const userRoles = this.getUserRoles();
    return roleIds.some(id => userRoles.includes(id));
  }

  // Verifica si el rol actual es el especificado
  isCurrentRole(roleId: number): boolean {
    return this.getCurrentRole() === roleId;
  }

  // Limpia todos los datos de roles (para logout)
  clearRoles(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CURRENT_ROLE_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    this.currentRoleSubject.next(null);
  }

  // Obtiene el nombre del rol por su ID
  getRoleName(roleId: number): string {
    switch (roleId) {
      case ROLES.ADMIN: return 'Administrador';
      case ROLES.JUGADOR: return 'Jugador';
      case ROLES.CLUB: return 'Club';
      default: return 'Desconocido';
    }
  }

  // MÉTODOS PARA TESTING - Permiten simular roles

  /**
   * [SOLO PARA TESTING] Simula que el usuario tiene ciertos roles
   * Útil para probar las vistas sin necesidad de modificar la base de datos
   */
  simulateRoles(roleIds: number[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roleIds));
    if (roleIds.length > 0 && !roleIds.includes(this.getCurrentRole() ?? 0)) {
      this.setCurrentRole(roleIds[0]);
    }
    console.log('[RolService] Roles simulados:', roleIds.map(id => this.getRoleName(id)));
  }

  /**
   * [SOLO PARA TESTING] Cambia el rol actual directamente
   */
  forceCurrentRole(roleId: number): void {
    localStorage.setItem(this.CURRENT_ROLE_KEY, String(roleId));
    // También asegurar que el rol esté en la lista de roles
    const roles = this.getUserRoles();
    if (!roles.includes(roleId)) {
      roles.push(roleId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roles));
    }
    this.currentRoleSubject.next(roleId);
    console.log('[RolService] Rol forzado a:', this.getRoleName(roleId));
  }
}
