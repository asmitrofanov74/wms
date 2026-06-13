import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { RoleFormDialog } from './role-form.dialog';
import { AdminService } from './admin.service';
import { Role, Permission } from '../../shared/models/api-response';

describe('RoleFormDialog', () => {
  let component: RoleFormDialog;
  let fixture: ComponentFixture<RoleFormDialog>;
  let adminService: jasmine.SpyObj<AdminService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RoleFormDialog>>;

  const mockPermissions: Permission[] = [
    { id: 'p1', resource: 'users', action: 'create', description: '' },
    { id: 'p2', resource: 'users', action: 'read', description: '' },
    { id: 'p3', resource: 'products', action: 'create', description: '' },
  ];

  beforeEach(async () => {
    const adminSpy = jasmine.createSpyObj('AdminService', ['getPermissions', 'createRole', 'updateRole', 'assignRolePermissions']);
    adminSpy.getPermissions.and.returnValue(of(mockPermissions));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RoleFormDialog],
      providers: [
        provideNoopAnimations(),
        { provide: AdminService, useValue: adminSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleFormDialog);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RoleFormDialog>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load permissions on init', () => {
    expect(adminService.getPermissions).toHaveBeenCalled();
    expect(component.allPermissions().length).toBe(3);
  });

  it('should group permissions by resource', () => {
    const groups = component.permissionGroups();
    expect(groups.length).toBe(2);
    expect(groups[0].resource).toBe('users');
    expect(groups[1].resource).toBe('products');
  });

  it('should toggle permission selection', () => {
    component.togglePermission('p1');
    expect(component.selectedPermissionIds()).toContain('p1');

    component.togglePermission('p1');
    expect(component.selectedPermissionIds()).not.toContain('p1');
  });

  it('should count selected permissions per resource', () => {
    component.togglePermission('p1');
    component.togglePermission('p2');
    expect(component.selectedCountByResource('users')).toBe(2);
    expect(component.selectedCountByResource('products')).toBe(0);
  });

  it('should create role and assign permissions', () => {
    component.form.name = 'New Role';
    component.togglePermission('p1');

    adminService.createRole.and.returnValue(of({ id: 'r-new', name: 'New Role' } as Role));
    adminService.assignRolePermissions.and.returnValue(of(void 0));

    component.save();

    expect(adminService.createRole).toHaveBeenCalledWith({ name: 'New Role', description: '' });
    expect(adminService.assignRolePermissions).toHaveBeenCalledWith('r-new', ['p1']);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should handle role creation error', () => {
    component.form.name = 'New Role';
    adminService.createRole.and.returnValue(throwError(() => ({ error: { message: 'Name exists' } })));

    component.save();

    expect(component.error()).toBe('Name exists');
    expect(component.saving()).toBe(false);
  });
});

describe('RoleFormDialog (edit mode)', () => {
  let component: RoleFormDialog;
  let fixture: ComponentFixture<RoleFormDialog>;
  let adminService: jasmine.SpyObj<AdminService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RoleFormDialog>>;

  const mockPermissions: Permission[] = [
    { id: 'p1', resource: 'users', action: 'read', description: '' },
  ];

  const mockRole: Role = {
    id: 'r1', name: 'Editor', description: 'Can edit', isSystem: false,
    permissions: ['users:read'], createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(async () => {
    const adminSpy = jasmine.createSpyObj('AdminService', ['getPermissions', 'createRole', 'updateRole', 'assignRolePermissions']);
    adminSpy.getPermissions.and.returnValue(of(mockPermissions));
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RoleFormDialog],
      providers: [
        provideNoopAnimations(),
        { provide: AdminService, useValue: adminSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { role: mockRole } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleFormDialog);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RoleFormDialog>>;
    fixture.detectChanges();
  });

  it('should pre-populate form in edit mode', () => {
    expect(component.form.name).toBe('Editor');
    expect(component.form.description).toBe('Can edit');
  });

  it('should pre-select permissions matching role permissions', () => {
    expect(component.selectedPermissionIds()).toContain('p1');
  });

  it('should update role and reassign permissions', () => {
    adminService.updateRole.and.returnValue(of({ ...mockRole, name: 'Updated' } as Role));
    adminService.assignRolePermissions.and.returnValue(of(void 0));

    component.form.name = 'Updated';
    component.save();

    expect(adminService.updateRole).toHaveBeenCalledWith('r1', { name: 'Updated', description: 'Can edit' });
    expect(adminService.assignRolePermissions).toHaveBeenCalledWith('r1', ['p1']);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
