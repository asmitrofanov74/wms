import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { WarehouseZone } from './zone.entity';

export enum LocationType {
  BIN = 'bin',
  BULK = 'bulk',
  FLOOR = 'floor',
  SHELF = 'shelf',
  PALLET = 'pallet',
}

@Entity('bin_locations')
@Index(['zoneId'])
@Index(['barcode'])
export class BinLocation extends BaseEntity {
  @ManyToOne(() => WarehouseZone, (z) => z.locations)
  @JoinColumn({ name: 'zone_id' })
  zone: WarehouseZone;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @Column({ length: 50 })
  code: string;

  @Column({ nullable: true, length: 20 })
  aisle: string;

  @Column({ nullable: true, length: 20 })
  rack: string;

  @Column({ nullable: true, length: 20 })
  shelf: string;

  @Column({ nullable: true, length: 20 })
  bin: string;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight: number;

  @Column({ name: 'max_volume', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxVolume: number;

  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.BIN,
  })
  locationType: LocationType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_pickable', default: true })
  isPickable: boolean;

  @Column({ nullable: true, length: 100 })
  barcode: string;
}
