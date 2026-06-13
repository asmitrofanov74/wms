import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./features/warehouses/warehouses.component').then(
            (m) => m.WarehousesComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'receiving',
        loadComponent: () =>
          import('./features/receiving/receiving.component').then(
            (m) => m.ReceivingComponent,
          ),
      },
      {
        path: 'shipping',
        loadComponent: () =>
          import('./features/shipping/shipping.component').then(
            (m) => m.ShippingComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then(
            (m) => m.InventoryComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then(
            (m) => m.AdminComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
