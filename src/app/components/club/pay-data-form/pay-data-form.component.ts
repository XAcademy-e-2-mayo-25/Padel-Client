import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { ClubService } from '../../../services/club/club.service';

type DatosPago = {
  idDatosPago: number;
  idClub: number;
  metodoPago: string;
  cbu: string | null;
  cvu: string | null;
  alias: string | null;
  dniCuitCuil: string | null;
  titular: string | null;
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  activo: boolean;
};

@Component({
  selector: 'app-pay-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pay-data-form.component.html',
  styleUrls: ['./pay-data-form.component.css'],
})
export class PayDataFormComponent implements OnInit {
  error: string | null = null;
  feedback: string | null = null;

  loading = false;
  saving = false;

  // IMPORTANTE: asumimos que ya guardás el club actual en el storageKey (como en ClubService)
  idClub: number | null = null;

  items: DatosPago[] = [];
  selected: DatosPago | null = null;

  form: FormGroup;

  constructor(private fb: FormBuilder, private clubService: ClubService, private router: Router) {
    this.form = this.fb.group(
      {
        metodoPago: ['', [Validators.required, Validators.maxLength(80)]],

        cbu: ['', [Validators.maxLength(22), this.onlyDigitsValidator()]],
        cvu: ['', [Validators.maxLength(22), this.onlyDigitsValidator()]],

        alias: ['', [Validators.maxLength(60)]],
        titular: ['', [Validators.maxLength(150)]],
        dniCuitCuil: ['', [Validators.maxLength(20), this.onlyDigitsValidator()]],

        banco: ['', [Validators.maxLength(80)]],
        tipoCuenta: ['', [Validators.maxLength(50)]],
        numeroCuenta: ['', [Validators.maxLength(30)]],

        activo: [true],
      },
      {
        validators: [this.cbuCvuExactlyOneValidator(), this.cbuCvuLenIfPresentValidator()],
      }
    );
  }

  ngOnInit(): void {
    this.idClub = this.clubService.getCurrentClubId();
    if (!this.idClub) {
      this.error = 'No se encontró el club actual. Volvé al dashboard y entrá nuevamente.';
      return;
    }
    this.loadList();
  }

  // -----------------------
  // Helpers input (seguridad)
  // -----------------------
  onDigitsOnlyInput(controlName: string, maxLen: number): void {
    const c = this.form.get(controlName);
    if (!c) return;

    const raw = String(c.value ?? '');
    const cleaned = raw.replace(/\D/g, '').slice(0, maxLen);

    if (cleaned !== raw) c.setValue(cleaned, { emitEvent: false });
    c.markAsDirty();
  }

  onTextMaxLenInput(controlName: string, maxLen: number): void {
    const c = this.form.get(controlName);
    if (!c) return;

    const raw = String(c.value ?? '');
    const trimmed = raw.slice(0, maxLen);

    if (trimmed !== raw) c.setValue(trimmed, { emitEvent: false });
    c.markAsDirty();
  }

  // -----------------------
  // Listado
  // -----------------------
  loadList(): void {
    if (!this.idClub) return;

    this.loading = true;
    this.error = null;

    this.clubService
      .listarDatosPagos(this.idClub, { page: 1, limit: 50, sortBy: 'idDatosPago', sortDir: 'DESC' } as any)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp: any) => {
          this.items = resp?.items ?? resp ?? [];
          if (!Array.isArray(this.items)) this.items = [];
        },
        error: (e) => {
          console.error(e);
          this.error = 'No pudimos cargar los métodos de cobro.';
          this.items = [];
        },
      });
  }

  selectItem(row: DatosPago): void {
    this.selected = row;
  }

  resetForm(): void {
    this.form.reset({
      metodoPago: '',
      cbu: '',
      cvu: '',
      alias: '',
      titular: '',
      dniCuitCuil: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      activo: true,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.selected = null;
    this.error = null;
    this.feedback = null;
  }

  // -----------------------
  // Crear
  // -----------------------
  submit(): void {
    if (!this.idClub) return;

    this.error = null;
    this.feedback = null;

    // fuerza mostrar validaciones
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.error = 'Revisá los campos marcados.';
      return;
    }

    const v = this.form.value;

    const payload: any = {
      idClub: this.idClub,
      metodoPago: String(v.metodoPago ?? '').trim(),

      // DTO acepta undefined -> el backend lo guarda como null
      cbu: v.cbu ? String(v.cbu) : undefined,
      cvu: v.cvu ? String(v.cvu) : undefined,

      alias: v.alias ? String(v.alias).trim() : undefined,
      titular: v.titular ? String(v.titular).trim() : undefined,
      dniCuitCuil: v.dniCuitCuil ? String(v.dniCuitCuil) : undefined,

      banco: v.banco ? String(v.banco).trim() : undefined,
      tipoCuenta: v.tipoCuenta ? String(v.tipoCuenta).trim() : undefined,
      numeroCuenta: v.numeroCuenta ? String(v.numeroCuenta).trim() : undefined,

      activo: !!v.activo,
    };

    this.saving = true;

    this.clubService
      .crearDatosPago(this.idClub, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.feedback = 'Método de cobro creado correctamente.';
          setTimeout(() => (this.feedback = null), 2500);
          this.resetForm();
          this.loadList();
        },
        error: (e) => {
          console.error(e);
          const msg = e?.error?.message;
          if (Array.isArray(msg)) this.error = msg.join(' · ');
          else if (typeof msg === 'string') this.error = msg;
          else this.error = 'No pudimos crear el método de cobro.';
        },
      });
  }

  // -----------------------
  // Validaciones
  // -----------------------
  private onlyDigitsValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = String(control.value ?? '');
      if (!v) return null;
      return /^\d+$/.test(v) ? null : { onlyDigits: true };
    };
  }

  // exactamente uno: cbu XOR cvu
  private cbuCvuExactlyOneValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const cbu = String(group.get('cbu')?.value ?? '').trim();
      const cvu = String(group.get('cvu')?.value ?? '').trim();

      const hasCbu = !!cbu;
      const hasCvu = !!cvu;

      if (!hasCbu && !hasCvu) return { cbuCvuRequired: true };
      if (hasCbu && hasCvu) return { cbuCvuBoth: true };

      return null;
    };
  }

  // si está presente, debe tener 22 dígitos
  private cbuCvuLenIfPresentValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const cbu = String(group.get('cbu')?.value ?? '').trim();
      const cvu = String(group.get('cvu')?.value ?? '').trim();

      // solo validamos longitud si tiene algo cargado
      if (cbu && cbu.length !== 22) return { cbuInvalidLen: true };
      if (cvu && cvu.length !== 22) return { cvuInvalidLen: true };

      return null;
    };
  }

  // getters para el template
  get fg() {
    return this.form;
  }

  groupHas(err: string): boolean {
    return !!this.form.errors?.[err] && (this.form.touched || this.form.dirty);
  }

  ctrlInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  goBack(): void {
    this.router.navigate(['/club-dashboard']);
  }
}
