import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error on login failure', () => {
    component.email = 'bad@wms.com';
    component.password = 'wrong';
    auth.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'bad@wms.com', password: 'wrong' });
    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
  });

  it('should navigate to dashboard on successful login', () => {
    component.email = 'admin@wms.com';
    component.password = 'password123';
    auth.login.and.returnValue(of({ accessToken: 'at', refreshToken: 'rt', expiresIn: 900 }));

    component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'admin@wms.com', password: 'password123' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not submit login when email or password is empty', () => {
    component.email = '';
    component.password = '';
    component.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard on successful registration', () => {
    component.mode.set('register');
    component.email = 'new@wms.com';
    component.password = 'password123';
    component.firstName = 'New';
    component.lastName = 'User';
    component.confirmPassword = 'password123';
    auth.register.and.returnValue(of({ accessToken: 'at', refreshToken: 'rt', expiresIn: 900 }));

    component.onRegister();

    expect(auth.register).toHaveBeenCalledWith({
      email: 'new@wms.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error when passwords do not match', () => {
    component.mode.set('register');
    component.email = 'test@wms.com';
    component.password = 'password123';
    component.firstName = 'Test';
    component.lastName = 'User';
    component.confirmPassword = 'different';
    component.onRegister();
    expect(component.error).toBe('Passwords do not match');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should show error on registration failure', () => {
    component.mode.set('register');
    component.email = 'existing@wms.com';
    component.password = 'password123';
    component.firstName = 'Existing';
    component.lastName = 'User';
    component.confirmPassword = 'password123';
    auth.register.and.returnValue(throwError(() => ({ error: { message: 'Email already registered' } })));

    component.onRegister();

    expect(component.error).toBe('Email already registered');
    expect(component.loading).toBe(false);
  });
});
