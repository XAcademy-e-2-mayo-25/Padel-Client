import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, switchMap, map, of, catchError, tap } from 'rxjs';
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
    this.router.navigate(['/player/player-dashboard']);
  }

  private procesarFormulario(): void {
    console.log('[CourtDataForm] submit, form.valid=', this.form.valid, 'value=', this.form.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.getVerifiedUserId().pipe(
      tap(idUsuario => console.log('[CourtDataForm] idUsuario=', idUsuario)),
      switchMap(idUsuario => this.obtenerOcrearClub(idUsuario)),
      tap(idClub => console.log('[CourtDataForm] Club listo. idClub=', idClub)),
      map(() => true)
    ).subscribe({
      next: () => {
        this.loading = false;
        alert('Su solicitud será procesada por un administrador, le notificaremos cuando sea resuelta.');
        this.router.navigate(['/player/player-dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? error.message ?? 'Ocurrió un error al guardar los datos.';
      }
    });
  }

  /*
   - Si hay current_club_id en localStorage, lo validamos contra backend.
   - Si no existe, lo borramos y seguimos.
   - Luego buscamos por idUsuario. Si no hay, creamos.
   */
  private obtenerOcrearClub(idUsuario: number): Observable<number> {
    return this.clubService.buscarClubPorUsuario(idUsuario).pipe(
      switchMap(club => {
        if (club) return of(club.idClub);

        const payload = this.armarPayloadClub(idUsuario);
        return this.clubService.crearClub(payload).pipe(
          map(resp => resp.club.idClub)
        );
      })
    );
  }

  private obtenerOcrearClubSinCache(idUsuario: number): Observable<number> {
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
    this.authService.getVerifiedUserId().pipe(
      switchMap(userId => this.clubService.buscarClubPorUsuario(userId)),
      catchError(() => of(null))
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
