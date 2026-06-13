import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZoneType } from '../../../domain/warehouse/zone.entity';
import { LocationType } from '../../../domain/warehouse/location.entity';

export class CreateWarehouseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateZoneDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ZoneType })
  @IsEnum(ZoneType)
  zoneType: ZoneType;
}

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  zoneId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aisle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rack?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shelf?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bin?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxWeight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxVolume?: number;

  @ApiProperty({ enum: LocationType })
  @IsEnum(LocationType)
  locationType: LocationType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPickable?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;
}

export class WarehouseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ZoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ZoneType })
  zoneType: ZoneType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  zoneId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  aisle: string;

  @ApiProperty()
  rack: string;

  @ApiProperty()
  shelf: string;

  @ApiProperty()
  bin: string;

  @ApiProperty()
  maxWeight: number;

  @ApiProperty()
  maxVolume: number;

  @ApiProperty({ enum: LocationType })
  locationType: LocationType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isPickable: boolean;

  @ApiProperty()
  barcode: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
