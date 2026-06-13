import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ReceivingOrder } from './receiving-order.entity';

@Entity('receiving_order_lines')
export class ReceivingOrderLine extends BaseEntity {
  @Column()
  receivingOrderId: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  expectedQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  receivedQuantity: number;

  @ManyToOne(() => ReceivingOrder, (order) => order.lines)
  @JoinColumn({ name: 'receivingOrderId' })
  receivingOrder: ReceivingOrder;
}
