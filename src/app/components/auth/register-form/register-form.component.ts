import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent {
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

  constructor(private fb: FormBuilder, private router: Router) {
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
    this.router.navigate(['/login']); // o la ruta que uses para "volver"
  }

  // Continuar: validamos el formulario; luego decidimos a dónde ir según tieneCanchas
  continuar() {
    this.submitting = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

    const payload = this.form.value;
    console.log('Datos de registro:', payload);

    // Aquí normalmente enviarías payload a tu API:
    // this.authService.registerClub(payload).subscribe(...)

    // Simulamos una respuesta y redirigimos según el campo "tieneCanchas"
    const tieneCanchas = !!payload.tieneCanchas;

    // redirecciones:
    if (tieneCanchas) {
      // si tiene canchas: vamos al formulario para cargar canchas
      this.router.navigate(['/court-data']); 
    } else {
      // si no tiene canchas: mostramos la pantalla de "registro exitoso / sin canchas"
      this.router.navigate(['/register-withouts']);
    }
  }

  saltarPaso() {
    this.router.navigate(['/home']);
  }
}

