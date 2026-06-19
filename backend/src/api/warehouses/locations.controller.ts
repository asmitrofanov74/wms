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
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { BinLocation, LocationType } from '../../domain/warehouse/location.entity';
import { WarehouseZone } from '../../domain/warehouse/zone.entity';
import {
  CreateLocationDto,
  LocationResponseDto,
} from './dto/warehouse.dto';
import { paginate, PaginatedResult } from '../../application/common/pagination/pagination.service';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(
    @InjectRepository(BinLocation)
    private readonly locationRepository: Repository<BinLocation>,
    @InjectRepository(WarehouseZone)
    private readonly zoneRepository: Repository<WarehouseZone>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List locations' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'zoneId', required: false })
  @ApiQuery({ name: 'pickable', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('pickable') pickable?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<PaginatedResult<LocationResponseDto>> {
    const where: any = {};
    if (zoneId) where.zoneId = zoneId;
    if (pickable !== undefined) where.isPickable = pickable === 'true';

    const result = await paginate(this.locationRepository, { page, limit }, {
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['zone', 'zone.warehouse'],
      order: { code: 'ASC' } as any,
    });

    if (warehouseId) {
      const filtered = result.data.filter((l) => l.zone?.warehouseId === warehouseId);
      return { data: filtered.map(this.toResponseDto), meta: result.meta };
    }

    return { data: result.data.map(this.toResponseDto), meta: result.meta };
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a location' })
  async create(@Body() dto: CreateLocationDto): Promise<LocationResponseDto> {
    const zone = await this.zoneRepository.findOne({ where: { id: dto.zoneId } });
    if (!zone) throw new NotFoundException('Zone not found');
    const location = new BinLocation();
    location.zoneId = dto.zoneId;
    location.code = dto.code;
    location.aisle = dto.aisle || '';
    location.rack = dto.rack || '';
    location.shelf = dto.shelf || '';
    location.bin = dto.bin || '';
    location.maxWeight = dto.maxWeight || 0;
    location.maxVolume = dto.maxVolume || 0;
    location.locationType = dto.locationType;
    location.isPickable = dto.isPickable ?? true;
    location.isActive = true;
    location.barcode = dto.barcode || dto.code;
    const saved = await this.locationRepository.save(location);
    return this.toResponseDto(saved);
  }

  @Post('import')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Bulk import locations from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async importCsv(@UploadedFile() file: any): Promise<{ imported: number; errors: string[] }> {
    if (!file) throw new BadRequestException('CSV file is required');

    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter((l: string) => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV must have a header row and at least one data row');

    const headers = this.parseCsvRow(lines[0]);
    const expected = ['zoneId', 'code', 'locationType'];
    for (const h of expected) {
      if (!headers.includes(h)) throw new BadRequestException(`Missing required column: ${h}`);
    }

    const errors: string[] = [];
    const locations: BinLocation[] = [];
    const zoneCache = new Map<string, boolean>();

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvRow(lines[i]);
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: column count mismatch`);
          continue;
        }
        const row = headers.reduce((obj: Record<string, string>, h: string, idx: number) => {
          obj[h.trim()] = values[idx]?.trim() || '';
          return obj;
        }, {} as Record<string, string>);

        if (!zoneCache.has(row.zoneId)) {
          const zone = await this.zoneRepository.findOne({ where: { id: row.zoneId } });
          if (!zone) {
            errors.push(`Row ${i + 1}: zone not found: ${row.zoneId}`);
            continue;
          }
          zoneCache.set(row.zoneId, true);
        }

        const location = new BinLocation();
        location.zoneId = row.zoneId;
        location.code = row.code;
        location.aisle = row.aisle || '';
        location.rack = row.rack || '';
        location.shelf = row.shelf || '';
        location.bin = row.bin || '';
        location.locationType = row.locationType as LocationType;
        location.isPickable = row.isPickable?.toLowerCase() === 'true' || row.isPickable === '1';
        location.isActive = true;
        location.maxWeight = parseFloat(row.maxWeight) || 0;
        location.maxVolume = parseFloat(row.maxVolume) || 0;
        location.barcode = row.barcode || row.code;
        locations.push(location);
      } catch (e) {
        errors.push(`Row ${i + 1}: ${(e as Error).message}`);
      }
    }

    if (locations.length > 0) {
      await this.locationRepository.save(locations);
    }

    return { imported: locations.length, errors };
  }

  private parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += ch;
    }
    result.push(current);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location detail' })
  async findOne(@Param('id') id: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['zone', 'zone.warehouse'],
    });
    if (!location) throw new NotFoundException('Location not found');
    return this.toResponseDto(location);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update location' })
  async update(
    @Param('id') id: string,
    @Body() dto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    if (dto.zoneId) location.zoneId = dto.zoneId;
    location.code = dto.code;
    location.aisle = dto.aisle || '';
    location.rack = dto.rack || '';
    location.shelf = dto.shelf || '';
    location.bin = dto.bin || '';
    location.maxWeight = dto.maxWeight || 0;
    location.maxVolume = dto.maxVolume || 0;
    location.locationType = dto.locationType;
    location.isPickable = dto.isPickable ?? true;
    location.barcode = dto.barcode || dto.code;
    const saved = await this.locationRepository.save(location);
    return this.toResponseDto(saved);
  }

  @Patch(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Toggle location active status' })
  async toggleActive(@Param('id') id: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    location.isActive = !location.isActive;
    const saved = await this.locationRepository.save(location);
    return this.toResponseDto(saved);
  }

  @Get('by-barcode/:barcode')
  @ApiOperation({ summary: 'Lookup location by barcode' })
  async findByBarcode(
    @Param('barcode') barcode: string,
  ): Promise<LocationResponseDto> {
    const cacheKey = `location:barcode:${barcode}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return JSON.parse(cached);

    const location = await this.locationRepository.findOne({
      where: { barcode },
      relations: ['zone', 'zone.warehouse'],
    });
    if (!location) throw new NotFoundException('Location not found');
    const dto = this.toResponseDto(location);
    await this.cacheManager.set(cacheKey, JSON.stringify(dto), 300);
    return dto;
  }

  private toResponseDto(location: BinLocation): LocationResponseDto {
    return {
      id: location.id,
      zoneId: location.zoneId,
      code: location.code,
      aisle: location.aisle,
      rack: location.rack,
      shelf: location.shelf,
      bin: location.bin,
      maxWeight: location.maxWeight,
      maxVolume: location.maxVolume,
      locationType: location.locationType,
      isActive: location.isActive,
      isPickable: location.isPickable,
      barcode: location.barcode || '',
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
