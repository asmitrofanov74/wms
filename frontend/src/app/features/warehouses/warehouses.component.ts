import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { WarehousesService } from './warehouses.service';
import { ImportCsvDialog } from './import-csv.dialog';
import { Warehouse, Zone, Location } from '../../shared/models/api-response';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatChipsModule, MatExpansionModule,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  template: `
    <div class="page-header">
      <h1>Warehouses</h1>
    </div>

    <div class="tab-toolbar">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="warehouseSearch" (input)="applyFilter()" placeholder="Search by name or code">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <button mat-flat-button color="primary" (click)="openWarehouseDialog()">
        <mat-icon>add</mat-icon> Add Warehouse
      </button>
    </div>

    <div class="table-container">
      @if (loading()) {
        <div class="loading-shade"><mat-spinner diameter="40"/></div>
      }

      <table mat-table [dataSource]="dataSource" multiTemplateDataRows matSort>
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Code</th>
          <td mat-cell *matCellDef="let w">{{ w.code }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let w">{{ w.name }}</td>
        </ng-container>
        <ng-container matColumnDef="address">
          <th mat-header-cell *matHeaderCellDef>Address</th>
          <td mat-cell *matCellDef="let w">{{ w.address }}</td>
        </ng-container>
        <ng-container matColumnDef="isActive">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Active</th>
          <td mat-cell *matCellDef="let w">
            <mat-icon [style.color]="w.isActive ? '#4caf50' : '#f44336'">
              {{ w.isActive ? 'check_circle' : 'cancel' }}
            </mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="actionEdit">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let w">
            <button mat-icon-button (click)="openWarehouseDialog(w); $event.stopPropagation()" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>
        <ng-container matColumnDef="actionToggle">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let w">
            <button mat-icon-button (click)="toggleWarehouse(w); $event.stopPropagation()" [matTooltip]="w.isActive ? 'Deactivate' : 'Activate'">
              <mat-icon>toggle_on</mat-icon>
            </button>
          </td>
        </ng-container>

        <ng-container matColumnDef="expandedDetail">
          <td mat-cell *matCellDef="let w" [attr.colspan]="columns.length" class="detail-row">
            <div [@detailExpand]="expandedWarehouse()?.id === w.id ? 'expanded' : 'collapsed'" class="detail-content">
              @if (expandedWarehouse()?.id === w.id) {
                <div class="zones-section">
                  <div class="zones-toolbar">
                    <h3>Zones</h3>
                    <div class="zones-actions">
                      <button mat-stroked-button (click)="openImportDialog(w.id)">
                        <mat-icon>upload_file</mat-icon> Import CSV
                      </button>
                      <button mat-stroked-button color="primary" (click)="openZoneDialog(w.id)">
                        <mat-icon>add</mat-icon> Add Zone
                      </button>
                    </div>
                  </div>

                  @if (loadingZones()) {
                    <div class="loading"><mat-spinner diameter="24"/></div>
                  }

                  <mat-accordion>
                    @for (zone of zones(); track zone.id) {
                      <mat-expansion-panel (opened)="loadLocations(zone.id)">
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            <mat-icon>layers</mat-icon> {{ zone.code }} - {{ zone.name }}
                          </mat-panel-title>
                          <mat-panel-description>
                            <mat-chip [color]="zone.isActive ? 'primary' : 'warn'">{{ zone.zoneType }}</mat-chip>
                            @if (expandedZoneId() === zone.id) {
                              <mat-chip>{{ locationCount() }} locations</mat-chip>
                            }
                          </mat-panel-description>
                        </mat-expansion-panel-header>

                        <div class="zone-actions">
                          <button mat-stroked-button (click)="openLocationDialog(w.id, zone.id)">
                            <mat-icon>add</mat-icon> Add Location
                          </button>
                          <button mat-stroked-button (click)="openZoneDialog(w.id, zone)">
                            <mat-icon>edit</mat-icon> Edit Zone
                          </button>
                          <button mat-stroked-button color="warn" (click)="deleteZone(w.id, zone)" [disabled]="zone.zoneType === 'storage' && expandedZoneId() !== null">
                            <mat-icon>delete</mat-icon> Delete
                          </button>
                        </div>

                        <table class="locations-table" mat-table [dataSource]="locations()">
                          <ng-container matColumnDef="code">
                            <th mat-header-cell *matHeaderCellDef>Code</th>
                            <td mat-cell *matCellDef="let l">{{ l.code }}</td>
                          </ng-container>
                          <ng-container matColumnDef="type">
                            <th mat-header-cell *matHeaderCellDef>Type</th>
                            <td mat-cell *matCellDef="let l"><mat-chip>{{ l.locationType }}</mat-chip></td>
                          </ng-container>
                          <ng-container matColumnDef="aisle">
                            <th mat-header-cell *matHeaderCellDef>Aisle</th>
                            <td mat-cell *matCellDef="let l">{{ l.aisle }}</td>
                          </ng-container>
                          <ng-container matColumnDef="rack">
                            <th mat-header-cell *matHeaderCellDef>Rack</th>
                            <td mat-cell *matCellDef="let l">{{ l.rack }}</td>
                          </ng-container>
                          <ng-container matColumnDef="shelf">
                            <th mat-header-cell *matHeaderCellDef>Shelf</th>
                            <td mat-cell *matCellDef="let l">{{ l.shelf }}</td>
                          </ng-container>
                          <ng-container matColumnDef="pickable">
                            <th mat-header-cell *matHeaderCellDef>Pickable</th>
                            <td mat-cell *matCellDef="let l">
                              <mat-icon [style.color]="l.isPickable ? '#4caf50' : '#9e9e9e'">
                                {{ l.isPickable ? 'check' : 'close' }}
                              </mat-icon>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="locEdit">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let l">
                              <button mat-icon-button (click)="openLocationDialog(w.id, zone.id, l)" matTooltip="Edit">
                                <mat-icon>edit</mat-icon>
                              </button>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="locDelete">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let l">
                              <button mat-icon-button (click)="deleteLocation(l)" matTooltip="Delete">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="locationColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: locationColumns;"></tr>
                          @if (locations().length === 0) {
                            <tr class="no-data-row">
                              <td [attr.colspan]="locationColumns.length">No locations in this zone</td>
                            </tr>
                          }
                        </table>
                      </mat-expansion-panel>
                    }
                    @if (zones().length === 0) {
                      <div class="empty-state">No zones defined. Click "Add Zone" to create one.</div>
                    }
                  </mat-accordion>
                </div>
              }
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="warehouse-row"
          [class.expanded]="expandedWarehouse()?.id === row.id"
          (click)="toggleExpand(row)">
        </tr>
        <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row-no-hover"></tr>
      </table>

      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .page-header h1 { margin: 0 0 16px; font-size: 28px; font-weight: 500; }
    .tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; }
    .tab-toolbar mat-form-field { width: 320px; }
    .table-container { position: relative; }
    .loading-shade { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 1; }
    .loading { display: flex; justify-content: center; padding: 16px; }
    table { width: 100%; }
    .warehouse-row { cursor: pointer; }
    .warehouse-row:hover { background: #f5f5f5; }
    .warehouse-row.expanded { background: #e3f2fd; }
    .detail-row { padding: 0 !important; }
    .detail-row-no-hover { background: transparent !important; }
    .detail-row-no-hover:hover { background: transparent !important; }
    .detail-row-no-hover td { padding: 0 !important; border-bottom: none !important; }
    .detail-content { overflow: hidden; background: #fafafa; }
    .zones-section { padding: 16px 24px; }
    .zones-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .zones-toolbar h3 { margin: 0; font-size: 18px; font-weight: 500; }
    .zones-actions { display: flex; gap: 8px; }
    .zone-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .locations-table { width: 100%; margin-top: 8px; }
    .locations-table th { font-size: 12px; font-weight: 600; color: #666; }
    .no-data-row td { text-align: center; padding: 16px; color: #999; font-style: italic; }
    .empty-state { text-align: center; padding: 24px; color: #999; }
    .mat-column-actionEdit { width: 48px; text-align: center; }
    .mat-column-actionToggle { width: 48px; text-align: center; }
    .mat-column-isActive { width: 60px; text-align: center; }
    .mat-column-pickable { width: 60px; text-align: center; }
  `],
})
export class WarehousesComponent implements OnInit {
  private service = inject(WarehousesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  loadingZones = signal(false);

  expandedWarehouse = signal<Warehouse | null>(null);
  expandedZoneId = signal<string | null>(null);
  locationCount = signal(0);
  warehouseSearch = '';

  warehouses = signal<Warehouse[]>([]);
  zones = signal<Zone[]>([]);
  locations = signal<Location[]>([]);

  columns = ['code', 'name', 'address', 'isActive', 'actionEdit', 'actionToggle'];
  locationColumns = ['code', 'type', 'aisle', 'rack', 'shelf', 'pickable', 'locEdit', 'locDelete'];

  dataSource = new MatTableDataSource<Warehouse>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getWarehouses().subscribe({
      next: (data) => {
        this.warehouses.set(data);
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.warehouseSearch.trim().toLowerCase();
  }

  toggleExpand(warehouse: Warehouse): void {
    if (this.expandedWarehouse()?.id === warehouse.id) {
      this.expandedWarehouse.set(null);
    } else {
      this.expandedWarehouse.set(warehouse);
      this.loadZones(warehouse.id);
    }
  }

  loadZones(warehouseId: string): void {
    this.loadingZones.set(true);
    this.service.getZones(warehouseId).subscribe({
      next: (data) => {
        this.zones.set(data);
        this.loadingZones.set(false);
      },
      error: () => this.loadingZones.set(false),
    });
  }

  loadLocations(zoneId: string): void {
    this.expandedZoneId.set(zoneId);
    this.service.getLocationsByZone(zoneId).subscribe({
      next: (data) => {
        this.locations.set(data);
        this.locationCount.set(data.length);
      },
      error: () => this.locations.set([]),
    });
  }

  openWarehouseDialog(warehouse?: Warehouse): void {
    const ref = this.dialog.open(WarehouseFormDialog, {
      width: '450px',
      data: { warehouse },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  toggleWarehouse(warehouse: Warehouse): void {
    this.service.toggleWarehouse(warehouse.id).subscribe({
      next: () => {
        this.snackBar.open(`Warehouse ${warehouse.isActive ? 'deactivated' : 'activated'}`, 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Failed to update warehouse', 'Close', { duration: 3000 }),
    });
  }

  openZoneDialog(warehouseId: string, zone?: Zone): void {
    const ref = this.dialog.open(ZoneFormDialog, {
      width: '450px',
      data: { warehouseId, zone },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadZones(warehouseId);
    });
  }

  deleteZone(warehouseId: string, zone: Zone): void {
    if (confirm(`Delete zone ${zone.name}?`)) {
      this.service.deleteZone(warehouseId, zone.id).subscribe({
        next: () => {
          this.snackBar.open('Zone deleted', 'Close', { duration: 3000 });
          this.loadZones(warehouseId);
        },
        error: () => this.snackBar.open('Failed to delete zone', 'Close', { duration: 3000 }),
      });
    }
  }

  openLocationDialog(warehouseId: string, zoneId: string, location?: Location): void {
    const ref = this.dialog.open(LocationFormDialog, {
      width: '500px',
      data: { warehouseId, zoneId, location },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadLocations(this.expandedZoneId()!);
    });
  }

  openImportDialog(warehouseId: string): void {
    const ref = this.dialog.open(ImportCsvDialog, {
      width: '520px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        if (this.expandedZoneId()) {
          this.loadLocations(this.expandedZoneId()!);
        } else if (this.expandedWarehouse()) {
          this.loadZones(this.expandedWarehouse()!.id);
        }
      }
    });
  }

  deleteLocation(location: Location): void {
    if (confirm(`Delete location ${location.code}?`)) {
      this.service.deleteLocation(location.id).subscribe({
        next: () => {
          this.snackBar.open('Location deleted', 'Close', { duration: 3000 });
          this.loadLocations(this.expandedZoneId()!);
        },
        error: () => this.snackBar.open('Failed to delete location', 'Close', { duration: 3000 }),
      });
    }
  }
}

// --- Warehouse Form Dialog ---
@Component({
  selector: 'app-warehouse-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.warehouse ? 'Edit Warehouse' : 'Add Warehouse' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="form.code" required maxlength="20" [disabled]="!!data.warehouse">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" required maxlength="200">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <input matInput [(ngModel)]="form.address">
        </mat-form-field>
      </div>
      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.code || !form.name">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.warehouse ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class WarehouseFormDialog implements OnInit {
  private service = inject(WarehousesService);
  private dialogRef = inject(MatDialogRef<WarehouseFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { warehouse?: Warehouse } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');
  form = { code: '', name: '', address: '' };

  ngOnInit(): void {
    if (this.data.warehouse) {
      this.form.code = this.data.warehouse.code;
      this.form.name = this.data.warehouse.name;
      this.form.address = this.data.warehouse.address;
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const obs = this.data.warehouse
      ? this.service.updateWarehouse(this.data.warehouse.id, this.form)
      : this.service.createWarehouse(this.form);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Warehouse ${this.data.warehouse ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}

// --- Zone Form Dialog ---
@Component({
  selector: 'app-zone-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
    TitleCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.zone ? 'Edit Zone' : 'Add Zone' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="form.code" required maxlength="20">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" required maxlength="100">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Zone Type</mat-label>
          <mat-select [(ngModel)]="form.zoneType" required>
            @for (t of zoneTypes; track t) {
              <mat-option [value]="t">{{ t | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.code || !form.name || !form.zoneType">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.zone ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class ZoneFormDialog implements OnInit {
  private service = inject(WarehousesService);
  private dialogRef = inject(MatDialogRef<ZoneFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { warehouseId: string; zone?: Zone } = inject(MAT_DIALOG_DATA);

  zoneTypes = ['storage', 'picking', 'receiving', 'shipping', 'overflow'];
  saving = signal(false);
  error = signal('');
  form = { code: '', name: '', zoneType: '' };

  ngOnInit(): void {
    if (this.data.zone) {
      this.form.code = this.data.zone.code;
      this.form.name = this.data.zone.name;
      this.form.zoneType = this.data.zone.zoneType;
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const obs = this.data.zone
      ? this.service.updateZone(this.data.warehouseId, this.data.zone.id, this.form)
      : this.service.createZone(this.data.warehouseId, this.form);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Zone ${this.data.zone ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.error.set(err.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}

// --- Location Form Dialog ---
@Component({
  selector: 'app-location-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatSnackBarModule, TitleCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.location ? 'Edit Location' : 'Add Location' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="form.code" required maxlength="50">
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Aisle</mat-label>
            <input matInput [(ngModel)]="form.aisle">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Rack</mat-label>
            <input matInput [(ngModel)]="form.rack">
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Shelf</mat-label>
            <input matInput [(ngModel)]="form.shelf">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Bin</mat-label>
            <input matInput [(ngModel)]="form.bin">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Location Type</mat-label>
          <mat-select [(ngModel)]="form.locationType" required>
            @for (t of locationTypes; track t) {
              <mat-option [value]="t">{{ t | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Max Weight</mat-label>
            <input matInput type="number" [(ngModel)]="form.maxWeight">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max Volume</mat-label>
            <input matInput type="number" [(ngModel)]="form.maxVolume">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Barcode</mat-label>
          <input matInput [(ngModel)]="form.barcode">
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="form.isPickable">Pickable</mat-slide-toggle>
      </div>
      @if (error()) { <div class="error-msg">{{ error() }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.code || !form.locationType">
        @if (saving()) { <mat-spinner diameter="20"/> }
        {{ data.location ? 'Update' : 'Create' }}
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
export class LocationFormDialog implements OnInit {
  private service = inject(WarehousesService);
  private dialogRef = inject(MatDialogRef<LocationFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: { warehouseId: string; zoneId: string; location?: Location } = inject(MAT_DIALOG_DATA);

  locationTypes = ['bin', 'bulk', 'floor', 'shelf', 'pallet'];
  saving = signal(false);
  error = signal('');
  form = { code: '', aisle: '', rack: '', shelf: '', bin: '', maxWeight: 0, maxVolume: 0, locationType: '', isPickable: true, barcode: '' };

  ngOnInit(): void {
    if (this.data.location) {
      this.form.code = this.data.location.code;
      this.form.aisle = this.data.location.aisle;
      this.form.rack = this.data.location.rack;
      this.form.shelf = this.data.location.shelf;
      this.form.bin = this.data.location.bin;
      this.form.maxWeight = this.data.location.maxWeight;
      this.form.maxVolume = this.data.location.maxVolume;
      this.form.locationType = this.data.location.locationType;
      this.form.isPickable = this.data.location.isPickable;
      this.form.barcode = this.data.location.barcode;
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const dto = { ...this.form, zoneId: this.data.zoneId, maxWeight: this.form.maxWeight || undefined, maxVolume: this.form.maxVolume || undefined };
    const obs = this.data.location
      ? this.service.updateLocation(this.data.location.id, dto)
      : this.service.createLocation(dto);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Location ${this.data.location ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => { this.error.set(err?.error?.message || 'Error'); this.saving.set(false); },
    });
  }
}
