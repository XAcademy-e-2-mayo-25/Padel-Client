import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Cancha, CrearCanchaPayload } from '../../../services/club/club.service';

@Component({
  selector: 'app-club-courts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-courts.component.html',
  styleUrls: ['./club-courts.component.css']
})
export class ClubCourtsComponent implements OnInit {
  form: FormGroup;
  canchas: Cancha[] = [];
  loading = false;
  submitting = false;
  feedback: string | null = null;
  error: string | null = null;
  idClub: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService
  ) {
    this.form = this.fb.group({
      denominacion: ['', Validators.required],
      cubierta: [false],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.authService.verifyToken().pipe(
      switchMap(response => {
        const userId = response?.id;
        if (!userId) {
          throw new Error('No se pudo identificar al usuario.');
        }
        return this.clubService.buscarClubPorUsuario(userId);
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (club) => {
        if (club) {
          this.idClub = club.idClub;
          this.loadCanchas();
        } else {
          this.error = 'No encontramos un club asociado a tu cuenta.';
        }
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar tu club.';
      }
    });
  }

  loadCanchas(): void {
    if (!this.idClub) return;
    this.loading = true;
    this.clubService.listarCanchas({ idClub: this.idClub, page: 1, limit: 50 }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (resp: any) => {
        if (Array.isArray(resp)) {
          this.canchas = resp;
        } else {
          this.canchas = resp?.items ?? [];
        }
      },
      error: () => {
        this.error = 'No pudimos obtener tus canchas.';
      }
    });
  }

  addCourt(): void {
    if (!this.idClub) {
      this.error = 'Necesitamos asociar tu club antes de agregar canchas.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const payload: CrearCanchaPayload = {
      idClub: this.idClub,
      denominacion: value.denominacion,
      cubierta: value.cubierta,
      observaciones: value.observaciones || null
    };

    this.submitting = true;
    this.feedback = null;
    this.error = null;

    this.clubService.crearCancha(payload).pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: () => {
        this.feedback = 'Cancha registrada correctamente.';
        this.form.reset({ cubierta: false });
        this.loadCanchas();
      },
      error: () => {
        this.error = 'No pudimos registrar la cancha. Intentá nuevamente.';
      }
    });
  }
}
