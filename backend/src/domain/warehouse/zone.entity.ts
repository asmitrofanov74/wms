import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Warehouse } from './warehouse.entity';
import { BinLocation } from './location.entity';

export enum ZoneType {
  STORAGE = 'storage',
  PICKING = 'picking',
  RECEIVING = 'receiving',
  SHIPPING = 'shipping',
  OVERFLOW = 'overflow',
}

@Entity('warehouse_zones')
export class WarehouseZone extends BaseEntity {
  @ManyToOne(() => Warehouse, (w) => w.zones)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ZoneType,
    default: ZoneType.STORAGE,
  })
  zoneType: ZoneType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => BinLocation, (loc) => loc.zone)
  locations: BinLocation[];
}
