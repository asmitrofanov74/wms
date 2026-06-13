import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingController } from './receiving.controller';
import { ReceivingOrder } from '../../domain/receiving/receiving-order.entity';
import { ReceivingOrderLine } from '../../domain/receiving/receiving-order-line.entity';
import { Product } from '../../domain/product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReceivingOrder, ReceivingOrderLine, Product])],
  controllers: [ReceivingController],
})
export class ReceivingModule {}
