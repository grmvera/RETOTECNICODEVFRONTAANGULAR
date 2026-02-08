import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ProductsListComponent } from './products-list';
import { FinancialProduct } from '../../../core/models/financial-product.model';
import { ProductsService } from '../../../core/services/products/products';

describe('ProductsListComponent', () => {
  let component: ProductsListComponent;
  let fixture: ComponentFixture<ProductsListComponent>;
  let productsSvcSpy: jasmine.SpyObj<ProductsService>;

  const mockProducts: FinancialProduct[] = [
    {
      id: 'trj-1',
      name: 'Visa',
      description: 'desc visa',
      logo: 'https://tse4.mm.bing.net/th/id/OIP.7Jm7aT2jIdHH2VAAjaackgHaE3?rs=1&pid=ImgDetMain&o=7&rm=3',
      date_release: '2025-11-23',
      date_revision: '2026-11-23'
    },
    {
      id: 'trj-2',
      name: 'MasterCard',
      description: 'desc mc',
      logo: 'https://tse4.mm.bing.net/th/id/OIP.7Jm7aT2jIdHH2VAAjaackgHaE3?rs=1&pid=ImgDetMain&o=7&rm=3',
      date_release: '2025-11-23',
      date_revision: '2026-11-23'
    }
  ];

  beforeEach(async () => {
    productsSvcSpy = jasmine.createSpyObj('ProductsService', ['getAll', 'delete']);
    productsSvcSpy.getAll.and.returnValue(of(mockProducts));
    productsSvcSpy.delete.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [ProductsListComponent, RouterTestingModule],
      providers: [{ provide: ProductsService, useValue: productsSvcSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar los productos al inicializar', () => {
    expect(component.products.length).toBe(2);
    expect(component.totalResults).toBe(2);
    expect(component.paginatedProducts.length).toBeGreaterThan(0);
  });

  it('debe filtrar por término de búsqueda', () => {
    component.onSearchChange('visa');
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name.toLowerCase()).toContain('visa');
  });

  it('debe filtrar cuando el término está vacío', () => {
    component.onSearchChange('');
    expect(component.filteredProducts.length).toBe(2);
    expect(component.totalResults).toBe(2);
  });

  it('debe cambiar el tamaño de página y recalcular paginación', () => {
    component.onPageSizeChange(1);
    expect(component.pageSize).toBe(1);
    expect(component.currentPage).toBe(1);
    expect(component.paginatedProducts.length).toBe(1);
  });

  it('debe ir a una página válida', () => {
    component.onPageSizeChange(1);
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
  });

  it('no debe ir a una página inválida', () => {
    component.onPageSizeChange(1);
    const current = component.currentPage;
    component.goToPage(0); 
    expect(component.currentPage).toBe(current);
  });

  it('debe retroceder una página cuando es posible', () => {
    component.onPageSizeChange(1);
    component.goToPage(2);
    component.prevPage();
    expect(component.currentPage).toBe(1);
  });

  it('no debe retroceder cuando está en la primera página', () => {
    component.onPageSizeChange(1);
    component.prevPage();
    expect(component.currentPage).toBe(1);
  });

  it('debe avanzar de página cuando es posible', () => {
    component.onPageSizeChange(1);
    component.nextPage();
    expect(component.currentPage).toBe(2);
  });

  it('no debe avanzar cuando está en la última página', () => {
    component.onPageSizeChange(1);
    component.goToPage(component.totalPages);
    const last = component.totalPages;
    component.nextPage();
    expect(component.currentPage).toBe(last);
  });

  it('debe abrir y cerrar el menú de 3 puntos', () => {
    component.toggleMenu('trj-1');
    expect(component.menuOpenId).toBe('trj-1');

    component.toggleMenu('trj-1');
    expect(component.menuOpenId).toBeNull();
  });

  it('debe cerrar los menús con HostListener', () => {
    component.toggleMenu('trj-1');
    component.closeMenus();
    expect(component.menuOpenId).toBeNull();
  });

  it('debe abrir el modal de eliminación y detener la propagación del evento', () => {
    const product = mockProducts[0];
    const stopPropagation = jasmine.createSpy('stopPropagation');
    const fakeEvent = { stopPropagation } as unknown as MouseEvent;

    component.openDeleteModal(product, fakeEvent);

    expect(component.deleteCandidate).toEqual(product);
    expect(component.deleteError).toBe('');
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('debe abrir el modal de eliminación sin evento', () => {
    const product = mockProducts[0];

    component.openDeleteModal(product);

    expect(component.deleteCandidate).toEqual(product);
    expect(component.deleteError).toBe('');
  });

  it('no debe cancelar eliminación si está eliminando', () => {
    component.openDeleteModal(mockProducts[0]);
    component.isDeleting = true;

    component.cancelDelete();

    expect(component.deleteCandidate).not.toBeNull();
  });

  it('debe cancelar eliminación cuando no está eliminando', () => {
    component.openDeleteModal(mockProducts[0]);
    component.isDeleting = false;

    component.cancelDelete();

    expect(component.deleteCandidate).toBeNull();
    expect(component.deleteError).toBe('');
  });

  it('no debe eliminar si no hay candidato o ya está eliminando', () => {
    component.deleteCandidate = null;
    component.isDeleting = false;
    component.confirmDelete();
    expect(productsSvcSpy.delete).not.toHaveBeenCalled();

    component.openDeleteModal(mockProducts[0]);
    component.isDeleting = true;
    component.confirmDelete();
    expect(productsSvcSpy.delete).not.toHaveBeenCalled();
  });

  it('debe eliminar un producto', () => {
    component.openDeleteModal(mockProducts[0]);
    component.isDeleting = false;

    component.confirmDelete();

    expect(productsSvcSpy.delete).toHaveBeenCalledWith('trj-1');
  });

  it('debe manejar error al eliminar un producto', () => {
    productsSvcSpy.delete.and.returnValue(
      throwError(() => new Error('error al eliminar'))
    );

    component.openDeleteModal(mockProducts[0]);
    component.isDeleting = false;

    component.confirmDelete();

    expect(component.isDeleting).toBeFalse();
    expect(component.deleteError).toContain('Ocurrió un error al eliminar el producto');
  });

  it('debe manejar error al cargar productos', () => {
    productsSvcSpy.getAll.and.returnValue(
      throwError(() => new Error('Error de carga'))
    );

    const errorFixture = TestBed.createComponent(ProductsListComponent);
    const errorComponent = errorFixture.componentInstance;
    errorFixture.detectChanges();

    expect(errorComponent.errorMessage).toContain(
      'Ocurrió un error al cargar los productos'
    );
    expect(errorComponent.isLoading).toBeFalse();
  });
});
