import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../services/usuario/usuario.service';
import { AuthService } from '../../../services/auth/auth.service'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-reservations',
  templateUrl: './player-reservations.component.html',
  styleUrls: ['./player-reservations.component.css'],
  imports: [CommonModule],
})
export class PlayerReservationsComponent implements OnInit {

  reservas: any[] = [];
  loading = true;

  filtroEstado = 'ALL';
  filtroCancha = '';
  filtroFecha = '';

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.loading = true;

    this.usuarioService.listarMisPartidos().subscribe({
      next: (data) => {
        this.reservas = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar reservas', err);
        this.loading = false;
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  // ayudas visuales
  getEstadoBadge(estado: string): string {
    switch (estado) {
      case 'CONFIRMADA': return 'bg-success';
      case 'PENDIENTE': return 'bg-warning text-dark';
      case 'CANCELADA': return 'bg-danger';
      case 'COMPLETADA': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
