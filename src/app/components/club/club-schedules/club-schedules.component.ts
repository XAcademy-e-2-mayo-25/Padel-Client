import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Turno } from '../../../services/club/club.service';

@Component({
  selector: 'app-club-schedules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-schedules.component.html',
  styleUrls: ['./club-schedules.component.css']
})
export class ClubSchedulesComponent implements OnInit {
  form: FormGroup;
  horarios: Turno[] = [];
  loading = false;
  submitting = false;
  feedback: string | null = null;
  error: string | null = null;
  idClub: number | null = null;
  dias = [
    { label: 'Domingo', value: 0 },
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService
  ) {
    this.form = this.fb.group({
      fecha: [''],
      diaSemana: [''],
      horaDesde: ['', Validators.required],
      horaHasta: ['', Validators.required]
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
          this.loadHorarios();
        } else {
          this.error = 'No encontramos un club asociado a tu cuenta.';
        }
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar tu club.';
      }
    });
  }

  loadHorarios(): void {
    if (!this.idClub) return;
    this.loading = true;
    this.clubService.listarTurnos({
      idClub: this.idClub,
      page: 1,
      limit: 50,
      sortBy: 'horaDesde',
      sortDir: 'ASC'
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (resp) => {
        this.horarios = resp.items ?? [];
        this.error = null;
      },
      error: (err) => {
        console.error('Error al listar turnos', err);
        this.error = err?.error?.message || 'No pudimos obtener los horarios actuales.';
      }
    });
  }

  addSchedule(): void {
    if (!this.idClub) {
      this.error = 'No encontramos tu club para asociar el horario.';
      return;
    }

    if (!this.form.value.fecha && !this.form.value.diaSemana) {
      this.error = 'Completá una fecha o un día de la semana.';
      return;
    }

    if (!this.form.value.horaDesde || !this.form.value.horaHasta) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.submitting = true;
    this.feedback = null;
    this.error = null;

    const payload = {
      idClub: this.idClub,
      fecha: value.fecha || undefined,
      diaSemana: value.diaSemana ? String(value.diaSemana) : undefined,
      horaDesde: value.horaDesde,
      horaHasta: value.horaHasta
    };

    this.clubService.crearTurno(payload).pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: () => {
        this.feedback = 'Horario guardado correctamente.';
        this.form.reset();
        this.loadHorarios();
      },
      error: (err) => {
        console.error('Error al crear turno', err);
        this.error = err?.error?.message || 'No pudimos guardar el horario.';
      }
    });
  }

  getDiaLabel(turno: Turno): string {
    const diaValue = turno.diaSemana !== null && turno.diaSemana !== undefined ? Number(turno.diaSemana) : null;
    const found = this.dias.find(d => d.value === diaValue);
    return found ? found.label : 'Sin día';
  }
}
