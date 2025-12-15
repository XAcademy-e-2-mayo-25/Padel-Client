import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { switchMap, map, of } from 'rxjs';
import { ClubService, CrearDatosPagoPayload } from '../../../services/club/club.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-pay-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pay-data-form.component.html'
})

export class PayDataFormComponent {
  form: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clubService: ClubService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      metodoPago: ['', Validators.required],
      cbu: ['', [Validators.maxLength(22)]],
      cvu: ['', [Validators.maxLength(22)]],
      alias: ['', [Validators.maxLength(60)]],
      dniCuitCuil: ['', [Validators.maxLength(20)]],
      titular: ['', [Validators.maxLength(150)]],
      banco: ['', [Validators.maxLength(80)]],
      tipoCuenta: ['', [Validators.maxLength(50)]],
      numeroCuenta: ['', [Validators.maxLength(30)]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.obtenerClubId().pipe(
      switchMap(idClub => {
        const payload = this.armarPayloadPago(idClub);
        return this.clubService.crearDatosPago(payload);
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/player/player-dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? error.message ?? 'No pudimos guardar los datos de pago.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/court-data']);
  }

  private obtenerClubId() {
    const stored = this.clubService.getCurrentClubId();
    if (stored) {
      return of(stored);
    }

    return this.authService.verifyToken().pipe(
      switchMap(response => {
        const userId = response?.id;
        if (!userId) {
          throw new Error('No pudimos identificar al usuario.');
        }
        return this.clubService.buscarClubPorUsuario(userId);
      }),
      map(club => {
        if (!club) {
          throw new Error('No encontramos un club asociado a tu cuenta.');
        }
        return club.idClub;
      })
    );
  }

  private armarPayloadPago(idClub: number): CrearDatosPagoPayload {
    const value = this.form.value;
    return {
      idClub,
      metodoPago: value.metodoPago,
      cbu: value.cbu || undefined,
      cvu: value.cvu || undefined,
      alias: value.alias || undefined,
      dniCuitCuil: value.dniCuitCuil || undefined,
      titular: value.titular || undefined,
      banco: value.banco || undefined,
      tipoCuenta: value.tipoCuenta || undefined,
      numeroCuenta: value.numeroCuenta || undefined,
      activo: true
    };
  }
}
