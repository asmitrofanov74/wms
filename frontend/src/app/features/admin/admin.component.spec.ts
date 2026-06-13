import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminService } from './admin.service';
import { User, Role } from '../../shared/models/api-response';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminService: jasmine.SpyObj<AdminService>;

  const mockUsers: User[] = [
    { id: '1', email: 'admin@wms.com', firstName: 'Admin', lastName: 'User', isActive: true, roles: ['Admin'], createdAt: new Date(), updatedAt: new Date() },
    { id: '2', email: 'user@wms.com', firstName: 'Normal', lastName: 'User', isActive: false, roles: ['Operator'], createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockRoles: Role[] = [
    { id: 'r1', name: 'Admin', description: 'Full access', isSystem: true, permissions: ['users:*'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'r2', name: 'Operator', description: 'Limited access', isSystem: false, permissions: ['products:read'], createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(async () => {
    const adminSpy = jasmine.createSpyObj('AdminService', ['getUsers', 'getRoles', 'toggleActive', 'deleteUser', 'deleteRole']);
    adminSpy.getUsers.and.returnValue(of(mockUsers));
    adminSpy.getRoles.and.returnValue(of(mockRoles));

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AdminService, useValue: adminSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(adminService.getUsers).toHaveBeenCalled();
    expect(component.users().length).toBe(2);
  });

  it('should load roles on init', () => {
    expect(adminService.getRoles).toHaveBeenCalled();
    expect(component.roles().length).toBe(2);
  });

  it('should populate user data source', () => {
    expect(component.userDataSource.data.length).toBe(2);
  });

  it('should populate role data source', () => {
    expect(component.roleDataSource.data.length).toBe(2);
  });

  it('should filter users by search term', () => {
    component.userSearch = 'admin';
    component.applyUserFilter();
    expect(component.userDataSource.filter).toBe('admin');
  });

  it('should toggle user active status', () => {
    adminService.toggleActive.and.returnValue(of({} as User));
    component.toggleActive(mockUsers[1]);
    expect(adminService.toggleActive).toHaveBeenCalledWith('2');
  });

  it('should delete user', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.deleteUser.and.returnValue(of(void 0));
    component.deleteUser(mockUsers[1]);
    expect(adminService.deleteUser).toHaveBeenCalledWith('2');
  });

  it('should delete role', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.deleteRole.and.returnValue(of(void 0));
    component.deleteRole(mockRoles[1]);
    expect(adminService.deleteRole).toHaveBeenCalledWith('r2');
  });
});
