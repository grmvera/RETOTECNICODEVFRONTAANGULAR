import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinancialProduct } from '../../../core/models/financial-product.model';
import { ProductsService } from '../../../core/services/products/products';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css'
})
export class ProductsListComponent implements OnInit {
  products: FinancialProduct[] = [];
  filteredProducts: FinancialProduct[] = [];
  paginatedProducts: FinancialProduct[] = [];

  searchTerm = '';
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];
  totalResults = 0;

  currentPage = 1;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  menuOpenId: string | null = null;

  deleteCandidate: FinancialProduct | null = null;
  isDeleting = false;
  deleteError = '';

  constructor(private productsService: ProductsService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productsService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'Ocurrió un error al cargar los productos. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.currentPage = 1;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredProducts = this.products.filter((p) => {
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    });

    this.totalResults = this.filteredProducts.length;

    this.totalPages = Math.max(1, Math.ceil(this.totalResults / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilter();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilter();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilter();
    }
  }


  toggleMenu(id: string): void {
    this.menuOpenId = this.menuOpenId === id ? null : id;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.menuOpenId = null;
  }

  openDeleteModal(product: FinancialProduct, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.menuOpenId = null;
    this.deleteCandidate = product;
    this.deleteError = '';
  }

  cancelDelete(): void {
    if (this.isDeleting) return;
    this.deleteCandidate = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.deleteCandidate || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.deleteError = '';

    const id = this.deleteCandidate.id;

    this.productsService.delete(id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteCandidate = null;

        // quitamos el producto eliminado y recalculamos
        this.products = this.products.filter((p) => p.id !== id);
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error al eliminar producto', err);
        this.isDeleting = false;
        this.deleteError =
          'Ocurrió un error al eliminar el producto. Intenta nuevamente.';
      }
    });
  }
}
