import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { WarehousesService } from './warehouses.service';

@Component({
  selector: 'app-import-csv-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>Import Locations from CSV</h2>

    <mat-dialog-content>
      @if (!result()) {
        <div class="drop-zone" 
             (dragover)="$event.preventDefault()" 
             (drop)="onFileDrop($event)"
             (click)="fileInput.click()"
             [class.has-file]="!!selectedFile()">
          <input #fileInput type="file" accept=".csv" (change)="onFileSelected($event)" hidden>
          @if (selectedFile()) {
            <mat-icon>description</mat-icon>
            <p class="file-name">{{ selectedFile()?.name }}</p>
            <p class="file-size">{{ fileSizeKb() }} KB</p>
          } @else {
            <mat-icon>cloud_upload</mat-icon>
            <p>Drag & drop a CSV file here, or click to browse</p>
          }
        </div>

        <div class="format-info">
          <p><strong>Required columns:</strong> zoneId, code, locationType</p>
          <p><strong>Optional columns:</strong> aisle, rack, shelf, bin, isPickable, maxWeight, maxVolume, barcode</p>
        </div>
      }

      @if (uploading()) {
        <div class="uploading">
          <mat-spinner diameter="32"/>
          <p>Importing locations...</p>
        </div>
      }

      @if (result(); as r) {
        <div class="result">
          <mat-icon [color]="r.errors.length === 0 ? 'primary' : 'warn'">
            {{ r.errors.length === 0 ? 'check_circle' : 'warning' }}
          </mat-icon>
          <p class="result-text">{{ r.imported }} locations imported</p>
          @if (r.errors.length > 0) {
            <p class="result-errors">{{ r.errors.length }} errors</p>
            <table mat-table [dataSource]="r.errors" class="errors-table">
              <ng-container matColumnDef="error">
                <th mat-header-cell *matHeaderCellDef>Errors</th>
                <td mat-cell *matCellDef="let e">{{ e }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['error']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['error'];"></tr>
            </table>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!result()) {
        <button mat-button mat-dialog-close [disabled]="uploading()">Cancel</button>
        <button mat-flat-button color="primary" (click)="upload()" [disabled]="!selectedFile() || uploading()">
          @if (uploading()) { <mat-spinner diameter="20"/> }
          Import
        </button>
      } @else {
        <button mat-flat-button mat-dialog-close>Close</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .drop-zone { border: 2px dashed #bbb; border-radius: 8px; padding: 32px; text-align: center; cursor: pointer; margin-bottom: 16px; transition: all .2s; }
    .drop-zone:hover, .drop-zone.has-file { border-color: #1976d2; background: #f5f8ff; }
    .drop-zone mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1976d2; }
    .file-name { font-weight: 500; margin: 8px 0 0; }
    .file-size { color: #666; font-size: 13px; margin: 2px 0 0; }
    .format-info { background: #f5f5f5; border-radius: 6px; padding: 12px 16px; font-size: 13px; }
    .format-info p { margin: 4px 0; }
    .uploading { text-align: center; padding: 24px; }
    .uploading mat-spinner { margin: 0 auto 8px; }
    .result { text-align: center; padding: 16px; }
    .result mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .result-text { font-size: 18px; font-weight: 500; margin: 8px 0 4px; }
    .result-errors { color: #f44336; margin: 4px 0 12px; }
    .errors-table { width: 100%; margin-top: 8px; }
    .errors-table td { font-size: 13px; color: #f44336; }
    mat-spinner { display: inline-block; }
  `],
})
export class ImportCsvDialog {
  private service = inject(WarehousesService);
  private dialogRef = inject(MatDialogRef<ImportCsvDialog>);
  private snackBar = inject(MatSnackBar);

  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  result = signal<{ imported: number; errors: string[] } | null>(null);

  fileSizeKb(): number {
    return Math.round((this.selectedFile()?.size ?? 0) / 1024);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile.set(input.files[0]);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.name.endsWith('.csv')) this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.service.importLocationsCsv(file).subscribe({
      next: (res) => {
        this.result.set(res);
        this.uploading.set(false);
        if (res.errors.length === 0) {
          this.snackBar.open(`${res.imported} locations imported`, 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Import failed', 'Close', { duration: 3000 });
        this.uploading.set(false);
      },
    });
  }
}
