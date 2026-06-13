import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReceivingOrder, CreateReceivingOrderRequest, UpdateReceivingOrderRequest, ReceiveItemsRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class ReceivingService {
  private http = inject(HttpClient);

  getOrders(search?: string, status?: string): Observable<ReceivingOrder[]> {
    let params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    return this.http.get<ReceivingOrder[]>('/api/v1/receiving', { params });
  }

  getOrder(id: string): Observable<ReceivingOrder> {
    return this.http.get<ReceivingOrder>(`/api/v1/receiving/${id}`);
  }

  createOrder(dto: CreateReceivingOrderRequest): Observable<ReceivingOrder> {
    return this.http.post<ReceivingOrder>('/api/v1/receiving', dto);
  }

  updateOrder(id: string, dto: UpdateReceivingOrderRequest): Observable<ReceivingOrder> {
    return this.http.put<ReceivingOrder>(`/api/v1/receiving/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<ReceivingOrder> {
    return this.http.patch<ReceivingOrder>(`/api/v1/receiving/${id}/status`, { status });
  }

  receiveItems(id: string, dto: ReceiveItemsRequest): Observable<ReceivingOrder> {
    return this.http.patch<ReceivingOrder>(`/api/v1/receiving/${id}/receive`, dto);
  }
}
