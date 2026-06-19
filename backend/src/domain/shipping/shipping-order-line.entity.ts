import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ShippingOrder } from './shipping-order.entity';

@Entity('shipping_order_lines')
@Index(['shippingOrderId'])
@Index(['productId'])
export class ShippingOrderLine extends BaseEntity {
  @Column()
  shippingOrderId: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  orderedQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  pickedQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  packedQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  shippedQuantity: number;

  @ManyToOne(() => ShippingOrder, (order) => order.lines)
  @JoinColumn({ name: 'shippingOrderId' })
  shippingOrder: ShippingOrder;
}
