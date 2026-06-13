import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { WarehouseZone } from './zone.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => WarehouseZone, (zone) => zone.warehouse)
  zones: WarehouseZone[];
}
