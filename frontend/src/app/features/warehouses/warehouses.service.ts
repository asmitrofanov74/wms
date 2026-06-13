import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Warehouse, Zone, Location } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class WarehousesService {
  private http = inject(HttpClient);

  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>('/api/v1/warehouses');
  }

  getWarehouse(id: string): Observable<Warehouse> {
    return this.http.get<Warehouse>(`/api/v1/warehouses/${id}`);
  }

  createWarehouse(dto: { code: string; name: string; address?: string }): Observable<Warehouse> {
    return this.http.post<Warehouse>('/api/v1/warehouses', dto);
  }

  updateWarehouse(id: string, dto: { name?: string; address?: string; isActive?: boolean }): Observable<Warehouse> {
    return this.http.put<Warehouse>(`/api/v1/warehouses/${id}`, dto);
  }

  toggleWarehouse(id: string): Observable<Warehouse> {
    return this.http.patch<Warehouse>(`/api/v1/warehouses/${id}`, {});
  }

  getZones(warehouseId: string): Observable<Zone[]> {
    return this.http.get<Zone[]>(`/api/v1/warehouses/${warehouseId}/zones`);
  }

  createZone(warehouseId: string, dto: { code: string; name: string; zoneType: string }): Observable<Zone> {
    return this.http.post<Zone>(`/api/v1/warehouses/${warehouseId}/zones`, dto);
  }

  updateZone(warehouseId: string, id: string, dto: { code: string; name: string; zoneType: string }): Observable<Zone> {
    return this.http.put<Zone>(`/api/v1/warehouses/${warehouseId}/zones/${id}`, dto);
  }

  deleteZone(warehouseId: string, id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/warehouses/${warehouseId}/zones/${id}`);
  }

  getLocationsByZone(zoneId: string): Observable<Location[]> {
    return this.http.get<Location[]>(`/api/v1/locations?zoneId=${zoneId}`);
  }

  createLocation(dto: any): Observable<Location> {
    return this.http.post<Location>('/api/v1/locations', dto);
  }

  updateLocation(id: string, dto: any): Observable<Location> {
    return this.http.put<Location>(`/api/v1/locations/${id}`, dto);
  }

  toggleLocation(id: string): Observable<Location> {
    return this.http.patch<Location>(`/api/v1/locations/${id}`, {});
  }

  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/locations/${id}`);
  }

  importLocationsCsv(file: File): Observable<{ imported: number; errors: string[] }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ imported: number; errors: string[] }>('/api/v1/locations/import', fd);
  }
}
