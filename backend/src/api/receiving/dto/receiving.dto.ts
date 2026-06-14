import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReceivingOrderStatus } from '../../../domain/receiving/receiving-order.entity';

export class ReceivingLineDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  expectedQuantity: number;
}

export class CreateReceivingOrderDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  supplier: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [ReceivingLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivingLineDto)
  lines: ReceivingLineDto[];
}

export class UpdateReceivingOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ReceivingLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivingLineDto)
  @IsOptional()
  lines?: ReceivingLineDto[];
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ReceivingOrderStatus })
  @IsEnum(ReceivingOrderStatus)
  status: string;
}

export class ReceiveLineDto {
  @ApiProperty()
  @IsString()
  lineId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  receivedQuantity: number;
}

export class ReceiveItemsDto {
  @ApiProperty({ type: [ReceiveLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveLineDto)
  items: ReceiveLineDto[];
}

export class ReceivingOrderLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  receivingOrderId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  expectedQuantity: number;

  @ApiProperty()
  receivedQuantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReceivingOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  supplier: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes: string;

  @ApiProperty({ type: [ReceivingOrderLineResponseDto] })
  lines: ReceivingOrderLineResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
