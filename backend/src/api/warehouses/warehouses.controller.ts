import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';
import { paginate, PaginatedResult } from '../../application/common/pagination/pagination.service';

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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<PaginatedResult<WarehouseResponseDto>> {
    const result = await paginate(this.warehouseRepository, { page, limit }, {
      order: { code: 'ASC' } as any,
    });
    return { data: result.data.map(this.toResponseDto), meta: result.meta };
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
