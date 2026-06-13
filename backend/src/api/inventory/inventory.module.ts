import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from '../../domain/inventory/inventory-item.entity';
import { Product } from '../../domain/product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, Product])],
  controllers: [InventoryController],
})
export class InventoryModule {}
