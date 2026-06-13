import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all warehouses' })
  async findAll(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.warehouseRepository.find();
    return warehouses.map(this.toResponseDto);
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a warehouse' })
  async create(@Body() dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = new Warehouse();
    warehouse.code = dto.code;
    warehouse.name = dto.name;
    warehouse.address = dto.address || '';
    warehouse.isActive = true;
    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse detail' })
  async findOne(@Param('id') id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['zones', 'zones.locations'],
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return this.toResponseDto(warehouse);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update warehouse' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    if (dto.name) warehouse.name = dto.name;
    if (dto.address !== undefined) warehouse.address = dto.address;
    if (dto.isActive !== undefined) warehouse.isActive = dto.isActive;
    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Activate/deactivate warehouse' })
  async toggleActive(@Param('id') id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    warehouse.isActive = !warehouse.isActive;
    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  private toResponseDto(warehouse: Warehouse): WarehouseResponseDto {
    return {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }
}
