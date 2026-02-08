import { Routes } from '@angular/router';
import { ProductsListComponent } from './pages/products/products-list/products-list';
import { ProductFormComponent } from './pages/products/product-form/product-form';

export const routes: Routes = [
  {
    path: 'products',
    component: ProductsListComponent
  },
  {
    path: 'products/new',
    component: ProductFormComponent
  },
  {
    path: 'products/:id/edit',
    component: ProductFormComponent
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
