import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../services/usuario/usuario.service';
import { AuthService } from '../../../services/auth/auth.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css']
})
export class UpdateProfileComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  photoPreview: string | null = null;
  userId: number | null = null;
  displayName: string = 'Usuario';

  // para marcar si viene desde /player/profile => ?mode=edit
  isEditMode = false;

  provincias = [
    'Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes',
    'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta',
    'San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ];

  categorias = ['OCTAVA','SEPTIMA','SEXTA','QUINTA', 'CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA'];

  posiciones = ['NO DEFINIDO','DRIVE','REVES','AMBAS'];

  // mapeo de categorias por idCategoria
  private readonly categoriaToId: Record<string, number> = {
    PRIMERA: 1,
    SEGUNDA: 2,
    TERCERA: 3,
    CUARTA: 4,
    QUINTA: 5,
    SEXTA: 6,
    SEPTIMA: 7,
    OCTAVA: 8,
  };

  private readonly idToCategoria: Record<number, string> = {
    1: 'PRIMERA',
    2: 'SEGUNDA',
    3: 'TERCERA',
    4: 'CUARTA',
    5: 'QUINTA',
    6: 'SEXTA',
    7: 'SEPTIMA',
    8: 'OCTAVA',
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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
      categoria: [''], //todo string despues convertimos a int
      posicion: [''],
      tieneCanchas: [false]
    });
  }

  ngOnInit() {
    this.isEditMode = this.route.snapshot.queryParamMap.get('mode') === 'edit';

    console.log('Verificando token...');
    this.authService.verifyToken().subscribe({
      next: (response) => {
        console.log('Respuesta de verify:', response);

        if (response?.valid && response.id) {
          this.userId = Number(response.id);
          console.log('User ID obtenido:', this.userId);
          this.cargarDatosUsuario(this.userId);
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
        if (!usuario) return;

        this.displayName = usuario.nombres || this.displayName;

        // categoria: viene como idCategoria (number | null)
        const categoriaNombre =
          usuario.idCategoria ? (this.idToCategoria[Number(usuario.idCategoria)] ?? '') : '';

        // posiciones: viene como array { idPosicion, posicion: { nombre } }
        const idsPos = (usuario.posiciones ?? [])
          .map((p: any) => Number(p?.idPosicion))
          .filter((n: number) => Number.isFinite(n));

        let posicionNombre = '';
        if (idsPos.includes(2) && idsPos.includes(3)) posicionNombre = 'AMBAS';
        else if (idsPos.includes(2)) posicionNombre = 'DRIVE';
        else if (idsPos.includes(3)) posicionNombre = 'REVES';
        else if (idsPos.includes(1)) posicionNombre = 'NO DEFINIDO';

        this.form.patchValue({
          nombres: usuario.nombres || '',
          apellidos: usuario.apellidos || '',
          dni: usuario.dni || '',
          telefono: usuario.telefono || '',
          direccion: usuario.direccion || '',
          localidad: usuario.localidad || '',
          provincia: usuario.provincia || '',
          categoria: categoriaNombre,
          posicion: posicionNombre
        });
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
      }
    });
  }

  // Foto
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = String(reader.result);
    };
    reader.readAsDataURL(file);

    console.log('Archivo seleccionado:', file.name);
  }

  subirFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.onFileSelected(e as any);
    input.click();
  }

  usarFotoGoogle() {
    console.log('Usar foto de Google (simulado)');
    alert('Simulación: usar foto de Google');
  }

  private mapCategoriaToId(nombre: string): number | null {
    const clean = (nombre || '').toUpperCase().trim();
    return this.categoriaToId[clean] ?? null;
  }

  private mapPosicionToIds(nombre: string): number[] | null {
    const clean = (nombre || '').toUpperCase().trim();
    switch (clean) {
      case 'AMBAS': return [2, 3];
      case 'DRIVE': return [2];
      case 'REVES': return [3];
      case 'NO DEFINIDO': return [1];
      default: return null; // no envía nada si está vacío
    }
  }

  continuar() {
    this.submitting = true;
    console.log('Intentando actualizar perfil. User ID:', this.userId);
    console.log('form.valid=', this.form.valid);

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

    const idCategoria = this.mapCategoriaToId(payload.categoria);
    const idsPosiciones = this.mapPosicionToIds(payload.posicion);

    // PATCH: datos de usuario
    const datosParaEnviar: any = {
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      dni: payload.dni,
      telefono: payload.telefono,
      direccion: payload.direccion,
      localidad: payload.localidad,
      provincia: payload.provincia,
      ...(idCategoria ? { idCategoria } : {}) // solo si eligió una categoría válida
    };

    console.log('Datos filtrados para enviar (PATCH):', datosParaEnviar);

    this.usuarioService.editarUsuario(this.userId, datosParaEnviar).pipe(
      switchMap(() => {
        if (!idsPosiciones) return of(null);

        const body = { posiciones: idsPosiciones };

        console.log('Actualizando posiciones (PUT):', body);
        return this.usuarioService.actualizarPosiciones(this.userId!, body);
      })
    ).subscribe({
      next: (respPos) => {
        if (respPos) console.log('Posiciones actualizadas:', respPos);

        // redirecciones
        if (this.isEditMode) {
          this.router.navigate(['/player/profile']);
        } else {
          this.router.navigate(['/player/player-dashboard']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error actualizando usuario/posiciones:', error);
        console.error('Detalles del error:', error.error);
        alert('Error al actualizar el perfil. Por favor, intenta de nuevo.');
        this.submitting = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/player/profile']);
  }

  saltarPaso() {
    this.router.navigate(['/player/player-dashboard']);
  }
}
