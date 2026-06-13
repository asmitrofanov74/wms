import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem, AdjustInventoryRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  getItems(search?: string, lowStock?: boolean): Observable<InventoryItem[]> {
    let params: any = {};
    if (search) params.search = search;
    if (lowStock) params.lowStock = 'true';
    return this.http.get<InventoryItem[]>('/api/v1/inventory', { params });
  }

  getItem(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`/api/v1/inventory/${id}`);
  }

  adjustItem(id: string, dto: AdjustInventoryRequest): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`/api/v1/inventory/${id}/adjust`, dto);
  }
}
