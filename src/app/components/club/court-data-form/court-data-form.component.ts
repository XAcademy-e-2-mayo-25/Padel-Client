// court-data-form.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, switchMap, map, of } from 'rxjs';
import { ClubService, CrearClubPayload, CrearCanchaPayload } from '../../../services/club/club.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-court-data-form',
  templateUrl: './court-data-form.component.html',
  styleUrls: ['./court-data-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CourtDataFormComponent implements OnInit {
  form: FormGroup;
  horarios: string[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private clubService: ClubService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      razonSocial: [''],
      nombreFantasia: ['', Validators.required],
      cuitCuil: ['', [Validators.required, Validators.minLength(11)]],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      direccion: ['', Validators.required],
      denominacion: ['', Validators.required],
      superficie: [''],
      iluminacion: ['si', Validators.required],
      techada: ['no', Validators.required],
      diasNoAbre: [''],
      apertura: ['', Validators.required],
      cierre: ['', Validators.required],
      configurarLuego: [false]
    });

    this.generarHorarios();
  }

  ngOnInit(): void {
    this.cargarDatosClubExistente();
  }

  generarHorarios() {
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hora = i.toString().padStart(2, '0');
        const minuto = j.toString().padStart(2, '0');
        this.horarios.push(`${hora}:${minuto}`);
      }
    }
  }

  configurarDespues() {
    this.procesarFormulario(false);
  }

  continuar() {
    this.procesarFormulario(true);
  }

  volver() {
    this.router.navigate(['/update-profile']);
  }

  private procesarFormulario(crearCancha: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.verifyToken().pipe(
      switchMap(response => {
        const userId = response?.id;
        if (!userId) {
          throw new Error('No se pudo identificar el usuario.');
        }
        return this.obtenerOcrearClub(userId);
      }),
      switchMap(idClub => {
        if (!crearCancha) {
          return of(idClub);
        }
        const payload = this.armarPayloadCancha(idClub);
        return this.clubService.crearCancha(payload).pipe(map(() => idClub));
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/pay-data']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? error.message ?? 'Ocurrió un error al guardar los datos.';
      }
    });
  }

  private obtenerOcrearClub(idUsuario: number): Observable<number> {
    const storedId = this.clubService.getCurrentClubId();
    if (storedId) {
      return of(storedId);
    }

    return this.clubService.buscarClubPorUsuario(idUsuario).pipe(
      switchMap(club => {
        if (club) {
          return of(club.idClub);
        }
        const payload = this.armarPayloadClub(idUsuario);
        return this.clubService.crearClub(payload).pipe(
          map(resp => resp.club.idClub)
        );
      })
    );
  }

  private armarPayloadClub(idUsuario: number): CrearClubPayload {
    const value = this.form.value;
    return {
      idUsuario,
      razonSocial: value.razonSocial || undefined,
      nombreFantasia: value.nombreFantasia || undefined,
      cuitCuil: value.cuitCuil,
      provincia: value.provincia,
      localidad: value.localidad,
      direccion: value.direccion
    };
  }

  private armarPayloadCancha(idClub: number): CrearCanchaPayload {
    const value = this.form.value;
    return {
      idClub,
      denominacion: value.denominacion,
      cubierta: value.techada === 'si',
      observaciones: this.armarObservaciones()
    };
  }

  private armarObservaciones(): string {
    const value = this.form.value;
    const partes: string[] = [];

    if (value.superficie) {
      partes.push(`Superficie: ${value.superficie}`);
    }

    partes.push(`Iluminación: ${value.iluminacion === 'si' ? 'Si' : 'No'}`);

    if (value.diasNoAbre) {
      partes.push(`No abre: ${value.diasNoAbre}`);
    }

    if (value.apertura && value.cierre) {
      partes.push(`Horario: ${value.apertura} - ${value.cierre}`);
    }

    return partes.join(' | ');
  }

  private cargarDatosClubExistente(): void {
    this.authService.verifyToken().pipe(
      switchMap(response => {
        const userId = response?.id;
        if (!userId) {
          return of(null);
        }
        return this.clubService.buscarClubPorUsuario(userId);
      })
    ).subscribe({
      next: (club) => {
        if (club) {
          this.form.patchValue({
            razonSocial: club.razonSocial,
            nombreFantasia: club.nombreFantasia,
            cuitCuil: club.cuitCuil,
            provincia: club.provincia,
            localidad: club.localidad,
            direccion: club.direccion
          });
        }
      },
      error: (error) => {
        console.error('Error cargando datos del club:', error);
      }
    });
  }
}
