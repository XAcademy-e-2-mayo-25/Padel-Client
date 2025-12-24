import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../services/usuario/usuario.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css']
})
export class UpdateProfileComponent implements OnInit {
refreshCalendar() {
throw new Error('Method not implemented.');
}
currentView: any;
googleCalendarCreateUrl: any;
changeView(arg0: string) {
throw new Error('Method not implemented.');
}
  form: FormGroup;
  submitting = false;
  photoPreview: string | null = null; // para preview si subís foto
  userId: number | null = null;
  displayName: string = 'Usuario';

  provincias = [
    'Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes',
    'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta',
    'San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ];

  categorias = ['Principiante','Intermedio','Avanzado','Profesional'];
  posiciones = ['Derecha','Revés','Ambas'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      dni: ['', [Validators.required]],
      telefono: ['', Validators.required],
      direccion: [''],
      localidad: ['', Validators.required],
      provincia: ['', Validators.required],
      // foto: no lo guardamos como campo de formulario (podés agregar)
      categoria: [''],
      posicion: [''],
      bio: [''],
      // campo para decidir el flujo: ¿tenés canchas?
      tieneCanchas: [false]
    });
  }

  ngOnInit() {
  console.log('Verificando token...');

  this.authService.verifyToken().subscribe({
    next: (response) => {
      console.log('Respuesta de verify:', response);
        //Si el token es valido extrae y almacena el ID
      if (response?.valid && response.id) {
        const userId = response.id;
        this.userId = userId;
        console.log('User ID obtenido:', this.userId);

        this.cargarDatosUsuario(userId);
      } else {
        console.error('Token inválido o sin ID');
      }
    },
    error: (error) => {
      console.error('Error verificando token:', error);
      alert('Tu sesión ha expirado. Iniciá sesión nuevamente.');
      this.router.navigate(['/login']);
    }
  });
}


  cargarDatosUsuario(id: number) {
    this.usuarioService.obtenerUsuario(id).subscribe({
      next: (usuario) => {
        if (usuario) {
          this.displayName = usuario.nombres || this.displayName;
          this.form.patchValue({
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            dni: usuario.dni || '',
            telefono: usuario.telefono || '',
            direccion: usuario.direccion || '',
            localidad: usuario.localidad || '',
            provincia: usuario.provincia || '',
            categoria: usuario.categoria || '',
            posicion: usuario.posicion || '',
            bio: usuario.bio || ''
          });
        }
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
      }
    });
  }

  // simulación de subir foto local (podés integrarlo con un service)
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    // preview básico
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = String(reader.result);
    };
    reader.readAsDataURL(file);

    // aquí podrías enviar el file a un servicio o guardarlo en un FormData
    console.log('Archivo seleccionado:', file.name);
  }

  subirFoto() {
    // si deseas abrir un diálogo de archivo desde la lógica:
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.onFileSelected(e as any);
    input.click();
  }

  usarFotoGoogle() {
    // placeholder: integrar con la API de Google Identity / profile
    // por ahora simulamos:
    console.log('Usar foto de Google (simulado)');
    alert('Simulación: usar foto de Google');
    // si tu app tiene datos de usuario Google, podés setear photoPreview con esa URL
    // this.photoPreview = 'https://...imagen-google...';
  }

  // Volver (navegar a la página previa)
  volver() {
    this.router.navigate(['/player/player-dashboard']); // Regresar al menú del jugador
  }

  // Continuar: validamos el formulario; luego decidimos a dónde ir según tieneCanchas
  continuar() {
    this.submitting = true;
    console.log('Intentando actualizar perfil. User ID:', this.userId);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

    if (!this.userId) {
      console.error('userId es null o undefined');
      alert('Error: No se pudo identificar el usuario');
      this.submitting = false;
      return;
    }

    const payload = this.form.value;
    console.log('Datos de registro:', payload);

    // Filtrar solo los campos que el backend acepta
    const datosParaEnviar = {
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      dni: payload.dni,
      telefono: payload.telefono,
      direccion: payload.direccion,
      localidad: payload.localidad,
      provincia: payload.provincia,
      bio: payload.bio, // el backend la guarda en bio/biografia/description
    };

    console.log('Datos filtrados para enviar:', datosParaEnviar);

    // Enviar datos al backend
    this.usuarioService.editarUsuario(this.userId, datosParaEnviar).subscribe({
      next: (response) => {
        console.log('Usuario actualizado:', response);
        this.router.navigate(['/player/profile']);
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        console.error('Detalles del error:', error.error);
        if (error.error && error.error.message) {
          console.error('Mensajes de validación:', error.error.message);
        }
        alert('Error al actualizar el perfil. Por favor, intenta de nuevo.');
        this.submitting = false;
      }
    });
  }

  saltarPaso() {
    // Volver al perfil sin guardar
    this.router.navigate(['/player/profile']);
  }
}

