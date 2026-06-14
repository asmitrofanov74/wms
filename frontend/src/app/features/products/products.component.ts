import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { ProductsService } from './products.service';
import { Product, Category } from '../../shared/models/api-response';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    FormsModule, MatTabsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatChipsModule, MatSlideToggleModule,
  ],
  template: `
    <div class="page-header">
      <h1>Products</h1>
    </div>

    <mat-tab-group (selectedTabChange)="onTabChange($event)">
      <mat-tab label="Products">
        <div class="tab-toolbar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="productSearch" (input)="applyProductFilter()" placeholder="Search by SKU or name">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="selectedCategoryId" (selectionChange)="loadProducts()">
              <mat-option value="">All</mat-option>
              @for (c of allCategories(); track c.id) {
                <mat-option [value]="c.id">{{ c.code }} - {{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openProductDialog()">
            <mat-icon>add</mat-icon> Add Product
          </button>
        </div>

        <div class="table-container">
          @if (loadingProducts()) {
            <div class="loading-shade"><mat-spinner diameter="40"/></div>
          }
          <table mat-table [dataSource]="productDataSource" matSort>
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th>
              <td mat-cell *matCellDef="let p"><code>{{ p.sku }}</code></td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let p">{{ p.name }}</td>
            </ng-container>
            <ng-container matColumnDef="categoryName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
              <td mat-cell *matCellDef="let p">{{ p.categoryName || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="unitWeight">
              <th mat-header-cell *matHeaderCellDef>Weight</th>
              <td mat-cell *matCellDef="let p">{{ p.unitWeight || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="unitVolume">
              <th mat-header-cell *matHeaderCellDef>Volume</th>
              <td mat-cell *matCellDef="let p">{{ p.unitVolume || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="isTracked">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Tracked</th>
              <td mat-cell *matCellDef="let p">
                <mat-icon [style.color]="p.isTracked ? '#4caf50' : '#9e9e9e'">
                  {{ p.isTracked ? 'inventory_2' : 'inventory' }}
                </mat-icon>
              </td>
            </ng-container>
            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Active</th>
              <td mat-cell *matCellDef="let p" style="text-align:center">
                <button mat-icon-button (click)="toggleProduct(p)" [matTooltip]="p.isActive ? 'Deactivate' : 'Activate'">
                  <mat-icon [style.color]="p.isActive ? '#4caf50' : '#f44336'">
                    {{ p.isActive ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionUom">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openProductUomDialog(p)" matTooltip="Manage UOMs & Barcodes">
                  <mat-icon>qr_code_scanner</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionEdit">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openProductDialog(p)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionDelete">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="deleteProduct(p)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="productColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: productColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
        </div>
      </mat-tab>

      <mat-tab label="Categories">
        <div class="tab-toolbar">
          <span></span>
          <button mat-flat-button color="primary" (click)="openCategoryDialog()">
            <mat-icon>add</mat-icon> Add Category
          </button>
        </div>

        <div class="table-container">
          @if (loadingCategories()) {
            <div class="loading-shade"><mat-spinner diameter="40"/></div>
          }
          <table mat-table [dataSource]="categoryDataSource" matSort>
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Code</th>
              <td mat-cell *matCellDef="let c">{{ c.code }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>
            <ng-container matColumnDef="path">
              <th mat-header-cell *matHeaderCellDef>Path</th>
              <td mat-cell *matCellDef="let c">{{ c.path || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Active</th>
              <td mat-cell *matCellDef="let c">
                <mat-icon [style.color]="c.isActive ? '#4caf50' : '#f44336'">
                  {{ c.isActive ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionEdit">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button (click)="openCategoryDialog(c)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionDelete">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button (click)="deleteCategory(c)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .page-header h1 { margin: 0 0 16px; font-size: 28px; font-weight: 500; }
    .tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; }
    .tab-toolbar mat-form-field { width: 240px; }
    .table-container { position: relative; }
    .loading-shade { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 1; }
    table { width: 100%; }
    td code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .mat-column-isActive { width: 80px; text-align: center; }
    .mat-column-isTracked { width: 80px; text-align: center; }
    .mat-column-unitWeight, .mat-column-unitVolume { width: 80px; text-align: right; }
  `],
})
export class ProductsComponent implements OnInit {
  private service = inject(ProductsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loadingProducts = signal(false);
  loadingCategories = signal(false);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  allCategories = signal<Category[]>([]);

  productSearch = '';
  selectedCategoryId = '';
  productColumns = ['sku', 'name', 'categoryName', 'unitWeight', 'unitVolume', 'isTracked', 'isActive', 'actionUom', 'actionEdit', 'actionDelete'];
  categoryColumns = ['code', 'name', 'path', 'isActive', 'actionEdit', 'actionDelete'];

  productDataSource = new MatTableDataSource<Product>([]);
  categoryDataSource = new MatTableDataSource<Category>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.service.getProducts(this.productSearch || undefined, this.selectedCategoryId || undefined).subscribe({
      next: (data) => {
        this.products.set(data);
        this.productDataSource.data = data;
        this.productDataSource.sort = this.sort;
        this.productDataSource.paginator = this.paginator;
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  loadCategories(): void {
    this.loadingCategories.set(true);
    this.service.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.allCategories.set(this.flattenTree(data));
        this.categoryDataSource.data = data;
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  private flattenTree(cats: Category[]): Category[] {
    const result: Category[] = [];
    for (const c of cats) {
      result.push(c);
      if (c.children?.length) result.push(...this.flattenTree(c.children));
    }
    return result;
  }

  applyProductFilter(): void {
    this.productDataSource.filter = this.productSearch.trim().toLowerCase();
  }

  onTabChange(event: any): void {
    if (event.index === 0) {
      this.productDataSource.sort = this.sort;
      this.productDataSource.paginator = this.paginator;
    }
  }

  openProductDialog(product?: Product): void {
    const ref = this.dialog.open(ProductFormDialog, {
      width: '500px',
      data: { product, categories: this.allCategories() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProducts();
    });
  }

  toggleProduct(product: Product): void {
    this.service.toggleProduct(product.id).subscribe({
      next: () => {
        this.snackBar.open(`Product ${product.isActive ? 'deactivated' : 'activated'}`, 'Close', { duration: 3000 });
        this.loadProducts();
      },
      error: () => this.snackBar.open('Failed to update product', 'Close', { duration: 3000 }),
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Delete product ${product.sku} - ${product.name}?`)) {
      this.service.toggleProduct(product.id).subscribe({
        next: () => {
          this.snackBar.open('Product deactivated', 'Close', { duration: 3000 });
          this.loadProducts();
        },
        error: () => this.snackBar.open('Failed to deactivate product', 'Close', { duration: 3000 }),
      });
    }
  }

  openProductUomDialog(product: Product): void {
    const ref = this.dialog.open(ProductUomBarcodeDialog, {
      width: '500px',
      data: { product },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProducts();
    });
  }

  openCategoryDialog(category?: Category): void {
    const ref = this.dialog.open(CategoryFormDialog, {
      width: '450px',
      data: { category, categories: this.allCategories() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCategories();
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Delete category ${category.name}?`)) {
      this.service.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
          this.loadCategories();
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Failed to delete category', 'Close', { duration: 3000 }),
      });
    }
  }
}

// --- Product Form Dialog ---
@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'Add Product' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>SKU</mat-label>
          <input matInput [(ngModel)]="form.sku" required maxlength="50" [disabled]="!!data.product">
          @if (fieldErrors()['sku']; as errors) {
            <mat-error>{{ errors.join('; ') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" required maxlength="200">
          @if (fieldErrors()['name']; as errors) {
            <mat-error>{{ errors.join('; ') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="form.description" rows="2"></textarea>
          @if (fieldErrors()['description']; as errors) {
            <mat-error>{{ errors.join('; ') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="form.categoryId">
            <mat-option value="">None</mat-option>
            @for (c of data.categories; track c.id) {
              <mat-option [value]="c.id">{{ c.code }} - {{ c.name }}</mat-option>
            }
          </mat-select>
          @if (fieldErrors()['categoryId']; as errors) {
            <mat-error>{{ errors.join('; ') }}</mat-error>
          }
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Unit Weight</mat-label>
            <input matInput type="number" [(ngModel)]="form.unitWeight">
            @if (fieldErrors()['unitWeight']; as errors) {
              <mat-error>{{ errors.join('; ') }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Unit Volume</mat-label>
            <input matInput type="number" [(ngModel)]="form.unitVolume">
            @if (fieldErrors()['unitVolume']; as errors) {
              <mat-error>{{ errors.join('; ') }}</mat-error>
            }
          </mat-form-field>
        </div>
        <mat-slide-toggle [(ngModel)]="form.isTracked">Track Inventory</mat-slide-toggle>
      </div>
      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.sku || !form.name || (!data.product && (form.unitWeight === null || form.unitVolume === null))">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.product ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class ProductFormDialog implements OnInit {
  private service = inject(ProductsService);
  private dialogRef = inject(MatDialogRef<ProductFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { product?: Product; categories: Category[] } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  fieldErrors = signal<Record<string, string[]>>({});
  form = { sku: '', name: '', description: '', categoryId: '', unitWeight: null as number | null, unitVolume: null as number | null, isTracked: true };

  ngOnInit(): void {
    if (this.data.product) {
      this.form.sku = this.data.product.sku;
      this.form.name = this.data.product.name;
      this.form.description = this.data.product.description;
      this.form.categoryId = this.data.product.categoryId || '';
      this.form.unitWeight = this.data.product.unitWeight ?? null;
      this.form.unitVolume = this.data.product.unitVolume ?? null;
      this.form.isTracked = this.data.product.isTracked;
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.fieldErrors.set({});
    let dto: Record<string, any> = {};
    const { sku, ...formFields } = this.form;
    const source = this.data.product ? formFields : this.form;
    for (const [k, v] of Object.entries(source)) {
      if (v !== null && v !== undefined) dto[k] = v;
    }
    if (dto['categoryId'] === '') delete dto['categoryId'];
    const obs = this.data.product
      ? this.service.updateProduct(this.data.product.id, dto as any)
      : this.service.createProduct(dto as any);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Product ${this.data.product ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const body = err.error;
        if (body?.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
          this.fieldErrors.set(body.errors as Record<string, string[]>);
        } else {
          const msg = body?.message || err.statusText || 'Error';
          const details = body?.details || body?.error || (Array.isArray(body?.errors) ? body.errors : undefined);
          this.error.set(details ? `${msg}: ${Array.isArray(details) ? details.join('; ') : JSON.stringify(details)}` : msg);
        }
        this.saving.set(false);
      },
    });
  }
}

// --- Category Form Dialog ---
@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Edit Category' : 'Add Category' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="form.code" required maxlength="20" [disabled]="!!data.category">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" required maxlength="100">
        </mat-form-field>
        @if (!data.category) {
          <mat-form-field appearance="outline">
            <mat-label>Parent Category</mat-label>
            <mat-select [(ngModel)]="form.parentId">
              <mat-option value="">None (root level)</mat-option>
              @for (c of data.categories; track c.id) {
                <mat-option [value]="c.id">{{ c.code }} - {{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.code || !form.name">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.category ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class CategoryFormDialog implements OnInit {
  private service = inject(ProductsService);
  private dialogRef = inject(MatDialogRef<CategoryFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { category?: Category; categories: Category[] } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  form = { code: '', name: '', parentId: '' };

  ngOnInit(): void {
    if (this.data.category) {
      this.form.code = this.data.category.code;
      this.form.name = this.data.category.name;
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const dto: any = { code: this.form.code, name: this.form.name };
    if (this.form.parentId) dto.parentId = this.form.parentId;
    const obs = this.data.category
      ? this.service.updateCategory(this.data.category.id, { code: this.form.code, name: this.form.name })
      : this.service.createCategory(dto);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Category ${this.data.category ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}

// --- Product UOM & Barcode Dialog ---
@Component({
  selector: 'app-product-uom-barcode-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatIconModule, MatChipsModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>UOMs & Barcodes - {{ data.product.sku }}</h2>
    <mat-dialog-content>
      <h3>Add Unit of Measure</h3>
      <div class="form-fields">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>UOM Code</mat-label>
            <input matInput [(ngModel)]="uomForm.uomCode" placeholder="ea, kg, box, pallet">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Conversion Factor</mat-label>
            <input matInput type="number" [(ngModel)]="uomForm.conversionFactor" placeholder="1">
          </mat-form-field>
        </div>
        <mat-slide-toggle [(ngModel)]="uomForm.isBase">Is Base UOM</mat-slide-toggle>
        <button mat-stroked-button color="primary" (click)="addUom()" [disabled]="!uomForm.uomCode">
          <mat-icon>add</mat-icon> Add UOM
        </button>
      </div>

      <mat-divider style="margin: 16px 0"></mat-divider>

      <h3>Add Barcode</h3>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Barcode</mat-label>
          <input matInput [(ngModel)]="barcodeForm.barcode" placeholder="Scan or enter barcode">
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>UOM (optional)</mat-label>
            <input matInput [(ngModel)]="barcodeForm.uomId" placeholder="UOM code reference">
          </mat-form-field>
          <mat-slide-toggle [(ngModel)]="barcodeForm.isPrimary" style="padding-top:8px">Primary</mat-slide-toggle>
        </div>
        <button mat-stroked-button color="primary" (click)="addBarcode()" [disabled]="!barcodeForm.barcode">
          <mat-icon>add</mat-icon> Add Barcode
        </button>
      </div>

      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    h3 { margin: 0 0 8px; font-size: 16px; font-weight: 500; color: #555; }
    mat-spinner { display: inline-block; }
  `],
})
export class ProductUomBarcodeDialog {
  private service = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProductUomBarcodeDialog>);
  data: { product: Product } = inject(MAT_DIALOG_DATA);

  error = signal('');
  savingUom = false;
  savingBarcode = false;

  uomForm = { uomCode: '', conversionFactor: 1, isBase: false, weight: null as number | null, width: null as number | null, height: null as number | null, length: null as number | null };
  barcodeForm = { barcode: '', uomId: '', isPrimary: false };

  addUom(): void {
    this.savingUom = true;
    this.error.set('');
    const dto: any = { uomCode: this.uomForm.uomCode, conversionFactor: this.uomForm.conversionFactor };
    if (this.uomForm.isBase) dto.isBase = true;
    this.service.addUom(this.data.product.id, dto).subscribe({
      next: () => {
        this.snackBar.open('UOM added', 'Close', { duration: 3000 });
        this.uomForm = { uomCode: '', conversionFactor: 1, isBase: false, weight: null, width: null, height: null, length: null };
        this.savingUom = false;
      },
      error: (err) => { this.error.set(err.error?.message || 'Error adding UOM'); this.savingUom = false; },
    });
  }

  addBarcode(): void {
    this.savingBarcode = true;
    this.error.set('');
    const dto: any = { barcode: this.barcodeForm.barcode };
    if (this.barcodeForm.uomId) dto.uomId = this.barcodeForm.uomId;
    if (this.barcodeForm.isPrimary) dto.isPrimary = true;
    this.service.addBarcode(this.data.product.id, dto).subscribe({
      next: () => {
        this.snackBar.open('Barcode added', 'Close', { duration: 3000 });
        this.barcodeForm = { barcode: '', uomId: '', isPrimary: false };
        this.savingBarcode = false;
      },
      error: (err) => { this.error.set(err.error?.message || 'Error adding barcode'); this.savingBarcode = false; },
    });
  }
}
