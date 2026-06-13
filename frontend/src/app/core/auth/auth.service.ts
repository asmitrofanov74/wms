import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../../shared/models/api-response';

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

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/v1/auth/login', credentials)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.accessTokenKey, res.accessToken);
          localStorage.setItem(this.refreshTokenKey, res.refreshToken);
          this.loadCurrentUser();
        }),
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

  loadCurrentUser(): void {
    this.http.get<User>('/api/v1/auth/me').subscribe({
      next: (user) => this.user.set(user),
      error: () => this.logout(),
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  hasRole(role: string): boolean {
    return this.user()?.roles?.includes(role) ?? false;
  }
}
