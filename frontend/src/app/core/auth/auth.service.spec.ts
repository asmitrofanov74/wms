import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginResponse } from '../../shared/models/api-response';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should store tokens and load user on successful login', () => {
      const credentials = { email: 'admin@wms.com', password: 'password123' };
      const loginResponse: LoginResponse = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne('/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(loginResponse);

      expect(localStorage.getItem('access_token')).toBe('at');
      expect(localStorage.getItem('refresh_token')).toBe('rt');

      const meReq = httpMock.expectOne('/api/v1/auth/me');
      expect(meReq.request.method).toBe('GET');
    });

    it('should not set user on login error', () => {
      const credentials = { email: 'bad@wms.com', password: 'wrong' };

      service.login(credentials).subscribe({
        error: () => {},
      });

      const req = httpMock.expectOne('/api/v1/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear tokens and user, navigate to login', () => {
      localStorage.setItem('access_token', 'at');
      localStorage.setItem('refresh_token', 'rt');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and store new ones', () => {
      localStorage.setItem('refresh_token', 'old-rt');
      const refreshResponse: LoginResponse = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 900 };

      service.refreshToken().subscribe();

      const req = httpMock.expectOne('/api/v1/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-rt' });
      req.flush(refreshResponse);

      expect(localStorage.getItem('access_token')).toBe('new-at');
      expect(localStorage.getItem('refresh_token')).toBe('new-rt');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', () => {
      expect(service.getAccessToken()).toBeNull();
      localStorage.setItem('access_token', 'my-token');
      expect(service.getAccessToken()).toBe('my-token');
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      service.user.set({ id: '1', email: 'admin@wms.com', firstName: 'Admin', lastName: '', isActive: true, roles: ['Admin'], createdAt: new Date(), updatedAt: new Date() });
      expect(service.hasRole('Admin')).toBe(true);
      expect(service.hasRole('Operator')).toBe(false);
    });

    it('should return false when no user is set', () => {
      expect(service.hasRole('Admin')).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is set', () => {
      service.user.set({ id: '1', email: 'admin@wms.com', firstName: '', lastName: '', isActive: true, roles: [], createdAt: new Date(), updatedAt: new Date() });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is null', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
