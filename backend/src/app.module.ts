import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { RolesModule } from './api/roles/roles.module';
import { WarehousesModule } from './api/warehouses/warehouses.module';
import { ProductsModule } from './api/products/products.module';
import { ReceivingModule } from './api/receiving/receiving.module';
import { ShippingModule } from './api/shipping/shipping.module';
import { InventoryModule } from './api/inventory/inventory.module';
import { SeedModule } from './infrastructure/persistence/seeds/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    CqrsModule.forRoot(),
    DatabaseModule,
    CacheModule,
    AuthModule,
    UsersModule,
    RolesModule,
    WarehousesModule,
    ProductsModule,
    ReceivingModule,
    ShippingModule,
    InventoryModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
