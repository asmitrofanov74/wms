import { Component } from '@angular/core';

@Component({
  selector: 'app-receiving',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Receiving</h1>
    </div>
    <p>Receiving management coming soon.</p>
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
export class ReceivingComponent {}
