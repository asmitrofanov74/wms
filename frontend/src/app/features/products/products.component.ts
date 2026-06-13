import { Component } from '@angular/core';

@Component({
  selector: 'app-products',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Products</h1>
    </div>
    <p>Product management coming soon.</p>
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
export class ProductsComponent {}
