import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Cancha, Turno, Slot } from '../../../services/club/club.service';

@Component({
  selector: 'app-club-prices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-prices.component.html',
  styleUrls: ['./club-prices.component.css']
})
export class ClubPricesComponent implements OnInit {
  form: FormGroup;
  canchas: Cancha[] = [];
  turnos: Turno[] = [];
  slots: Slot[] = [];
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
      idCancha: ['', Validators.required],
      idTurno: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      disponible: [true]
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
          this.loadData();
        } else {
          this.error = 'No encontramos un club asociado a tu cuenta.';
        }
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar tu club.';
      }
    });
  }

  loadData(): void {
    if (!this.idClub) return;
    this.loadCanchas();
    this.loadTurnos();
    this.loadSlots();
  }

  loadCanchas(): void {
    this.clubService.listarCanchas(this.idClub!, { page: 1, limit: 100 }).subscribe({
      next: (resp: any) => {
        this.canchas = Array.isArray(resp) ? resp : resp.items ?? [];
      },
      error: () => {
        this.error = 'No pudimos obtener tus canchas.';
      }
    });
  }

  loadTurnos(): void {
    this.clubService.listarTurnos({ idClub: this.idClub!, page: 1, limit: 100 }).subscribe({
      next: (resp) => {
        this.turnos = resp.items ?? [];
      },
      error: () => {
        this.error = 'No pudimos obtener tus horarios.';
      }
    });
  }

  loadSlots(): void {
    this.clubService.listarSlots({ idClub: this.idClub!, page: 1, limit: 100 }).subscribe({
      next: (resp) => {
        this.slots = resp.items ?? [];
      },
      error: () => {
        // Si falla, lo dejamos silencioso por ahora
      }
    });
  }

  addSlot(): void {
    if (!this.idClub) {
      this.error = 'No encontramos tu club para asociar el slot.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.submitting = true;
    this.feedback = null;
    this.error = null;

    this.clubService.crearSlot({
      idClub: this.idClub,
      idCancha: Number(value.idCancha),
      idTurno: Number(value.idTurno),
      precio: Number(value.precio),
      disponible: value.disponible
    }).pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: () => {
        this.feedback = 'Slot creado correctamente.';
        this.form.reset({ disponible: true });
        this.loadSlots();
      },
      error: (err) => {
        console.error('Error al crear slot', err);
        this.error = err?.error?.message || 'No pudimos crear el slot.';
      }
    });
  }

  getTurnoLabel(turno: Turno): string {
    if (turno.fecha) {
      return `${turno.fecha} ${turno.horaDesde} - ${turno.horaHasta}`;
    }
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const dia = turno.diaSemana !== null && turno.diaSemana !== undefined ? dias[Number(turno.diaSemana)] : 'Día sin asignar';
    return `${dia} ${turno.horaDesde} - ${turno.horaHasta}`;
  }
}
