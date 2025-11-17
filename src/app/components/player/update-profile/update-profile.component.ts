import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';   //  AGREGADO

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css']
})
export class UpdateProfileComponent {
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
    private http: HttpClient, // AGREGADO
  ) {

    // ---------- FORMULARIO ----------
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required]],
      telefono: ['', Validators.required],
      direccion: [''],
      localidad: ['', Validators.required],
      provincia: ['', Validators.required],
      // foto: no lo guardamos como campo de formulario (podés agregar)
      categoria: [''],
      posicion: [''],
      // campo para decidir el flujo: ¿tenés canchas?
      tieneCanchas: [false]
    });
  }

  // ---------- SUBIR FOTO Y PREVIEW ----------
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

  // ---------- VOLVER ----------
  volver() {
    this.router.navigate(['/login']); // o la ruta que uses para "volver"
  }

  // ---------- GUARDAR PERFIL ----------
  continuar() {
    this.submitting = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

    const payload = this.form.value;
    console.log('Datos de registro:', payload);

    // Mapeamos el form a lo que espera el backend (EditarUsuarioDto)
    // *** OJO: idPosicion NO debe ir en este endpoint, lo guardaremos en otro después ***
    const body: any = {
      nombres: payload.nombre,
      apellidos: payload.apellido,
      dni: payload.dni,
      telefono: payload.telefono,
      direccion: payload.direccion,
      localidad: payload.localidad,
      provincia: payload.provincia,
      idCategoria: payload.categoria || null,   // ahora es STRING (como quiere tu backend)
      // NO se envía posicion en este endpoint
      // NO se envía tieneCanchas
    };

    console.log('Body que mando al back:', body);

    // Llamada al backend: PATCH /usuarios/me
    this.http.patch('http://localhost:3000/usuarios/me', body).subscribe({
      next: (resp) => {
        console.log('Respuesta backend:', resp);

        const tieneCanchas = !!payload.tieneCanchas;

        // redirecciones:
        if (tieneCanchas) {
          // si tiene canchas: vamos al formulario para cargar canchas
          this.router.navigate(['/court-data']);
        } else {
          // si no tiene canchas: mostramos la pantalla de "registro exitoso / sin canchas"
          this.router.navigate(['/register-withouts']);
        }
      },
      error: (err) => {
        console.error('Error actualizando perfil:', err);
        if (err.error) console.error('Error body Nest:', err.error);
        alert('Hubo un error actualizando tu perfil');
        this.submitting = false;
      }
    });
  }

  // ---------- SALTAR PASO ----------
  saltarPaso() {
    this.router.navigate(['/home']);
  }

  // ---------- HELPERS (por ahora sin uso para el backend) ----------

  private mapCategoria(cat: string): number | null {
    // Ajustá esto a los ids reales de tu tabla Categoria
    switch (cat) {
      case '8va': return 8;
      case '7ma': return 7;
      case '6ta': return 6;
      case '5ta': return 5;
      case '4ta': return 4;
      case '3ra': return 3;
      case '2da': return 2;
      case '1ra': return 1;
      default: return null;
    }
  }

  private mapPosicion(pos: string): number | null {
    // Según tus constantes en backend:
    // const POS_NO_DEFINIDO = 1;
    // const POS_DRIVE = 2;
    // const POS_REVES = 3;
    switch (pos) {
      case 'Drive': return 2;
      case 'Revés': return 3;
      case 'No definido': return 1;
      default: return null;
    }
  }
}
