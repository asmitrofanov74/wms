import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
import { paginate, PaginatedResult } from '../../application/common/pagination/pagination.service';

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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Param('warehouseId') warehouseId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<PaginatedResult<ZoneResponseDto>> {
    const result = await paginate(this.zoneRepository, { page, limit }, {
      where: { warehouseId },
      order: { code: 'ASC' } as any,
    });
    return { data: result.data.map(this.toResponseDto), meta: result.meta };
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
