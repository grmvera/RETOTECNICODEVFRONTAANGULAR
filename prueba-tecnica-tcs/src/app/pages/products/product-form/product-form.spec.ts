import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ProductsService } from '../../../core/services/products/products';
import { ProductFormComponent } from './product-form';
import { FinancialProduct } from '../../../core/models/financial-product.model';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productsSvcSpy: jasmine.SpyObj<ProductsService>;
  let mockProduct: FinancialProduct;

  beforeEach(async () => {
    mockProduct = {
      id: 'trj-1',
      name: 'Tarjeta Visa',
      description: 'Tarjeta de crédito con beneficios',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png',
      date_release: '2030-11-23',
      date_revision: '2031-11-23'
    };

    productsSvcSpy = jasmine.createSpyObj('ProductsService', [
      'verifyId',
      'create',
      'update',
      'getById'
    ]);

    productsSvcSpy.verifyId.and.returnValue(of(false));
    productsSvcSpy.create.and.returnValue(of(mockProduct));
    productsSvcSpy.update.and.returnValue(of(mockProduct));
    productsSvcSpy.getById.and.returnValue(of(mockProduct));

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, RouterTestingModule],
      providers: [{ provide: ProductsService, useValue: productsSvcSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe marcar error si la fecha de liberación es pasada', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    component.form.patchValue({
      date_release: yesterday.toISOString().split('T')[0]
    });

    fixture.detectChanges();

    expect(component.form.errors?.['dateReleasePast']).toBeTrue();
  });

  it('debe marcar error si la fecha de revisión no es un año después', () => {
    component.form.patchValue({
      date_release: '2030-11-23',
      date_revision: '2032-11-23'
    });

    fixture.detectChanges();

    expect(component.form.errors?.['dateRevisionInvalid']).toBeTrue();
  });

  it('no debe tener errores de fechas cuando son válidas', () => {
    component.form.patchValue({
      date_release: '2030-11-23',
      date_revision: '2031-11-23'
    });

    fixture.detectChanges();

    expect(component.form.errors).toBeNull();
  });

  it('no debe crear producto si el formulario es inválido', () => {
    component.form.patchValue({
      id: '',
      name: '',
      description: '',
      logo: ''
    });

    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    expect(productsSvcSpy.verifyId).not.toHaveBeenCalled();
    expect(productsSvcSpy.create).not.toHaveBeenCalled();
  });

  it('debe marcar error idExists cuando el id ya existe', () => {
    productsSvcSpy.verifyId.and.returnValue(of(true));

    component.form.patchValue({
      id: 'trj-1',
      name: 'Tarjeta',
      description: 'Descripcion producto',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    component.onSubmit();

    const idControl = component.form.get('id');
    expect(idControl?.errors?.['idExists']).toBeTrue();
    expect(productsSvcSpy.create).not.toHaveBeenCalled();
  });

  it('debe mostrar error cuando falla la verificación de ID', () => {
    productsSvcSpy.verifyId.and.returnValue(
      throwError(() => new Error('fallo verificación'))
    );

    component.form.patchValue({
      id: 'trj-1',
      name: 'Tarjeta',
      description: 'Descripcion producto',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    component.onSubmit();

    expect(component.serverError).toContain('No se pudo verificar el ID');
    expect((component as any).isSubmitting).toBeFalse();
  });

  it('debe mostrar error cuando falla la creación del producto', () => {
    productsSvcSpy.create.and.returnValue(
      throwError(() => new Error('fallo creación'))
    );

    component.form.patchValue({
      id: 'trj-1',
      name: 'Tarjeta',
      description: 'Descripcion producto',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    component.onSubmit();

    expect(component.serverError).toContain('Ocurrió un error al crear el producto');
    expect((component as any).isSubmitting).toBeFalse();
  });

  it('debe intentar crear el producto cuando el formulario es válido', () => {
    component.form.patchValue({
      id: 'trj-1',
      name: 'Tarjeta',
      description: 'Descripcion producto',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    component.onSubmit();

    expect(productsSvcSpy.verifyId).toHaveBeenCalledWith('trj-1');
    expect(productsSvcSpy.create).toHaveBeenCalled();
  });

  it('debe mostrar error cuando se intenta editar sin productId', () => {
    (component as any).mode = 'edit';
    (component as any).productId = null;
    (component as any).isSubmitting = true;

    (component as any).submitEdit();

    expect(component.serverError).toContain('Producto no válido para edición');
    expect((component as any).isSubmitting).toBeFalse();
  });

  it('debe actualizar el producto cuando está en modo edición', () => {
    (component as any).mode = 'edit';
    (component as any).productId = 'trj-1';

    component.form.patchValue({
      name: 'Tarjeta editada',
      description: 'Descripcion editada',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    (component as any).submitEdit();

    expect(productsSvcSpy.update).toHaveBeenCalled();
    const [idArg] = productsSvcSpy.update.calls.mostRecent().args;
    expect(idArg).toBe('trj-1');
  });

  it('debe mostrar error cuando falla la actualización del producto', () => {
    productsSvcSpy.update.and.returnValue(
      throwError(() => new Error('fallo actualización'))
    );

    (component as any).mode = 'edit';
    (component as any).productId = 'trj-1';

    component.form.patchValue({
      name: 'Tarjeta editada',
      description: 'Descripcion editada',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png'
    });

    (component as any).submitEdit();

    expect(component.serverError).toContain(
      'Ocurrió un error al actualizar el producto'
    );
    expect((component as any).isSubmitting).toBeFalse();
  });

  it('debe recargar el producto al hacer reset en modo edición', () => {
    const loadSpy = spyOn<any>(component as any, 'loadProductForEdit');

    (component as any).mode = 'edit';
    (component as any).productId = 'trj-1';

    component.onReset();

    expect(loadSpy).toHaveBeenCalledWith('trj-1');
  });

  it('debe limpiar el formulario al hacer reset en modo creación', () => {
    (component as any).mode = 'create';
    (component as any).productId = null;

    component.form.patchValue({
      id: 'trj-1',
      name: 'Tarjeta',
      description: 'Descripcion',
      logo: 'https://tse4.mm.bing.net/th/id/OIP.7Jm7aT2jIdHH2VAAjaackgHaE3?rs=1&pid=ImgDetMain&o=7&rm=3'
    });

    component.onReset();

    expect(component.form.get('id')!.value).toBeNull();
    expect(component.serverError).toBe('');
    expect(component.serverSuccess).toBe('');
  });

  it('debe cargar el producto para edición y manejar error', () => {
    (component as any).loadProductForEdit('trj-1');
    expect(productsSvcSpy.getById).toHaveBeenCalledWith('trj-1');

    productsSvcSpy.getById.and.returnValue(
      throwError(() => new Error('error carga'))
    );
    (component as any).loadProductForEdit('trj-1');

    expect(component.serverError).toContain(
      'No se pudo cargar la información del producto'
    );
    expect((component as any).isLoading).toBeFalse();
  });
});
