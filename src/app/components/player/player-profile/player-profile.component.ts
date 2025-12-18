import { Component } from '@angular/core';


@Component({
  selector: 'app-player-profile',
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent {

  // Valores estáticos
  player = {
    nombre: 'Gabriel',
    apellido: 'Ignacio',
    posicion: 'Drive',
    dni: '12345678',
    email: 'gabriel@example.com',
    provincia: 'Córdoba',
    localidad: 'Rio cuarto',
    categoria: 'Octava',
    fotoUrl: '/default-profile.png'
  }
 
   logout(): void {
    // Lógica para cerrar sesión
    console.log('Cerrando sesión...');
    // Ejemplo: this.authService.logout();
    // this.router.navigate(['/login']);
  }

}