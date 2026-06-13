import { Warehouse } from './warehouse.entity';
import { WarehouseZone } from './zone.entity';
import { BinLocation } from './location.entity';

export interface IWarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  findAll(): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<Warehouse>;
  delete(id: string): Promise<void>;
}

export interface IZoneRepository {
  findById(id: string): Promise<WarehouseZone | null>;
  findByWarehouse(warehouseId: string): Promise<WarehouseZone[]>;
  save(zone: WarehouseZone): Promise<WarehouseZone>;
  delete(id: string): Promise<void>;
}

export interface ILocationRepository {
  findById(id: string): Promise<BinLocation | null>;
  findByCode(code: string): Promise<BinLocation | null>;
  findByZone(zoneId: string): Promise<BinLocation[]>;
  findByBarcode(barcode: string): Promise<BinLocation | null>;
  save(location: BinLocation): Promise<BinLocation>;
  saveMany(locations: BinLocation[]): Promise<BinLocation[]>;
  delete(id: string): Promise<void>;
}
