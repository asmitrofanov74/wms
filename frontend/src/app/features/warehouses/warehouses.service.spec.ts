import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WarehousesService } from './warehouses.service';
import { Warehouse, Zone, Location } from '../../shared/models/api-response';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(WarehousesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should get warehouses', () => {
    service.getWarehouses().subscribe();
    http.expectOne('/api/v1/warehouses').flush([]);
  });

  it('should get warehouse by id', () => {
    service.getWarehouse('wh-1').subscribe();
    http.expectOne('/api/v1/warehouses/wh-1').flush({} as Warehouse);
  });

  it('should create warehouse', () => {
    service.createWarehouse({ code: 'WH01', name: 'Main' }).subscribe();
    const req = http.expectOne('/api/v1/warehouses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'WH01', name: 'Main' });
    req.flush({} as Warehouse);
  });

  it('should update warehouse', () => {
    service.updateWarehouse('wh-1', { name: 'Updated' }).subscribe();
    const req = http.expectOne('/api/v1/warehouses/wh-1');
    expect(req.request.method).toBe('PUT');
    req.flush({} as Warehouse);
  });

  it('should toggle warehouse', () => {
    service.toggleWarehouse('wh-1').subscribe();
    http.expectOne('/api/v1/warehouses/wh-1').flush({} as Warehouse);
  });

  it('should get zones', () => {
    service.getZones('wh-1').subscribe();
    http.expectOne('/api/v1/warehouses/wh-1/zones').flush([]);
  });

  it('should create zone', () => {
    service.createZone('wh-1', { code: 'A01', name: 'Zone A', zoneType: 'storage' }).subscribe();
    const req = http.expectOne('/api/v1/warehouses/wh-1/zones');
    expect(req.request.method).toBe('POST');
    req.flush({} as Zone);
  });

  it('should update zone', () => {
    service.updateZone('wh-1', 'z-1', { code: 'A02', name: 'Updated', zoneType: 'picking' }).subscribe();
    http.expectOne('/api/v1/warehouses/wh-1/zones/z-1').flush({} as Zone);
  });

  it('should delete zone', () => {
    service.deleteZone('wh-1', 'z-1').subscribe();
    http.expectOne('/api/v1/warehouses/wh-1/zones/z-1').flush(null);
  });

  it('should get locations by zone', () => {
    service.getLocationsByZone('z-1').subscribe();
    http.expectOne('/api/v1/locations?zoneId=z-1').flush([]);
  });

  it('should create location', () => {
    service.createLocation({ zoneId: 'z-1', code: 'A01-01', locationType: 'bin' }).subscribe();
    const req = http.expectOne('/api/v1/locations');
    expect(req.request.method).toBe('POST');
    req.flush({} as Location);
  });

  it('should update location', () => {
    service.updateLocation('loc-1', { code: 'UPDATED' }).subscribe();
    http.expectOne('/api/v1/locations/loc-1').flush({} as Location);
  });

  it('should toggle location', () => {
    service.toggleLocation('loc-1').subscribe();
    http.expectOne('/api/v1/locations/loc-1').flush({} as Location);
  });

  it('should delete location', () => {
    service.deleteLocation('loc-1').subscribe();
    http.expectOne('/api/v1/locations/loc-1').flush(null);
  });

  it('should import locations CSV', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    service.importLocationsCsv(file).subscribe();
    const req = http.expectOne('/api/v1/locations/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ imported: 5, errors: [] });
  });
});
