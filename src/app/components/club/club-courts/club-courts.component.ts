import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { ClubService, Cancha, CrearCanchaPayload } from '../../../services/club/club.service';

type CanchaExt = Cancha & {
  diasSemana?: number;
  horaDesde?: string;
  horaHasta?: string;
  rangoSlotMinutos?: number;
  precio?: number;
};

@Component({
  selector: 'app-club-courts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-courts.component.html',
  styleUrls: ['./club-courts.component.css']
})
export class ClubCourtsComponent implements OnInit {
  form: FormGroup;
  canchas: CanchaExt[] = [];
  selectedCancha: CanchaExt | null = null;

  loading = false;
  submitting = false;
  feedback: string | null = null;
  error: string | null = null;
  idClub: number | null = null;

  readonly dias = [
    { key: 'dom', label: 'Domingo' },
    { key: 'lun', label: 'Lunes' },
    { key: 'mar', label: 'Martes' },
    { key: 'mie', label: 'Miércoles' },
    { key: 'jue', label: 'Jueves' },
    { key: 'vie', label: 'Viernes' },
    { key: 'sab', label: 'Sábado' },
  ] as const;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService,
    private router: Router
  ) {
    this.form = this.fb.group({
      denominacion: ['', [Validators.required, Validators.maxLength(200)]],
      cubierta: [false],
      observaciones: ['', [Validators.maxLength(300)]],

      diasSemana: this.fb.group({
        dom: [true],
        lun: [true],
        mar: [true],
        mie: [true],
        jue: [true],
        vie: [true],
        sab: [true],
      }),
      horaDesde: ['', Validators.required],
      horaHasta: ['', Validators.required],
      rangoSlotMinutos: [60, Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loading = true;

    this.authService.verifyToken().pipe(
      switchMap(response => {
        const userId = response?.id;
        if (!userId) throw new Error('No se pudo identificar al usuario.');
        return this.clubService.buscarClubPorUsuario(userId);
      }),
      finalize(() => (this.loading = false))
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

    this.clubService.listarCanchas(this.idClub, { page: 1, limit: 50 }).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (resp: any) => {
        const items: CanchaExt[] = Array.isArray(resp) ? resp : (resp?.items ?? []);
        this.canchas = items;

        // Mantener selección si la cancha sigue existiendo
        if (this.selectedCancha) {
          const found = this.canchas.find(c => c.idCancha === this.selectedCancha!.idCancha);
          this.selectedCancha = found ?? null;
        }
      },
      error: () => {
        this.error = 'No pudimos obtener tus canchas.';
      }
    });
  }

  selectCancha(cancha: CanchaExt): void {
    this.selectedCancha = cancha;
  }

  clearSelection(): void {
    this.selectedCancha = null;
  }

  addCourt(): void {
    if (!this.idClub) {
      this.error = 'Necesitamos asociar tu club antes de agregar canchas.';
      return;
    }

    this.feedback = null;
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const diasMask = this.buildDiasSemanaMask(this.form.get('diasSemana')!.value);

    // validación simple: horaHasta > horaDesde
    if (v.horaDesde && v.horaHasta && v.horaHasta <= v.horaDesde) {
      this.error = 'La hora de cierre debe ser mayor que la hora de apertura.';
      return;
    }

    const payload: CrearCanchaPayload = {
      idClub: this.idClub,
      denominacion: String(v.denominacion).trim(),
      cubierta: !!v.cubierta,
      observaciones: v.observaciones ? String(v.observaciones).trim() : null,

      diasSemana: diasMask,
      horaDesde: v.horaDesde,
      horaHasta: v.horaHasta,
      rangoSlotMinutos: Number(v.rangoSlotMinutos) === 30 ? 30 : 60,
      precio: Number(v.precio),
    };

    this.submitting = true;

    this.clubService.crearCancha(payload).pipe(
      finalize(() => (this.submitting = false))
    ).subscribe({
      next: () => {
        this.feedback = 'Cancha registrada correctamente.';
        this.form.reset({
          cubierta: false,
          observaciones: '',
          diasSemana: { dom: true, lun: true, mar: true, mie: true, jue: true, vie: true, sab: true },
          horaDesde: '',
          horaHasta: '',
          rangoSlotMinutos: 60,
          precio: 0
        });

        this.loadCanchas();
      },
      error: (e) => {
        console.error(e);
        this.error = 'No pudimos registrar la cancha. Intentá nuevamente.';
      }
    });
  }

  // dom->sab: bit 0 = domingo, bit 6 = sábado
  private buildDiasSemanaMask(dias: any): number {
    const keys = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
    let mask = 0;

    keys.forEach((k, i) => {
      const checked = !!dias?.[k];
      if (checked) mask |= (1 << i);
    });

    return mask;
  }

  // Helpers para panel detalle

  formatDiasSemana(c: CanchaExt): string {
    const mask = Number(c.diasSemana ?? 0);
    if (!mask) return '-';

    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const enabled: string[] = [];

    for (let i = 0; i < 7; i++) {
      if (mask & (1 << i)) enabled.push(labels[i]);
    }

    return enabled.length ? enabled.join(', ') : '-';
  }

  formatHorario(c: CanchaExt): string {
    const desde = c.horaDesde ?? '-';
    const hasta = c.horaHasta ?? '-';
    return `${desde} - ${hasta}`;
  }

  formatRango(c: CanchaExt): string {
    const r = c.rangoSlotMinutos;
    return r ? `${r} min` : '-';
  }

  formatPrecio(c: CanchaExt): string {
    const p = c.precio;
    if (p === null || p === undefined || Number.isNaN(Number(p))) return '-';
    return `$ ${Number(p).toLocaleString('es-AR')}`;
  }

  goBack(): void {
    this.router.navigate(['/club-dashboard']);
  }
}
