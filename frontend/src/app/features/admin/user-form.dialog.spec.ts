import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { UserFormDialog } from './user-form.dialog';
import { AdminService } from './admin.service';
import { User, Role } from '../../shared/models/api-response';

describe('UserFormDialog', () => {
  let component: UserFormDialog;
  let fixture: ComponentFixture<UserFormDialog>;
  let adminService: jasmine.SpyObj<AdminService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<UserFormDialog>>;

  const mockRoles: Role[] = [
    { id: 'r1', name: 'Admin', description: '', isSystem: true, permissions: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'r2', name: 'Operator', description: '', isSystem: false, permissions: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockUser: User = {
    id: '1', email: 'user@wms.com', firstName: 'Test', lastName: 'User',
    isActive: true, roles: ['Operator'], createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(async () => {
    const adminSpy = jasmine.createSpyObj('AdminService', ['createUser', 'updateUser']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [UserFormDialog],
      providers: [
        provideNoopAnimations(),
        { provide: AdminService, useValue: adminSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { roles: mockRoles } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormDialog);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UserFormDialog>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form for new user', () => {
    expect(component.form.email).toBe('');
    expect(component.form.password).toBe('');
    expect(component.form.firstName).toBe('');
    expect(component.form.lastName).toBe('');
    expect(component.form.roleIds).toEqual([]);
  });

  it('should return valid() = false when required fields are empty', () => {
    expect(component.valid()).toBe(false);
  });

  it('should return valid() = true when all required fields are filled', () => {
    component.form.email = 'a@b.com';
    component.form.password = 'password123';
    component.form.firstName = 'John';
    component.form.lastName = 'Doe';
    expect(component.valid()).toBe(true);
  });

  it('should create user on save', () => {
    component.form.email = 'new@wms.com';
    component.form.password = 'pw';
    component.form.firstName = 'New';
    component.form.lastName = 'User';
    component.form.roleIds = ['r2'];

    adminService.createUser.and.returnValue(of({} as User));

    component.save();

    expect(adminService.createUser).toHaveBeenCalledWith({
      email: 'new@wms.com',
      password: 'pw',
      firstName: 'New',
      lastName: 'User',
      roleIds: ['r2'],
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should handle create user error', () => {
    component.form.email = 'new@wms.com';
    component.form.password = 'pw';
    component.form.firstName = 'New';
    component.form.lastName = 'User';

    adminService.createUser.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));

    component.save();

    expect(component.error()).toBe('Email already exists');
    expect(component.saving()).toBe(false);
  });
});

describe('UserFormDialog (edit mode)', () => {
  let component: UserFormDialog;
  let fixture: ComponentFixture<UserFormDialog>;
  let adminService: jasmine.SpyObj<AdminService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<UserFormDialog>>;

  const mockRoles: Role[] = [{ id: 'r1', name: 'Admin', description: '', isSystem: true, permissions: [], createdAt: new Date(), updatedAt: new Date() }];
  const mockUser: User = { id: '1', email: 'user@wms.com', firstName: 'Test', lastName: 'User', isActive: true, roles: ['Admin'], createdAt: new Date(), updatedAt: new Date() };

  beforeEach(async () => {
    const adminSpy = jasmine.createSpyObj('AdminService', ['createUser', 'updateUser']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [UserFormDialog],
      providers: [
        provideNoopAnimations(),
        { provide: AdminService, useValue: adminSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { user: mockUser, roles: mockRoles } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormDialog);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UserFormDialog>>;
    fixture.detectChanges();
  });

  it('should pre-populate form in edit mode', () => {
    expect(component.form.email).toBe('user@wms.com');
    expect(component.form.firstName).toBe('Test');
    expect(component.form.lastName).toBe('User');
  });

  it('should update user on save', () => {
    component.form.firstName = 'Updated';
    adminService.updateUser.and.returnValue(of({} as User));

    component.save();

    expect(adminService.updateUser).toHaveBeenCalledWith('1', {
      email: 'user@wms.com',
      firstName: 'Updated',
      lastName: 'User',
      roleIds: undefined,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
