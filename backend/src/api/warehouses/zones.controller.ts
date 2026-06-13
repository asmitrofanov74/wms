import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { WarehouseZone } from '../../domain/warehouse/zone.entity';
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import {
  CreateZoneDto,
  ZoneResponseDto,
} from './dto/warehouse.dto';

@ApiTags('Warehouse Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses/:warehouseId/zones')
export class ZonesController {
  constructor(
    @InjectRepository(WarehouseZone)
    private readonly zoneRepository: Repository<WarehouseZone>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List zones in warehouse' })
  async findAll(
    @Param('warehouseId') warehouseId: string,
  ): Promise<ZoneResponseDto[]> {
    const zones = await this.zoneRepository.find({
      where: { warehouseId },
    });
    return zones.map(this.toResponseDto);
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a zone in warehouse' })
  async create(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: CreateZoneDto,
  ): Promise<ZoneResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const zone = new WarehouseZone();
    zone.warehouseId = warehouseId;
    zone.code = dto.code;
    zone.name = dto.name;
    zone.zoneType = dto.zoneType;
    zone.isActive = true;
    const saved = await this.zoneRepository.save(zone);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone detail' })
  async findOne(@Param('id') id: string): Promise<ZoneResponseDto> {
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['locations'],
    });
    if (!zone) throw new NotFoundException('Zone not found');
    return this.toResponseDto(zone);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update zone' })
  async update(
    @Param('id') id: string,
    @Body() dto: CreateZoneDto,
  ): Promise<ZoneResponseDto> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    zone.code = dto.code;
    zone.name = dto.name;
    zone.zoneType = dto.zoneType;
    const saved = await this.zoneRepository.save(zone);
    return this.toResponseDto(saved);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a zone' })
  async remove(@Param('id') id: string): Promise<void> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    await this.zoneRepository.delete(id);
  }

  private toResponseDto(zone: WarehouseZone): ZoneResponseDto {
    return {
      id: zone.id,
      warehouseId: zone.warehouseId,
      code: zone.code,
      name: zone.name,
      zoneType: zone.zoneType,
      isActive: zone.isActive,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  }
}
