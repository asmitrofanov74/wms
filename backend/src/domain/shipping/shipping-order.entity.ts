import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ShippingOrderLine } from './shipping-order-line.entity';

export enum ShippingOrderStatus {
  DRAFT = 'draft',
  PICKING = 'picking',
  PACKING = 'packing',
  SHIPPED = 'shipped',
  CANCELLED = 'cancelled',
}

@Entity('shipping_orders')
export class ShippingOrder extends BaseEntity {
  @Column({ unique: true })
  orderNumber: string;

  @Column()
  customer: string;

  @Column({ nullable: true })
  shipToAddress: string;

  @Column({ default: ShippingOrderStatus.DRAFT })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => ShippingOrderLine, (line) => line.shippingOrder, {
    cascade: true,
  })
  lines: ShippingOrderLine[];
}
