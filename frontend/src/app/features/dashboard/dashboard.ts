import { Component } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-header">
      <h1>Dashboard</h1>
    </div>

    <div class="kpi-grid">
      <mat-card class="kpi-card">
        <mat-card-content>
          <mat-icon class="kpi-icon">inventory_2</mat-icon>
          <div class="kpi-value">0</div>
          <div class="kpi-label">Products</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <mat-icon class="kpi-icon">add_circle</mat-icon>
          <div class="kpi-value">0</div>
          <div class="kpi-label">Receiving Today</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <mat-icon class="kpi-icon">local_shipping</mat-icon>
          <div class="kpi-value">0</div>
          <div class="kpi-label">Shipping Today</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <mat-icon class="kpi-icon">warning</mat-icon>
          <div class="kpi-value">0</div>
          <div class="kpi-label">Low Stock Alerts</div>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="dashboard-grid">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Pending Tasks</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>No pending tasks</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Recent Activity</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>No recent activity</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dashboard-header {
        margin-bottom: 24px;
      }
      .dashboard-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .kpi-card {
        text-align: center;
        padding: 16px;
      }
      .kpi-icon {
        font-size: 40px;
        height: 40px;
        width: 40px;
        color: #3f51b5;
        margin-bottom: 8px;
      }
      .kpi-value {
        font-size: 32px;
        font-weight: 600;
        margin: 8px 0;
      }
      .kpi-label {
        color: #666;
        font-size: 14px;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 16px;
      }
      .dashboard-card {
        min-height: 200px;
      }
    `,
  ],
})
export class DashboardComponent {}
