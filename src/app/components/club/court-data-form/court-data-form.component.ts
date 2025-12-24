// court-data-form.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, switchMap, map, of } from 'rxjs';
import { ClubService, CrearClubPayload } from '../../../services/club/club.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-court-data-form',
  templateUrl: './court-data-form.component.html',
  styleUrls: ['./court-data-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CourtDataFormComponent implements OnInit {
  form: FormGroup;
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
      direccion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatosClubExistente();
  }

  continuar() {
    this.procesarFormulario();
  }

  volver() {
    this.router.navigate(['/update-profile']);
  }

  private procesarFormulario(): void {
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
      map(() => true)
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
