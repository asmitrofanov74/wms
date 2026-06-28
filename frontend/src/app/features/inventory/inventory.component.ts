import { Component, OnInit, AfterViewInit, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InventoryService } from './inventory.service';
import { InventoryItem } from '../../shared/models/api-response';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatSlideToggleModule,
  ],
  template: `
    <div class="page-header">
      <h1>Inventory</h1>
    </div>

    <div class="tab-toolbar">
      <div class="filters">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="loadItems()" placeholder="Product name or SKU">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="lowStockOnly" (change)="loadItems()">
          Low stock only
        </mat-slide-toggle>
      </div>
    </div>

    <div class="table-container">
      @if (loading()) {
        <div class="loading-shade"><mat-spinner diameter="40"/></div>
      }
      <table mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="productSku">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th>
          <td mat-cell *matCellDef="let i"><code>{{ i.productSku }}</code></td>
        </ng-container>
        <ng-container matColumnDef="productName">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
          <td mat-cell *matCellDef="let i">{{ i.productName }}</td>
        </ng-container>
        <ng-container matColumnDef="quantityOnHand">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>On Hand</th>
          <td mat-cell *matCellDef="let i">{{ i.quantityOnHand }}</td>
        </ng-container>
        <ng-container matColumnDef="quantityReserved">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Reserved</th>
          <td mat-cell *matCellDef="let i">{{ i.quantityReserved }}</td>
        </ng-container>
        <ng-container matColumnDef="availableQuantity">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Available</th>
          <td mat-cell *matCellDef="let i">
            <span [class.low-stock]="i.availableQuantity <= 0">{{ i.availableQuantity }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="reorderPoint">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Reorder At</th>
          <td mat-cell *matCellDef="let i">{{ i.reorderPoint || '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let i">
            <button mat-icon-button (click)="openAdjustDialog(i)" matTooltip="Adjust Count">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        @if (dataSource.data.length === 0) {
          <tr class="no-data-row">
            <td [attr.colspan]="columns.length">No inventory items found</td>
          </tr>
        }
      </table>
      @if (dataSource.filteredData.length > 10) {
        <mat-paginator [length]="totalItems" [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .page-header h1 { margin: 0 0 16px; font-size: 28px; font-weight: 500; }
    .tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .filters { display: flex; gap: 12px; align-items: center; }
    .filters mat-form-field { width: 280px; }
    .table-container { position: relative; }
    .loading-shade { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 1; }
    table { width: 100%; }
    td code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .no-data-row td { text-align: center; padding: 32px; color: #999; font-style: italic; }
    .mat-column-actions { width: 60px; text-align: right; }
    .mat-column-quantityOnHand, .mat-column-quantityReserved, .mat-column-availableQuantity, .mat-column-reorderPoint { width: 110px; text-align: right; }
    .low-stock { color: #f44336; font-weight: 500; }
  `],
})
export class InventoryComponent implements OnInit {
  private service = inject(InventoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  search = '';
  lowStockOnly = false;

  columns = ['productSku', 'productName', 'quantityOnHand', 'quantityReserved', 'availableQuantity', 'reorderPoint', 'actions'];
  dataSource = new MatTableDataSource<InventoryItem>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadItems();
  }

  totalItems = 0;

  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => this.loadItems());
  }

  loadItems(): void {
    this.loading.set(true);
    const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
    const limit = this.paginator ? this.paginator.pageSize : 20;
    this.service.getItems(this.search || undefined, this.lowStockOnly || undefined, page, limit).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.totalItems = res.meta.total;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdjustDialog(item: InventoryItem): void {
    const ref = this.dialog.open(AdjustInventoryDialog, {
      width: '400px',
      data: { item },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadItems();
    });
  }
}

// --- Adjust Inventory Dialog ---
@Component({
  selector: 'app-adjust-inventory-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Adjust Count - {{ data.item.productSku }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <p class="product-name">{{ data.item.productName }}</p>
        <div class="current-qty">
          <span>Current: <strong>{{ data.item.quantityOnHand }}</strong></span>
          <span>Reserved: <strong>{{ data.item.quantityReserved }}</strong></span>
          <span>Available: <strong>{{ data.item.availableQuantity }}</strong></span>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>New Quantity On Hand</mat-label>
          <input matInput type="number" min="0" step="any" [(ngModel)]="newQuantity" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Reason (optional)</mat-label>
          <input matInput [(ngModel)]="reason" maxlength="200">
        </mat-form-field>
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()"
        [disabled]="saving() || newQuantity === undefined || newQuantity < 0">
        @if (saving()) { <mat-spinner diameter="20"/> }
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
    .product-name { color: #666; margin: 0; font-size: 14px; }
    .current-qty { display: flex; gap: 16px; font-size: 13px; color: #666; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class AdjustInventoryDialog {
  private service = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<AdjustInventoryDialog>);
  private snackBar = inject(MatSnackBar);
  data: { item: InventoryItem } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  newQuantity = this.data.item.quantityOnHand;
  reason = '';

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.service.adjustItem(this.data.item.id, {
      quantityOnHand: this.newQuantity,
      reason: this.reason || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Count adjusted', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error adjusting count'); this.saving.set(false); },
    });
  }
}
