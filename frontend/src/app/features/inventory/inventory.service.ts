import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem, AdjustInventoryRequest } from '../../shared/models/api-response';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  getItems(search?: string, lowStock?: boolean, page?: number, limit?: number): Observable<PaginatedResult<InventoryItem>> {
    let params: any = {};
    if (search) params.search = search;
    if (lowStock) params.lowStock = 'true';
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return this.http.get<PaginatedResult<InventoryItem>>('/api/v1/inventory', { params });
  }

  getItem(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`/api/v1/inventory/${id}`);
  }

  adjustItem(id: string, dto: AdjustInventoryRequest): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`/api/v1/inventory/${id}/adjust`, dto);
  }
}
