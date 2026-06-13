import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShippingOrder, CreateShippingOrderRequest, UpdateShippingOrderRequest, PickItemsRequest, PackItemsRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private http = inject(HttpClient);

  getOrders(search?: string, status?: string): Observable<ShippingOrder[]> {
    let params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    return this.http.get<ShippingOrder[]>('/api/v1/shipping', { params });
  }

  getOrder(id: string): Observable<ShippingOrder> {
    return this.http.get<ShippingOrder>(`/api/v1/shipping/${id}`);
  }

  createOrder(dto: CreateShippingOrderRequest): Observable<ShippingOrder> {
    return this.http.post<ShippingOrder>('/api/v1/shipping', dto);
  }

  updateOrder(id: string, dto: UpdateShippingOrderRequest): Observable<ShippingOrder> {
    return this.http.put<ShippingOrder>(`/api/v1/shipping/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<ShippingOrder> {
    return this.http.patch<ShippingOrder>(`/api/v1/shipping/${id}/status`, { status });
  }

  pickItems(id: string, dto: PickItemsRequest): Observable<ShippingOrder> {
    return this.http.patch<ShippingOrder>(`/api/v1/shipping/${id}/pick`, dto);
  }

  packItems(id: string, dto: PackItemsRequest): Observable<ShippingOrder> {
    return this.http.patch<ShippingOrder>(`/api/v1/shipping/${id}/pack`, dto);
  }
}
