import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .auth-card {
        background: white;
        border-radius: 12px;
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class AuthLayout {}
