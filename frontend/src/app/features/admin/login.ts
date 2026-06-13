import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  ],
  template: `
    <div class="login-header">
      <mat-icon class="logo-icon">warehouse</mat-icon>
      <h1>WMS</h1>
      <p class="subtitle">Warehouse Management System</p>
    </div>

    <form #loginForm="ngForm" (ngSubmit)="onSubmit()" class="login-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input
          matInput
          type="email"
          name="email"
          [(ngModel)]="email"
          required
          autocomplete="email"
        />
        <mat-icon matSuffix>email</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Password</mat-label>
        <input
          matInput
          type="password"
          name="password"
          [(ngModel)]="password"
          required
          autocomplete="current-password"
        />
        <mat-icon matSuffix>lock</mat-icon>
      </mat-form-field>

      @if (error) {
        <div class="error-message">{{ error }}</div>
      }

      <button
        mat-raised-button
        color="primary"
        type="submit"
        [disabled]="loading"
        class="full-width submit-btn"
      >
        @if (loading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Sign In
        }
      </button>
    </form>
  `,
  styles: [
    `
      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }
      .logo-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: #3f51b5;
      }
      h1 {
        margin: 8px 0 4px;
        font-size: 28px;
        font-weight: 600;
      }
      .subtitle {
        color: #666;
        margin: 0;
        font-size: 14px;
      }
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .full-width {
        width: 100%;
      }
      .submit-btn {
        margin-top: 8px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .error-message {
        color: #f44336;
        font-size: 14px;
        text-align: center;
        padding: 8px;
        background: #ffebee;
        border-radius: 4px;
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
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
}
