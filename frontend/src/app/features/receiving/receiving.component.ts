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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReceivingService } from './receiving.service';
import { ProductsService } from '../products/products.service';
import { ReceivingOrder, Product } from '../../shared/models/api-response';

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Receiving</h1>
    </div>

    <div class="tab-toolbar">
      <div class="filters">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="loadOrders()" placeholder="Order # or supplier">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadOrders()">
            <mat-option value="">All</mat-option>
            <mat-option value="draft">Draft</mat-option>
            <mat-option value="in-progress">In Progress</mat-option>
            <mat-option value="completed">Completed</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> New Receiving Order
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
        <ng-container matColumnDef="supplier">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Supplier</th>
          <td mat-cell *matCellDef="let o">{{ o.supplier }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let o">
            <span class="status-badge"
                  [class.status-draft]="o.status === 'draft'"
                  [class.status-progress]="o.status === 'in-progress'"
                  [class.status-completed]="o.status === 'completed'"
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
                  <button mat-icon-button (click)="startReceiving(o)" matTooltip="Start Receiving" style="color:#1976d2">
                    <mat-icon>play_arrow</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actionCancel">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let o">
                @if (o.status === 'draft' || o.status === 'in-progress') {
                  <button mat-icon-button (click)="cancelOrder(o)" matTooltip="Cancel" style="color:#f44336">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actionReceive">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let o">
                @if (o.status === 'in-progress') {
                  <button mat-icon-button (click)="openReceiveDialog(o)" matTooltip="Receive Items" style="color:#1976d2">
                    <mat-icon>inventory_2</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actionComplete">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let o">
                @if (o.status === 'in-progress') {
                  <button mat-icon-button (click)="completeOrder(o)" matTooltip="Complete" style="color:#4caf50">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        @if (dataSource.data.length === 0) {
          <tr class="no-data-row">
            <td [attr.colspan]="columns.length">No receiving orders found</td>
          </tr>
        }
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
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
    .mat-column-actionReceive { width: 48px; text-align: center; }
    .mat-column-actionComplete { width: 48px; text-align: center; }
    .mat-column-status { width: 130px; }
    .mat-column-lines { width: 70px; text-align: center; }
    .mat-column-progress { width: 90px; text-align: center; }
    .status-badge { display: inline-block; font-size: 13px; font-weight: 500; background: none !important; }
    .status-draft { color: #616161; background: none !important; }
    .status-progress { color: #1565c0; background: none !important; }
    .status-completed { color: #2e7d32; background: none !important; }
    .status-cancelled { color: #c62828; background: none !important; }
  `],
})
export class ReceivingComponent implements OnInit {
  private service = inject(ReceivingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  orders = signal<ReceivingOrder[]>([]);
  search = '';
  statusFilter = '';

  columns = ['orderNumber', 'supplier', 'status', 'lines', 'progress', 'createdAt', 'actionEdit', 'actionPlay', 'actionCancel', 'actionReceive', 'actionComplete'];
  dataSource = new MatTableDataSource<ReceivingOrder>([]);

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
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  }

  progressPercent(order: ReceivingOrder): number {
    const total = order.lines.reduce((s, l) => s + Number(l.expectedQuantity), 0);
    const recv = order.lines.reduce((s, l) => s + Number(l.receivedQuantity), 0);
    return total > 0 ? Math.round((recv / total) * 100) : 0;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ReceivingFormDialog, {
      width: '600px',
      data: {},
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  openEditDialog(order: ReceivingOrder): void {
    const ref = this.dialog.open(ReceivingFormDialog, {
      width: '600px',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  openReceiveDialog(order: ReceivingOrder): void {
    const ref = this.dialog.open(ReceiveItemsDialog, {
      width: '600px',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadOrders();
    });
  }

  startReceiving(order: ReceivingOrder): void {
    this.service.updateStatus(order.id, 'in-progress').subscribe({
      next: () => {
        this.snackBar.open('Receiving started', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to start receiving', 'Close', { duration: 3000 }),
    });
  }

  completeOrder(order: ReceivingOrder): void {
    this.service.updateStatus(order.id, 'completed').subscribe({
      next: () => {
        this.snackBar.open('Receiving completed', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to complete', 'Close', { duration: 3000 }),
    });
  }

  cancelOrder(order: ReceivingOrder): void {
    if (confirm(`Cancel receiving order ${order.orderNumber}?`)) {
      this.service.updateStatus(order.id, 'cancelled').subscribe({
        next: () => {
          this.snackBar.open('Receiving order cancelled', 'Close', { duration: 3000 });
          this.loadOrders();
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Failed to cancel', 'Close', { duration: 3000 }),
      });
    }
  }
}

// --- Receiving Form Dialog ---
@Component({
  selector: 'app-receiving-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatAutocompleteModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.order ? 'Edit Receiving Order' : 'New Receiving Order' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Supplier</mat-label>
          <input matInput [(ngModel)]="form.supplier" required maxlength="100">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="form.notes" rows="2"></textarea>
        </mat-form-field>

        <h3>Order Lines</h3>
        @if (productsError()) {
          <div class="load-error">Failed to load products. Check connection.</div>
        }
        @for (line of form.lines; track line._id; let i = $index) {
          <div class="line-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Product</mat-label>
              <input matInput [matAutocomplete]="auto" [(ngModel)]="line.searchText" [ngModelOptions]="{standalone: true}"
                (ngModelChange)="onSearchChange(i, $event)" placeholder="Type to search..." required>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onProductSelected(i, $event)"
                [displayWith]="displayProduct">
                @for (p of filteredProducts(i); track p.id) {
                  <mat-option [value]="p">{{ p.sku }} - {{ p.name }}</mat-option>
                }
              </mat-autocomplete>
              @if (line.productId && line.searchText) {
                <button matSuffix mat-icon-button (click)="clearProduct(i)" tabindex="-1" type="button">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Qty</mat-label>
              <input matInput type="number" min="0.001" step="any" [(ngModel)]="line.expectedQuantity" required>
            </mat-form-field>
            @if (form.lines.length > 1) {
              <button mat-icon-button color="warn" (click)="removeLine(i)" matTooltip="Remove line">
                <mat-icon>remove_circle</mat-icon>
              </button>
            }
          </div>
        }
        <button mat-stroked-button class="add-line-btn" (click)="addLine()" [disabled]="products().length === 0">
          <mat-icon>add</mat-icon> Add Line
        </button>

        @if (products().length === 0 && !productsError()) {
          <div class="hint">No products available. Create products first.</div>
        }
        @if (productsLoading()) {
          <div class="hint">Loading products...</div>
        }
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()"
        [disabled]="saving() || !form.supplier || form.lines.length === 0 || hasInvalidLines()">
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
    .load-error { color: #f44336; font-size: 13px; margin-bottom: 4px; }
    .hint { color: #999; font-style: italic; font-size: 13px; }
    .add-line-btn { border-radius: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class ReceivingFormDialog implements OnInit {
  private productService = inject(ProductsService);
  private service = inject(ReceivingService);
  private dialogRef = inject(MatDialogRef<ReceivingFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { order?: ReceivingOrder } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  products = signal<Product[]>([]);
  productsLoading = signal(false);
  productsError = signal(false);

  form = {
    supplier: '', notes: '',
    lines: [] as { _id: number; productId: string; expectedQuantity: number; searchText: string }[],
  };
  private nextId = 1;

  ngOnInit(): void {
    this.productsLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.productsLoading.set(false);
        if (this.data.order) {
          this.form.supplier = this.data.order.supplier;
          this.form.notes = this.data.order.notes;
          this.form.lines = this.data.order.lines.map((l) => {
            const p = data.find((x) => x.id === l.productId);
            return {
              _id: this.nextId++,
              productId: l.productId,
              expectedQuantity: l.expectedQuantity,
              searchText: p ? `${p.sku} - ${p.name}` : '',
            };
          });
        } else {
          this.addLine();
        }
      },
      error: () => {
        this.productsError.set(true);
        this.productsLoading.set(false);
      },
    });
  }

  filteredProducts(i: number): Product[] {
    const text = this.form.lines[i]?.searchText?.toLowerCase() || '';
    return this.products().filter(
      (p) => !text || p.sku.toLowerCase().includes(text) || p.name.toLowerCase().includes(text),
    );
  }

  displayProduct(p: any): string {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return `${p.sku} - ${p.name}`;
  }

  onSearchChange(i: number, value: string | Product): void {
    if (typeof value === 'string' && !value) {
      this.form.lines[i].productId = '';
    }
  }

  onProductSelected(i: number, event: any): void {
    const p = event.option.value as Product;
    this.form.lines[i].productId = p.id;
    this.form.lines[i].searchText = `${p.sku} - ${p.name}`;
  }

  clearProduct(i: number): void {
    this.form.lines[i].productId = '';
    this.form.lines[i].searchText = '';
  }

  addLine(): void {
    this.form.lines = [
      ...this.form.lines,
      { _id: this.nextId++, productId: '', expectedQuantity: 1, searchText: '' },
    ];
  }

  removeLine(index: number): void {
    this.form.lines = this.form.lines.filter((_, i) => i !== index);
  }

  hasInvalidLines(): boolean {
    return this.form.lines.some((l) => !l.productId || !l.expectedQuantity);
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const lines = this.form.lines.map((l) => ({
      productId: l.productId,
      expectedQuantity: l.expectedQuantity,
    }));
    const obs = this.data.order
      ? this.service.updateOrder(this.data.order.id, {
          supplier: this.form.supplier,
          notes: this.form.notes || undefined,
          lines,
        })
      : this.service.createOrder({
          supplier: this.form.supplier,
          notes: this.form.notes || undefined,
          lines,
        });
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Receiving order ${this.data.order ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}

// --- Receive Items Dialog ---
@Component({
  selector: 'app-receive-items-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule,     MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Receive Items - {{ data.order.orderNumber }}</h2>
    <mat-dialog-content>
      <p class="subtitle">Enter quantities to receive for each line item.</p>

      @for (line of lines; track line.id; let i = $index) {
        <div class="receive-line">
          <div class="line-info">
            <strong>{{ line.productSku }}</strong> - {{ line.productName }}
          </div>
          <div class="line-qty">
            <span>Expected: {{ line.expectedQuantity }}</span>
            <span>Received: {{ line.receivedQuantity }}</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Add Qty</mat-label>
              <input matInput type="number" min="0" [max]="line.expectedQuantity - line.receivedQuantity" step="any"
                [(ngModel)]="receiveQty[i]">
            </mat-form-field>
          </div>
        </div>
        @if (i < lines.length - 1) { <mat-divider></mat-divider> }
      }

      @if (allReceived()) {
        <div class="all-received">All lines fully received. You can now complete this order.</div>
      }

      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Close</button>
      <button mat-flat-button color="primary" (click)="receive()"
        [disabled]="saving() || noQuantities()">
        @if (saving()) { <mat-spinner diameter="20"/> }
        Receive Items
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .subtitle { color: #666; margin: 0 0 16px; }
    .receive-line { padding: 12px 0; }
    .line-info { font-size: 14px; margin-bottom: 8px; }
    .line-qty { display: flex; align-items: center; gap: 16px; }
    .line-qty span { font-size: 13px; color: #666; }
    .line-qty mat-form-field { width: 120px; }
    .all-received { margin-top: 12px; padding: 8px 12px; background: #e8f5e9; border-radius: 4px; color: #2e7d32; font-size: 13px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class ReceiveItemsDialog {
  private service = inject(ReceivingService);
  private dialogRef = inject(MatDialogRef<ReceiveItemsDialog>);
  private snackBar = inject(MatSnackBar);
  data: { order: ReceivingOrder } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  lines = this.data.order.lines;
  receiveQty: number[] = this.lines.map(() => 0);

  allReceived(): boolean {
    return this.lines.every((l) => Number(l.receivedQuantity) >= Number(l.expectedQuantity));
  }

  noQuantities(): boolean {
    return this.receiveQty.every((q) => !q || q <= 0);
  }

  receive(): void {
    this.saving.set(true);
    this.error.set('');
    const items = this.lines
      .map((l, i) => ({
        lineId: l.id,
        receivedQuantity: this.receiveQty[i] || 0,
      }))
      .filter((item) => item.receivedQuantity > 0);

    if (items.length === 0) {
      this.error.set('Enter at least one quantity to receive');
      this.saving.set(false);
      return;
    }

    this.service.receiveItems(this.data.order.id, { items }).subscribe({
      next: () => {
        this.snackBar.open('Items received', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error receiving items'); this.saving.set(false); },
    });
  }
}
