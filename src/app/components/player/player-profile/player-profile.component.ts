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
  imports: [CommonModule]
})
export class PlayerProfileComponent implements OnInit {
  // Datos del usuario cargados desde la interface
  player!: Usuario;
  loading = true;
  
  constructor(private authService: AuthService, private usuarioService: UsuarioService, private router: Router) {}
  ngOnInit(): void {
  const userIdStr = localStorage.getItem('userId');
  const userId = userIdStr ? parseInt(userIdStr, 10) : null;
  
  if (!userId) {
    console.error('No se pudo obtener el ID del usuario autenticado');
    this.loading = false;
    return;
  }
  
  console.log('UserID obtenido:', userId);
  this.cargarPerfil(userId);
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
  
  logout(): void {
    this.authService.logout();
  }
}
