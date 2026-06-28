import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ShippingService } from './shipping.service';
import { ProductsService } from '../products/products.service';
import { ShippingOrder, Product } from '../../shared/models/api-response';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Shipping</h1>
    </div>

    <div class="tab-toolbar">
      <div class="filters">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="loadOrders()" placeholder="Order # or customer">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadOrders()">
            <mat-option value="">All</mat-option>
            <mat-option value="draft">Draft</mat-option>
            <mat-option value="picking">Picking</mat-option>
            <mat-option value="packing">Packing</mat-option>
            <mat-option value="shipped">Shipped</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> New Shipping Order
      </button>
    </div>

    <div class="table-container">
      @if (loading()) {
        <div class="loading-shade"><mat-spinner diameter="40"/></div>
      }
      <table mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="orderNumber">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Order #</th>
          <td mat-cell *matCellDef="let o"><code>{{ o.orderNumber }}</code></td>
        </ng-container>
        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th>
          <td mat-cell *matCellDef="let o">{{ o.customer }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let o">
            <span class="status-badge"
                  [class.status-draft]="o.status === 'draft'"
                  [class.status-picking]="o.status === 'picking'"
                  [class.status-packing]="o.status === 'packing'"
                  [class.status-shipped]="o.status === 'shipped'"
                  [class.status-cancelled]="o.status === 'cancelled'">
              {{ statusLabel(o.status) }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="lines">
          <th mat-header-cell *matHeaderCellDef>Lines</th>
          <td mat-cell *matCellDef="let o">{{ o.lines.length }}</td>
        </ng-container>
        <ng-container matColumnDef="progress">
          <th mat-header-cell *matHeaderCellDef>Progress</th>
          <td mat-cell *matCellDef="let o">
            {{ progressPercent(o) }}%
          </td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
          <td mat-cell *matCellDef="let o">{{ o.createdAt | date:'short' }}</td>
        </ng-container>
        <ng-container matColumnDef="actionEdit">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'draft') {
              <button mat-icon-button (click)="openEditDialog(o)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionPlay">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'draft') {
              <button mat-icon-button (click)="startPicking(o)" matTooltip="Start Picking" style="color:#1976d2">
                <mat-icon>play_arrow</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionCancel">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'draft' || o.status === 'picking' || o.status === 'packing') {
              <button mat-icon-button (click)="cancelOrder(o)" matTooltip="Cancel" style="color:#f44336">
                <mat-icon>cancel</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionPick">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'picking') {
              <button mat-icon-button (click)="openPickDialog(o)" matTooltip="Pick Items" style="color:#1976d2">
                <mat-icon>inventory_2</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionMoveToInbox">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'picking') {
              <button mat-icon-button (click)="startPacking(o)" matTooltip="Start Packing" style="color:#ff9800">
                <mat-icon>move_to_inbox</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionPack">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'packing') {
              <button mat-icon-button (click)="openPackDialog(o)" matTooltip="Pack Items" style="color:#ff9800">
                <mat-icon>inventory</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="actionShip">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            @if (o.status === 'packing') {
              <button mat-icon-button (click)="shipOrder(o)" matTooltip="Ship" style="color:#4caf50">
                <mat-icon>local_shipping</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        @if (dataSource.data.length === 0) {
          <tr class="no-data-row">
            <td [attr.colspan]="columns.length">No shipping orders found</td>
          </tr>
        }
      </table>
      @if (dataSource.filteredData.length > 10) {
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .page-header h1 { margin: 0 0 16px; font-size: 28px; font-weight: 500; }
    .tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .filters { display: flex; gap: 12px; align-items: center; }
    .filters mat-form-field { width: 220px; }
    .table-container { position: relative; }
    .loading-shade { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 1; }
    table { width: 100%; }
    td code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .no-data-row td { text-align: center; padding: 32px; color: #999; font-style: italic; }
    .mat-column-actionEdit { width: 48px; text-align: center; }
    .mat-column-actionPlay { width: 48px; text-align: center; }
    .mat-column-actionCancel { width: 48px; text-align: center; }
    .mat-column-actionPick { width: 48px; text-align: center; }
    .mat-column-actionMoveToInbox { width: 48px; text-align: center; }
    .mat-column-actionPack { width: 48px; text-align: center; }
    .mat-column-actionShip { width: 48px; text-align: center; }
    .mat-column-status { width: 100px; }
    .mat-column-lines { width: 70px; text-align: center; }
    .mat-column-progress { width: 90px; text-align: center; }
    .status-badge { display: inline-block; font-size: 13px; font-weight: 500; background: none !important; }
    .status-draft { color: #616161; background: none !important; }
    .status-picking { color: #1565c0; background: none !important; }
    .status-packing { color: #e65100; background: none !important; }
    .status-shipped { color: #2e7d32; background: none !important; }
    .status-cancelled { color: #c62828; background: none !important; }
  `],
})
export class ShippingComponent implements OnInit {
  private service = inject(ShippingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  orders = signal<ShippingOrder[]>([]);
  search = '';
  statusFilter = '';

  columns = ['orderNumber', 'customer', 'status', 'lines', 'progress', 'createdAt', 'actionEdit', 'actionPlay', 'actionCancel', 'actionPick', 'actionMoveToInbox', 'actionPack', 'actionShip'];
  dataSource = new MatTableDataSource<ShippingOrder>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.service.getOrders(this.search || undefined, this.statusFilter || undefined).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'picking': 'Picking',
      'packing': 'Packing',
      'shipped': 'Shipped',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  }

  progressPercent(order: ShippingOrder): number {
    const total = order.lines.reduce((s, l) => s + Number(l.orderedQuantity), 0);
    const shipped = order.lines.reduce((s, l) => s + Number(l.shippedQuantity), 0);
    return total > 0 ? Math.round((shipped / total) * 100) : 0;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ShippingFormDialog, {
      width: '600px',
      data: {},
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  openEditDialog(order: ShippingOrder): void {
    const ref = this.dialog.open(ShippingFormDialog, {
      width: '600px',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  openPickDialog(order: ShippingOrder): void {
    const ref = this.dialog.open(PickItemsDialog, {
      width: '600px',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  openPackDialog(order: ShippingOrder): void {
    const ref = this.dialog.open(PackItemsDialog, {
      width: '600px',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  startPicking(order: ShippingOrder): void {
    this.service.updateStatus(order.id, 'picking').subscribe({
      next: () => {
        this.snackBar.open('Picking started', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to start picking', 'Close', { duration: 3000 }),
    });
  }

  startPacking(order: ShippingOrder): void {
    this.service.updateStatus(order.id, 'packing').subscribe({
      next: () => {
        this.snackBar.open('Packing started', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to start packing', 'Close', { duration: 3000 }),
    });
  }

  shipOrder(order: ShippingOrder): void {
    this.service.updateStatus(order.id, 'shipped').subscribe({
      next: () => {
        this.snackBar.open('Order shipped', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to ship', 'Close', { duration: 3000 }),
    });
  }

  cancelOrder(order: ShippingOrder): void {
    if (confirm(`Cancel shipping order ${order.orderNumber}?`)) {
      this.service.updateStatus(order.id, 'cancelled').subscribe({
        next: () => {
          this.snackBar.open('Shipping order cancelled', 'Close', { duration: 3000 });
          this.loadOrders();
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Failed to cancel', 'Close', { duration: 3000 }),
      });
    }
  }
}

// --- Shipping Form Dialog ---
@Component({
  selector: 'app-shipping-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.order ? 'Edit Shipping Order' : 'New Shipping Order' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Customer</mat-label>
          <input matInput [(ngModel)]="form.customer" required maxlength="100">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ship To Address</mat-label>
          <textarea matInput [(ngModel)]="form.shipToAddress" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="form.notes" rows="2"></textarea>
        </mat-form-field>

        <h3>Order Lines</h3>
        @for (line of form.lines; track line._id; let i = $index) {
          <div class="line-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Product</mat-label>
              <mat-select [(ngModel)]="line.productId" required>
                @for (p of products(); track p.id) {
                  <mat-option [value]="p.id">{{ p.sku }} - {{ p.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Qty</mat-label>
              <input matInput type="number" min="0.001" step="any" [(ngModel)]="line.orderedQuantity" required>
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeLine(i)" matTooltip="Remove line">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        }
        <button mat-stroked-button (click)="addLine()" [disabled]="products().length === 0">
          <mat-icon>add</mat-icon> Add Line
        </button>

        @if (products().length === 0) {
          <div class="hint">No products available. Create products first.</div>
        }
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()"
        [disabled]="saving() || !form.customer || form.lines.length === 0 || hasInvalidLines()">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.order ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
    .line-row { display: flex; gap: 8px; align-items: center; }
    .line-row mat-form-field:first-child { flex: 1; }
    .line-row mat-form-field:last-child { width: 120px; }
    h3 { margin: 8px 0; font-size: 16px; font-weight: 500; color: #555; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    .hint { color: #999; font-style: italic; font-size: 13px; }
    mat-spinner { display: inline-block; }
  `],
})
export class ShippingFormDialog implements OnInit {
  private productService = inject(ProductsService);
  private service = inject(ShippingService);
  private dialogRef = inject(MatDialogRef<ShippingFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { order?: ShippingOrder } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  products = signal<Product[]>([]);

  form = { customer: '', shipToAddress: '', notes: '', lines: [] as { _id: number; productId: string; orderedQuantity: number }[] };
  private nextId = 1;

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (res) => this.products.set(res.data),
    });

    if (this.data.order) {
      this.form.customer = this.data.order.customer;
      this.form.shipToAddress = this.data.order.shipToAddress;
      this.form.notes = this.data.order.notes;
      this.form.lines = this.data.order.lines.map((l) => ({
        _id: this.nextId++,
        productId: l.productId,
        orderedQuantity: l.orderedQuantity,
      }));
    } else {
      this.addLine();
    }
  }

  addLine(): void {
    this.form.lines = [...this.form.lines, { _id: this.nextId++, productId: '', orderedQuantity: 1 }];
  }

  removeLine(index: number): void {
    this.form.lines = this.form.lines.filter((_, i) => i !== index);
  }

  hasInvalidLines(): boolean {
    return this.form.lines.some((l) => !l.productId || !l.orderedQuantity);
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const lines = this.form.lines.map((l) => ({
      productId: l.productId,
      orderedQuantity: l.orderedQuantity,
    }));
    const obs = this.data.order
      ? this.service.updateOrder(this.data.order.id, {
          customer: this.form.customer,
          shipToAddress: this.form.shipToAddress || undefined,
          notes: this.form.notes || undefined,
        })
      : this.service.createOrder({
          customer: this.form.customer,
          shipToAddress: this.form.shipToAddress || undefined,
          notes: this.form.notes || undefined,
          lines,
        });
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Shipping order ${this.data.order ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}

// --- Pick Items Dialog ---
@Component({
  selector: 'app-pick-items-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Pick Items - {{ data.order.orderNumber }}</h2>
    <mat-dialog-content>
      <p class="subtitle">Enter quantities to pick for each line item.</p>

      @for (line of lines; track line.id; let i = $index) {
        <div class="line-item">
          <div class="line-info">
            <strong>{{ line.productSku }}</strong> - {{ line.productName }}
          </div>
          <div class="line-qty">
            <span>Ordered: {{ line.orderedQuantity }}</span>
            <span>Picked: {{ line.pickedQuantity }}</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Pick Qty</mat-label>
              <input matInput type="number" min="0" [max]="line.orderedQuantity - line.pickedQuantity" step="any"
                [(ngModel)]="pickQty[i]">
            </mat-form-field>
          </div>
        </div>
        @if (i < lines.length - 1) { <mat-divider></mat-divider> }
      }

      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Close</button>
      <button mat-flat-button color="primary" (click)="pick()"
        [disabled]="saving() || noQuantities()">
        @if (saving()) { <mat-spinner diameter="20"/> }
        Pick Items
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .subtitle { color: #666; margin: 0 0 16px; }
    .line-item { padding: 12px 0; }
    .line-info { font-size: 14px; margin-bottom: 8px; }
    .line-qty { display: flex; align-items: center; gap: 16px; }
    .line-qty span { font-size: 13px; color: #666; }
    .line-qty mat-form-field { width: 120px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class PickItemsDialog {
  private service = inject(ShippingService);
  private dialogRef = inject(MatDialogRef<PickItemsDialog>);
  private snackBar = inject(MatSnackBar);
  data: { order: ShippingOrder } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  lines = this.data.order.lines;
  pickQty: number[] = this.lines.map(() => 0);

  noQuantities(): boolean {
    return this.pickQty.every((q) => !q || q <= 0);
  }

  pick(): void {
    this.saving.set(true);
    this.error.set('');
    const items = this.lines
      .map((l, i) => ({
        lineId: l.id,
        quantity: this.pickQty[i] || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      this.error.set('Enter at least one quantity to pick');
      this.saving.set(false);
      return;
    }

    this.service.pickItems(this.data.order.id, { items }).subscribe({
      next: () => {
        this.snackBar.open('Items picked', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error picking items'); this.saving.set(false); },
    });
  }
}

// --- Pack Items Dialog ---
@Component({
  selector: 'app-pack-items-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Pack Items - {{ data.order.orderNumber }}</h2>
    <mat-dialog-content>
      <p class="subtitle">Enter quantities to pack for each line item.</p>

      @for (line of lines; track line.id; let i = $index) {
        <div class="line-item">
          <div class="line-info">
            <strong>{{ line.productSku }}</strong> - {{ line.productName }}
          </div>
          <div class="line-qty">
            <span>Ordered: {{ line.orderedQuantity }}</span>
            <span>Picked: {{ line.pickedQuantity }}</span>
            <span>Packed: {{ line.packedQuantity }}</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Pack Qty</mat-label>
              <input matInput type="number" min="0" [max]="line.orderedQuantity - line.packedQuantity" step="any"
                [(ngModel)]="packQty[i]">
            </mat-form-field>
          </div>
        </div>
        @if (i < lines.length - 1) { <mat-divider></mat-divider> }
      }

      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Close</button>
      <button mat-flat-button color="primary" (click)="pack()"
        [disabled]="saving() || noQuantities()">
        @if (saving()) { <mat-spinner diameter="20"/> }
        Pack Items
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .subtitle { color: #666; margin: 0 0 16px; }
    .line-item { padding: 12px 0; }
    .line-info { font-size: 14px; margin-bottom: 8px; }
    .line-qty { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .line-qty span { font-size: 13px; color: #666; }
    .line-qty mat-form-field { width: 120px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class PackItemsDialog {
  private service = inject(ShippingService);
  private dialogRef = inject(MatDialogRef<PackItemsDialog>);
  private snackBar = inject(MatSnackBar);
  data: { order: ShippingOrder } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  lines = this.data.order.lines;
  packQty: number[] = this.lines.map(() => 0);

  noQuantities(): boolean {
    return this.packQty.every((q) => !q || q <= 0);
  }

  pack(): void {
    this.saving.set(true);
    this.error.set('');
    const items = this.lines
      .map((l, i) => ({
        lineId: l.id,
        quantity: this.packQty[i] || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      this.error.set('Enter at least one quantity to pack');
      this.saving.set(false);
      return;
    }

    this.service.packItems(this.data.order.id, { items }).subscribe({
      next: () => {
        this.snackBar.open('Items packed', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error packing items'); this.saving.set(false); },
    });
  }
}
