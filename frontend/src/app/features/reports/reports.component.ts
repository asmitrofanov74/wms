import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Reports</h1>
    </div>
    <p>Reports coming soon.</p>
  `,
  styles: [
    `
      .page-header h1 {
        margin: 0 0 16px;
        font-size: 28px;
        font-weight: 500;
      }
    `,
  ],
})
export class ReportsComponent {}
