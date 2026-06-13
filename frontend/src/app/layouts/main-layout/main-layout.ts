import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <button mat-icon-button (click)="drawer.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="app-title">WMS</span>
      <span class="spacer"></span>
      <button mat-icon-button>
        <mat-icon>notifications</mat-icon>
      </button>
      <span class="badge-wrapper" [matBadge]="0" matBadgeColor="warn"> </span>

      <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
        <mat-icon>account_circle</mat-icon>
        {{ auth.user()?.firstName }}
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <mat-drawer-container class="app-container">
      <mat-drawer #drawer mode="side" opened class="app-sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          <div mat-subheader>Operations</div>
          <a mat-list-item routerLink="/receiving" routerLinkActive="active-link">
            <mat-icon matListItemIcon>add_circle</mat-icon>
            <span matListItemTitle>Receiving</span>
          </a>
          <a mat-list-item routerLink="/shipping" routerLinkActive="active-link">
            <mat-icon matListItemIcon>local_shipping</mat-icon>
            <span matListItemTitle>Shipping</span>
          </a>
          <a mat-list-item routerLink="/inventory" routerLinkActive="active-link">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Inventory</span>
          </a>

          <div mat-subheader>Master Data</div>
          <a mat-list-item routerLink="/warehouses" routerLinkActive="active-link">
            <mat-icon matListItemIcon>warehouse</mat-icon>
            <span matListItemTitle>Warehouses</span>
          </a>
          <a mat-list-item routerLink="/products" routerLinkActive="active-link">
            <mat-icon matListItemIcon>category</mat-icon>
            <span matListItemTitle>Products</span>
          </a>

          <div mat-subheader>Reporting</div>
          <a mat-list-item routerLink="/reports" routerLinkActive="active-link">
            <mat-icon matListItemIcon>bar_chart</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>

          @if (auth.hasRole('Admin')) {
            <div mat-subheader>Administration</div>
            <a mat-list-item routerLink="/admin" routerLinkActive="active-link">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span matListItemTitle>Admin</span>
            </a>
          }
        </mat-nav-list>
      </mat-drawer>

      <mat-drawer-content class="app-content">
        <router-outlet></router-outlet>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: [
    `
      .app-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        height: 64px;
      }
      .app-title {
        margin-left: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .user-button {
        margin-left: 8px;
      }
      .app-container {
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .app-sidenav {
        width: 260px;
        border-right: 1px solid rgba(0, 0, 0, 0.08);
      }
      .app-content {
        padding: 24px;
        overflow-y: auto;
      }
      .active-link {
        background: rgba(63, 81, 181, 0.08);
        color: #3f51b5;
      }
      .active-link .mat-icon {
        color: #3f51b5;
      }
      .badge-wrapper {
        display: inline-flex;
        position: relative;
        margin-bottom: 4px;
      }
      .mat-badge-content {
        z-index: 1;
      }
    `,
  ],
})
export class MainLayout {
  auth = inject(AuthService);
}
