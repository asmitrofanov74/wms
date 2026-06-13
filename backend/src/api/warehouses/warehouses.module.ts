import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehousesController } from './warehouses.controller';
import { ZonesController } from './zones.controller';
import { LocationsController } from './locations.controller';
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import { WarehouseZone } from '../../domain/warehouse/zone.entity';
import { BinLocation } from '../../domain/warehouse/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, WarehouseZone, BinLocation])],
  controllers: [WarehousesController, ZonesController, LocationsController],
})
export class WarehousesModule {}
