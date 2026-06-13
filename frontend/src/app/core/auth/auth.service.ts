import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, User, RegisterRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<LoginResponse>('/api/v1/auth/login', credentials)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.accessTokenKey, res.accessToken);
          localStorage.setItem(this.refreshTokenKey, res.refreshToken);
        }),
        switchMap(() => this.loadCurrentUser()),
      );
  }

  register(dto: RegisterRequest): Observable<User> {
    return this.http
      .post<LoginResponse>('/api/v1/auth/register', dto)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.accessTokenKey, res.accessToken);
          localStorage.setItem(this.refreshTokenKey, res.refreshToken);
        }),
        switchMap(() => this.loadCurrentUser()),
      );
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    return this.http
      .post<LoginResponse>('/api/v1/auth/refresh', { refreshToken })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.accessTokenKey, res.accessToken);
          localStorage.setItem(this.refreshTokenKey, res.refreshToken);
        }),
      );
  }

  loadCurrentUser(): Observable<User> {
    const token = this.getAccessToken();
    const opts: { headers?: HttpHeaders } = {};
    if (token) {
      opts.headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return this.http.get<User>('/api/v1/auth/me', opts).pipe(
      tap((user) => this.user.set(user)),
      catchError(() => {
        return this.refreshToken().pipe(
          switchMap((res) => {
            const retryOpts = {
              headers: new HttpHeaders({ Authorization: `Bearer ${res.accessToken}` }),
            };
            return this.http.get<User>('/api/v1/auth/me', retryOpts).pipe(
              tap((u) => this.user.set(u)),
              catchError(() => {
                this.logout();
                return throwError(() => new Error('Session expired'));
              }),
            );
          }),
          catchError(() => {
            this.logout();
            return throwError(() => new Error('Session expired'));
          }),
        );
      }),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  hasRole(role: string): boolean {
    return this.user()?.roles?.includes(role) ?? false;
  }
}
