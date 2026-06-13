import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { User, Role, Permission } from '../../shared/models/api-response';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should get users', () => {
    service.getUsers().subscribe();
    const req = http.expectOne('/api/v1/users');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get user by id', () => {
    service.getUser('1').subscribe();
    const req = http.expectOne('/api/v1/users/1');
    expect(req.request.method).toBe('GET');
    req.flush({} as User);
  });

  it('should create user', () => {
    service.createUser({ email: 'a@b.com', password: 'pw', firstName: 'A', lastName: 'B' }).subscribe();
    const req = http.expectOne('/api/v1/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pw', firstName: 'A', lastName: 'B' });
    req.flush({} as User);
  });

  it('should update user', () => {
    service.updateUser('1', { firstName: 'New' }).subscribe();
    const req = http.expectOne('/api/v1/users/1');
    expect(req.request.method).toBe('PUT');
    req.flush({} as User);
  });

  it('should toggle user active status', () => {
    service.toggleActive('1').subscribe();
    const req = http.expectOne('/api/v1/users/1/activate');
    expect(req.request.method).toBe('PATCH');
    req.flush({} as User);
  });

  it('should delete user', () => {
    service.deleteUser('1').subscribe();
    const req = http.expectOne('/api/v1/users/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get roles', () => {
    service.getRoles().subscribe();
    const req = http.expectOne('/api/v1/roles');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get role by id', () => {
    service.getRole('1').subscribe();
    const req = http.expectOne('/api/v1/roles/1');
    expect(req.request.method).toBe('GET');
    req.flush({} as Role);
  });

  it('should create role', () => {
    service.createRole({ name: 'Test', description: 'desc' }).subscribe();
    const req = http.expectOne('/api/v1/roles');
    expect(req.request.method).toBe('POST');
    req.flush({} as Role);
  });

  it('should update role', () => {
    service.updateRole('1', { name: 'Updated' }).subscribe();
    const req = http.expectOne('/api/v1/roles/1');
    expect(req.request.method).toBe('PUT');
    req.flush({} as Role);
  });

  it('should delete role', () => {
    service.deleteRole('1').subscribe();
    const req = http.expectOne('/api/v1/roles/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get role permissions', () => {
    service.getRolePermissions('1').subscribe();
    const req = http.expectOne('/api/v1/roles/1/permissions');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should assign role permissions', () => {
    service.assignRolePermissions('1', ['p1', 'p2']).subscribe();
    const req = http.expectOne('/api/v1/roles/1/permissions');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ permissionIds: ['p1', 'p2'] });
    req.flush(null);
  });

  it('should get all permissions', () => {
    service.getPermissions().subscribe();
    const req = http.expectOne('/api/v1/roles/permissions');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
