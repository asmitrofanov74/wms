import { Component } from '@angular/core';

@Component({
  selector: 'app-shipping',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Shipping</h1>
    </div>
    <p>Shipping management coming soon.</p>
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
export class ShippingComponent {}
