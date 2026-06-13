import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from '../product/product.entity';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column()
  productId: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantityOnHand: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantityReserved: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  reorderPoint: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  reorderQuantity: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
