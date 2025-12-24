import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { UsuarioService } from '../../../services/usuario/usuario.service';
import { Usuario } from '../../../interfaces/usuario.interface';
import { Router } from '@angular/router';
@Component({
  selector: 'app-player-profile',
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PlayerProfileComponent implements OnInit {
  // Datos del usuario cargados desde la interface
  player!: Usuario;
  loading = true;
  
  constructor(private authService: AuthService, private usuarioService: UsuarioService, private router: Router) {}
  ngOnInit(): void {
    // Primero verifico el token para obtener el ID desde el backend
    this.authService.verifyToken().subscribe({
      next: (response) => {
        const userId = response?.id ?? response?.user?.id ?? null;

        if (!userId) {
          console.error('No se pudo obtener el ID del usuario autenticado');
          this.loading = false;
          return;
        }

        this.cargarPerfil(userId);
      },
      error: (error) => {
        console.error('Error verificando token', error);
        this.loading = false;
      }
    });
}

  cargarPerfil(id: number): void {
    this.usuarioService.obtenerUsuario(id).subscribe({
      next: (usuario: Usuario) => {
        this.player = usuario;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando el perfil del usuario', error);
        this.loading = false;
      },
    });
  }

  goToUpdateProfile(): void {
  this.router.navigate(['/update-profile']);
  }

  goBack(): void {
    // Vuelve al dashboard del jugador
    this.router.navigate(['/player/player-dashboard']);
  }
  
  logout(): void {
    this.authService.logout();
  }
}
