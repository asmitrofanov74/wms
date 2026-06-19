import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ReceivingOrderLine } from './receiving-order-line.entity';

export enum ReceivingOrderStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('receiving_orders')
@Index(['status'])
@Index(['supplier'])
@Index(['orderNumber'])
export class ReceivingOrder extends BaseEntity {
  @Column({ unique: true })
  orderNumber: string;

  @Column()
  supplier: string;

  @Column({ default: ReceivingOrderStatus.DRAFT })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => ReceivingOrderLine, (line) => line.receivingOrder, {
    cascade: true,
  })
  lines: ReceivingOrderLine[];
}
