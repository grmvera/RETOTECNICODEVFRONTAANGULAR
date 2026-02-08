import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FinancialProduct } from '../../../core/models/financial-product.model';
import { ProductsService } from '../../../core/services/products/products';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isSubmitting = false;
  isLoading = false;
  serverError = '';
  serverSuccess = '';

  mode: 'create' | 'edit' = 'create';
  private productId: string | null = null;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();

    const sub = this.form.get('date_release')!.valueChanges.subscribe(value => {
      this.updateRevisionDate(value);
    });
    this.subs.add(sub);

    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.mode = 'edit';
      this.productId = idFromRoute;
      this.form.get('id')!.disable(); 
      this.loadProductForEdit(idFromRoute);
    } else {
      this.mode = 'create';
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private buildForm(): void {
    const todayStr = this.toInputDate(new Date());

    this.form = this.fb.group(
      {
        id: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(10)
          ]
        ],
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(100)
          ]
        ],
        description: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(200)
          ]
        ],
        logo: ['', [Validators.required]],
        date_release: [todayStr, [Validators.required]],
        date_revision: ['', [Validators.required]]
      },
      {
        validators: [this.dateValidator]
      }
    );
    this.updateRevisionDate(todayStr);
  }

  private loadProductForEdit(id: string): void {
    this.isLoading = true;
    this.serverError = '';

    this.productsService.getById(id).subscribe({
      next: (product: FinancialProduct) => {
        this.form.patchValue({
          id: product.id,
          name: product.name,
          description: product.description,
          logo: product.logo,
          date_release: product.date_release,
          date_revision: product.date_revision
        });

        this.updateRevisionDate(product.date_release);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto para edición', err);
        this.serverError =
          'No se pudo cargar la información del producto. Vuelve al listado e inténtalo nuevamente.';
        this.isLoading = false;
      }
    });
  }

  private dateValidator(control: AbstractControl) {
    const relStr = control.get('date_release')?.value as string | null;
    const revStr = control.get('date_revision')?.value as string | null;

    if (!relStr || !revStr) {
      return null;
    }

    const parseDateOnly = (s: string): Date | null => {
      const parts = s.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    };

    const release = parseDateOnly(relStr);
    const revision = parseDateOnly(revStr);
    if (!release || !revision) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const errors: any = {};

    if (release < today) {
      errors.dateReleasePast = true;
    }

    const expectedRevision = new Date(
      release.getFullYear() + 1,
      release.getMonth(),
      release.getDate()
    );

    if (
      expectedRevision.getFullYear() !== revision.getFullYear() ||
      expectedRevision.getMonth() !== revision.getMonth() ||
      expectedRevision.getDate() !== revision.getDate()
    ) {
      errors.dateRevisionInvalid = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  private updateRevisionDate(dateReleaseStr: string | null): void {
    if (!dateReleaseStr) return;

    const parts = dateReleaseStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return;
    const [y, m, d] = parts;

    const release = new Date(y, m - 1, d);
    const revision = new Date(
      release.getFullYear() + 1,
      release.getMonth(),
      release.getDate()
    );

    this.form
      .get('date_revision')!
      .setValue(this.toInputDate(revision), { emitEvent: false });

    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  private toInputDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.serverError = '';
    this.serverSuccess = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'edit') {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const raw = this.form.getRawValue() as any;
    const idValue = raw.id as string;

    this.productsService.verifyId(idValue).subscribe({
      next: (exists) => {
        if (exists) {
          this.isSubmitting = false;
          this.f['id'].setErrors({ idExists: true });
          this.f['id'].markAsTouched();
          return;
        }

        const payload: FinancialProduct = {
          id: raw.id,
          name: raw.name,
          description: raw.description,
          logo: raw.logo,
          date_release: raw.date_release,
          date_revision: raw.date_revision
        };

        this.productsService.create(payload).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.serverSuccess = 'Producto creado correctamente.';
            setTimeout(() => this.router.navigate(['/products']), 800);
          },
          error: (err) => {
            console.error('Error al crear producto', err);
            this.isSubmitting = false;
            this.serverError =
              'Ocurrió un error al crear el producto. Intenta nuevamente.';
          }
        });
      },
      error: (err) => {
        console.error('Error al verificar ID', err);
        this.isSubmitting = false;
        this.serverError =
          'No se pudo verificar el ID del producto. Intenta nuevamente.';
      }
    });
  }

  private submitEdit(): void {
    if (!this.productId) {
      this.isSubmitting = false;
      this.serverError = 'Producto no válido para edición.';
      return;
    }

    const raw = this.form.getRawValue() as any;

    const payload: FinancialProduct = {
      id: this.productId,
      name: raw.name,
      description: raw.description,
      logo: raw.logo,
      date_release: raw.date_release,
      date_revision: raw.date_revision
    };

    this.productsService.update(this.productId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.serverSuccess = 'Cambios guardados correctamente.';
        setTimeout(() => this.router.navigate(['/products']), 800);
      },
      error: (err) => {
        console.error('Error al actualizar producto', err);
        this.isSubmitting = false;
        this.serverError =
          'Ocurrió un error al actualizar el producto. Intenta nuevamente.';
      }
    });
  }

  onReset(): void {
    this.serverError = '';
    this.serverSuccess = '';

    if (this.mode === 'edit' && this.productId) {
      this.loadProductForEdit(this.productId);
    } else {
      this.form.reset();
      const todayStr = this.toInputDate(new Date());
      this.form.get('date_release')!.setValue(todayStr);
      this.updateRevisionDate(todayStr);
    }
  }
}
