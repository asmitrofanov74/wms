import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './shipping.controller';
import { ShippingOrder } from '../../domain/shipping/shipping-order.entity';
import { ShippingOrderLine } from '../../domain/shipping/shipping-order-line.entity';
import { Product } from '../../domain/product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingOrder, ShippingOrderLine, Product])],
  controllers: [ShippingController],
})
export class ShippingModule {}
