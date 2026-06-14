import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <mat-icon class="logo-icon">warehouse</mat-icon>
          <h1>WMS</h1>
          <p class="subtitle">Warehouse Management System</p>
        </div>

        <div class="toggle-tabs">
          <button class="toggle-btn" [class.active]="mode() === 'login'" (click)="mode.set('login')">
            <mat-icon>login</mat-icon> Sign In
          </button>
          <button class="toggle-btn" [class.active]="mode() === 'register'" (click)="mode.set('register')">
            <mat-icon>person_add</mat-icon> Sign Up
          </button>
        </div>

        <div class="form-wrapper">
          @if (loading) {
            <div class="loading-overlay">
              <mat-spinner diameter="40"></mat-spinner>
              <span class="loading-text">{{ mode() === 'login' ? 'Signing in...' : 'Creating account...' }}</span>
            </div>
          }

          @if (mode() === 'login') {
            <form #loginForm="ngForm" (ngSubmit)="onSubmit()" class="auth-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="email" [disabled]="loading">
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" [disabled]="loading">
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>

              @if (error) {
                <div class="error-message">{{ error }}</div>
              }

              <button mat-raised-button color="primary" type="submit" [disabled]="loading" class="full-width submit-btn">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Sign In
                }
              </button>
            </form>
          } @else {
            <form #registerForm="ngForm" (ngSubmit)="onRegister()" class="auth-form">
              <div class="name-row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>First Name</mat-label>
                  <input matInput name="firstName" [(ngModel)]="firstName" required [disabled]="loading">
                  <mat-icon matSuffix>person</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Last Name</mat-label>
                  <input matInput name="lastName" [(ngModel)]="lastName" required [disabled]="loading">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" name="regEmail" [(ngModel)]="email" required autocomplete="email" [disabled]="loading">
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput type="password" name="regPassword" [(ngModel)]="password" required minlength="6" autocomplete="new-password" [disabled]="loading">
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput type="password" name="confirmPassword" [(ngModel)]="confirmPassword" required autocomplete="new-password" [disabled]="loading">
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>

              @if (error) {
                <div class="error-message">{{ error }}</div>
              }

              <button mat-raised-button color="primary" type="submit" [disabled]="loading" class="full-width submit-btn">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Create Account
                }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 30%, #3949ab 60%, #5c6bc0 100%);
      padding: 16px;
    }
    .login-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.25);
    }
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-icon {
      font-size: 56px;
      height: 56px;
      width: 56px;
      color: #3949ab;
      background: #e8eaf6;
      border-radius: 16px;
      padding: 12px;
      margin-bottom: 4px;
    }
    h1 {
      margin: 12px 0 4px;
      font-size: 28px;
      font-weight: 700;
      color: #1a237e;
      letter-spacing: 2px;
    }
    .subtitle {
      color: #888;
      margin: 0;
      font-size: 14px;
    }
    .toggle-tabs {
      display: flex;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
      gap: 4px;
    }
    .toggle-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
    }
    .toggle-btn.active {
      background: #fff;
      color: #3949ab;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .toggle-btn mat-icon { font-size: 20px; height: 20px; width: 20px; }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .name-row {
      display: flex;
      gap: 12px;
    }
    .name-row mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    .submit-btn {
      margin-top: 4px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 8px;
      font-size: 15px;
      height: 48px;
      background: #3949ab !important;
      color: #fff !important;
    }
    .submit-btn:hover:not(:disabled) {
      background: #7c4dff !important;
    }
    .error-message {
      color: #d32f2f;
      font-size: 14px;
      text-align: center;
      padding: 10px;
      background: #ffebee;
      border-radius: 8px;
    }
    .form-wrapper {
      position: relative;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: rgba(255,255,255,0.85);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 200px;
    }
    .loading-text {
      color: #3949ab;
      font-size: 15px;
      font-weight: 500;
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');

  email = '';
  password = '';
  firstName = '';
  lastName = '';
  confirmPassword = '';
  loading = false;
  error = '';

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password';
        this.loading = false;
      },
    });
  }

  async onRegister(): Promise<void> {
    if (!this.email || !this.password || !this.firstName || !this.lastName) return;
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.register({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }
}
