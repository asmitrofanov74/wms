import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ImportCsvDialog } from './import-csv.dialog';
import { WarehousesService } from './warehouses.service';

describe('ImportCsvDialog', () => {
  let component: ImportCsvDialog;
  let fixture: ComponentFixture<ImportCsvDialog>;
  let service: jasmine.SpyObj<WarehousesService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ImportCsvDialog>>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('WarehousesService', ['importLocationsCsv']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ImportCsvDialog],
      providers: [
        provideNoopAnimations(),
        { provide: WarehousesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportCsvDialog);
    component = fixture.componentInstance;
    service = TestBed.inject(WarehousesService) as jasmine.SpyObj<WarehousesService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ImportCsvDialog>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show no file selected initially', () => {
    expect(component.selectedFile()).toBeNull();
  });

  it('should set selected file on file selection', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const event = { target: { files: [file] } } as any;
    component.onFileSelected(event);
    expect(component.selectedFile()).toBe(file);
  });

  it('should set selected file on drop', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const event = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
    component.onFileDrop(event);
    expect(component.selectedFile()).toBe(file);
  });

  it('should not accept non-CSV files on drop', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const event = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
    component.onFileDrop(event);
    expect(component.selectedFile()).toBeNull();
  });

  it('should calculate file size in KB', () => {
    const file = new File(['x'.repeat(2048)], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    expect(component.fileSizeKb()).toBe(2);
  });

  it('should return 0 KB when no file selected', () => {
    expect(component.fileSizeKb()).toBe(0);
  });

  it('should upload file and show result on success', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    service.importLocationsCsv.and.returnValue(of({ imported: 5, errors: [] }));

    component.upload();

    expect(service.importLocationsCsv).toHaveBeenCalledWith(file);
    expect(component.result()).toEqual({ imported: 5, errors: [] });
    expect(component.uploading()).toBe(false);
  });

  it('should upload file and show errors on partial success', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    service.importLocationsCsv.and.returnValue(of({ imported: 3, errors: ['Row 2: invalid zone'] }));

    component.upload();

    expect(component.result()).toEqual({ imported: 3, errors: ['Row 2: invalid zone'] });
  });

  it('should handle upload error', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    service.importLocationsCsv.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));

    component.upload();

    expect(component.uploading()).toBe(false);
  });

  it('should not upload when no file is selected', () => {
    component.upload();
    expect(service.importLocationsCsv).not.toHaveBeenCalled();
  });
});
