import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FinancialProduct } from '../../models/financial-product.model';
import { ProductsService } from './products';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:3002/bp/products';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductsService]
    });

    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener todos los productos', () => {
    const mockProducts: FinancialProduct[] = [
      {
        id: 'trj-1',
        name: 'P1',
        description: 'desc',
        logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png',
        date_release: '2025-11-23',
        date_revision: '2026-11-23'
      }
    ];

    service.getAll().subscribe(products => {
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('trj-1');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');

    req.flush({ data: mockProducts });
  });

  it('debe devolver arreglo vacío cuando la respuesta no tiene data', () => {
    service.getAll().subscribe(products => {
      expect(products.length).toBe(0);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');

    req.flush({});
  });

  it('debe manejar error al obtener productos', () => {
    const status = 500;

    service.getAll().subscribe({
      next: () => fail('La petición debería fallar'),
      error: (err) => {
        expect(err.status).toBe(status);
      }
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');

    req.flush('Error interno', {
      status,
      statusText: 'Server Error'
    });
  });

  it('debe verificar si un id existe', () => {
    const id = 'trj-1';

    service.verifyId(id).subscribe(exists => {
      expect(exists).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseUrl}/verification/${id}`);
    expect(req.request.method).toBe('GET');

    req.flush(true);
  });

  it('debe obtener un producto por id', () => {
    const id = 'trj-1';
    const mockProduct: FinancialProduct = {
      id,
      name: 'Producto 1',
      description: 'Desc 1',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png',
      date_release: '2025-11-23',
      date_revision: '2026-11-23'
    };

    service.getById(id).subscribe(product => {
      expect(product).toEqual(mockProduct);
    });

    const req = httpMock.expectOne(`${baseUrl}/${id}`);
    expect(req.request.method).toBe('GET');

    req.flush(mockProduct);
  });

  it('debe crear un producto', () => {
    const payload: FinancialProduct = {
      id: 'trj-2',
      name: 'Tarjeta Visa Platinum',
      description: 'Tarjeta de crédito con beneficios exclusivos',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png',
      date_release: '2025-11-23',
      date_revision: '2026-11-23'
    };

    service.create(payload).subscribe(resp => {
      expect(resp.id).toBe(payload.id);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(payload);
  });

  it('debe actualizar un producto', () => {
    const id = 'trj-visa';
    const expectedName = 'Nombre actualizado';
    const payload: Partial<FinancialProduct> = {
      name: expectedName,
      description: 'Desc act',
      logo: 'https://assets.gtc.com.gt/uploads/abde9f4c-95e0-4814-9b96-c020c2a58c3c/original/visa-signature-rewards.png',
      date_release: '2025-11-23',
      date_revision: '2026-11-23'
    };

    service.update(id, payload).subscribe(resp => {
      expect(resp.name).toBe(expectedName);
    });

    const req = httpMock.expectOne(`${baseUrl}/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({ id, ...(payload as any) });
  });

  it('debe eliminar un producto', () => {
    const id = 'trj-visa';

    service.delete(id).subscribe(resp => {
      expect(resp).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/${id}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });
});
