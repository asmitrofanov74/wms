import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, Category, ProductUom, ProductBarcode, CreateProductRequest, UpdateProductRequest, CreateUomRequest, CreateBarcodeRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  getProducts(search?: string, categoryId?: string, active?: boolean): Observable<Product[]> {
    let params: any = {};
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (active !== undefined) params.active = active;
    return this.http.get<Product[]>('/api/v1/products', { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/v1/products/${id}`);
  }

  createProduct(dto: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>('/api/v1/products', dto);
  }

  updateProduct(id: string, dto: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`/api/v1/products/${id}`, dto);
  }

  toggleProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`/api/v1/products/${id}`, {});
  }

  addUom(productId: string, dto: CreateUomRequest): Observable<ProductUom> {
    return this.http.post<ProductUom>(`/api/v1/products/${productId}/uoms`, dto);
  }

  addBarcode(productId: string, dto: CreateBarcodeRequest): Observable<ProductBarcode> {
    return this.http.post<ProductBarcode>(`/api/v1/products/${productId}/barcodes`, dto);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/v1/categories');
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`/api/v1/categories/${id}`);
  }

  createCategory(dto: { code: string; name: string; parentId?: string }): Observable<Category> {
    return this.http.post<Category>('/api/v1/categories', dto);
  }

  updateCategory(id: string, dto: { code?: string; name?: string }): Observable<Category> {
    return this.http.put<Category>(`/api/v1/categories/${id}`, dto);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/categories/${id}`);
  }
}
