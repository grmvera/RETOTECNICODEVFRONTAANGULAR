import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError, Observable } from 'rxjs';
import { FinancialProduct } from '../../models/financial-product.model';

interface ProductsResponse {
  data: FinancialProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly baseUrl = 'http://localhost:3002/bp/products';

  constructor(private http: HttpClient) { }

  getAll(): Observable<FinancialProduct[]> {
    return this.http.get<ProductsResponse>(this.baseUrl).pipe(
      map(res => res?.data ?? []),
      catchError(err => {
        console.error('Error al obtener productos', err);
        return throwError(() => err);
      })
    );
  }

  verifyId(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/verification/${id}`);
  }

  getById(id: string): Observable<FinancialProduct> {
    return this.http.get<FinancialProduct>(`${this.baseUrl}/${id}`);
  }

  create(product: FinancialProduct): Observable<FinancialProduct> {
    return this.http.post<FinancialProduct>(this.baseUrl, product);
  }

  update(id: string, product: Partial<FinancialProduct>): Observable<FinancialProduct> {
    return this.http.put<FinancialProduct>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
