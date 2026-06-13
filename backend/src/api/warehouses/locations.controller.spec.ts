import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsController } from './locations.controller';
import { BinLocation, LocationType } from '../../domain/warehouse/location.entity';
import { WarehouseZone, ZoneType } from '../../domain/warehouse/zone.entity';
import { CreateLocationDto } from './dto/warehouse.dto';

describe('LocationsController', () => {
  let controller: LocationsController;
  let locationRepository: jest.Mocked<Repository<BinLocation>>;
  let zoneRepository: jest.Mocked<Repository<WarehouseZone>>;

  const mockZone: WarehouseZone = {
    id: 'zone-1', warehouseId: 'wh-1', code: 'A01', name: 'Zone A',
    zoneType: ZoneType.STORAGE, isActive: true,
    warehouse: {} as any, locations: [],
    createdAt: new Date(), updatedAt: new Date(),
  };

  let mockLocation: BinLocation;

  beforeEach(async () => {
    mockLocation = {
      id: 'loc-1', zoneId: 'zone-1', code: 'A01-01', aisle: 'A', rack: '01', shelf: '1', bin: '',
      maxWeight: 1000, maxVolume: 10, locationType: LocationType.BIN, isActive: true, isPickable: true, barcode: 'A01-01',
      zone: mockZone,
      createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
    } as BinLocation;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: getRepositoryToken(BinLocation),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WarehouseZone),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    locationRepository = module.get(getRepositoryToken(BinLocation));
    zoneRepository = module.get(getRepositoryToken(WarehouseZone));
  });

  describe('findAll', () => {
    it('should return all locations with filters', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLocation]),
      };
      locationRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await controller.findAll();

      expect(result.length).toBe(1);
      expect(locationRepository.createQueryBuilder).toHaveBeenCalledWith('loc');
    });

    it('should filter by zoneId', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLocation]),
      };
      locationRepository.createQueryBuilder.mockReturnValue(qb);

      await controller.findAll(undefined, 'zone-1');

      expect(qb.andWhere).toHaveBeenCalledWith('loc.zoneId = :zoneId', { zoneId: 'zone-1' });
    });

    it('should filter by warehouseId', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLocation]),
      };
      locationRepository.createQueryBuilder.mockReturnValue(qb);

      await controller.findAll('wh-1');

      expect(qb.andWhere).toHaveBeenCalledWith('zone.warehouseId = :warehouseId', { warehouseId: 'wh-1' });
    });
  });

  describe('create', () => {
    it('should create a location when zone exists', async () => {
      const dto: CreateLocationDto = {
        zoneId: 'zone-1', code: 'A01-02', locationType: LocationType.BIN,
        aisle: 'A', rack: '01', shelf: '2', isPickable: true,
      };
      zoneRepository.findOne.mockResolvedValue(mockZone);
      locationRepository.save.mockResolvedValue({ ...mockLocation, id: 'loc-2', code: 'A01-02' });

      const result = await controller.create(dto);

      expect(result.code).toBe('A01-02');
    });

    it('should throw NotFoundException when zone not found', async () => {
      zoneRepository.findOne.mockResolvedValue(null);
      await expect(controller.create({ zoneId: 'nonexistent', code: 'X', locationType: LocationType.BIN } as CreateLocationDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('importCsv', () => {
    it('should import valid CSV rows', async () => {
      const csvContent = 'zoneId,code,locationType\nzone-1,A01-01,bin\nzone-1,A01-02,shelf';
      const file = { buffer: Buffer.from(csvContent) };
      zoneRepository.findOne.mockResolvedValue(mockZone);
      locationRepository.save.mockResolvedValue([] as any);

      const result = await controller.importCsv(file as any);

      expect(result.imported).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should reject CSV without required columns', async () => {
      const csvContent = 'name,value\nzone-1,test';
      const file = { buffer: Buffer.from(csvContent) };
      await expect(controller.importCsv(file as any)).rejects.toThrow(BadRequestException);
    });

    it('should reject empty CSV', async () => {
      const csvContent = 'zoneId,code,locationType';
      const file = { buffer: Buffer.from(csvContent) };
      await expect(controller.importCsv(file as any)).rejects.toThrow(BadRequestException);
    });

    it('should handle CSV with invalid zone references', async () => {
      const csvContent = 'zoneId,code,locationType\nbad-zone,A01,bin';
      const file = { buffer: Buffer.from(csvContent) };
      zoneRepository.findOne.mockResolvedValue(null);

      const result = await controller.importCsv(file as any);

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('zone not found');
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.importCsv(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should handle quoted CSV values', async () => {
      const csvContent = 'zoneId,code,locationType,aisle\nzone-1,"A01,01",bin,"Aisle,1"';
      const file = { buffer: Buffer.from(csvContent) };
      zoneRepository.findOne.mockResolvedValue(mockZone);
      locationRepository.save.mockResolvedValue([] as any);

      const result = await controller.importCsv(file as any);

      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should handle row with column count mismatch', async () => {
      const csvContent = 'zoneId,code,locationType\nzone-1,A01,bin,extra';
      const file = { buffer: Buffer.from(csvContent) };
      zoneRepository.findOne.mockResolvedValue(mockZone);

      const result = await controller.importCsv(file as any);

      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('column count mismatch');
    });
  });

  describe('findOne', () => {
    it('should return location when found', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation);
      const result = await controller.findOne('loc-1');
      expect(result.id).toBe('loc-1');
    });

    it('should throw NotFoundException when not found', async () => {
      locationRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update location fields', async () => {
      const dto: CreateLocationDto = { zoneId: 'zone-1', code: 'UPDATED', locationType: LocationType.BIN };
      locationRepository.findOne.mockResolvedValue(mockLocation);
      locationRepository.save.mockResolvedValue({ ...mockLocation, code: 'UPDATED' });

      const result = await controller.update('loc-1', dto);

      expect(result.code).toBe('UPDATED');
    });
  });

  describe('toggleActive', () => {
    it('should toggle isActive', async () => {
      locationRepository.findOne.mockResolvedValue({ ...mockLocation, isActive: true });
      locationRepository.save.mockResolvedValue({ ...mockLocation, isActive: false });

      const result = await controller.toggleActive('loc-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('findByBarcode', () => {
    it('should return location by barcode', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation);
      const result = await controller.findByBarcode('A01-01');
      expect(result.barcode).toBe('A01-01');
    });

    it('should throw NotFoundException when barcode not found', async () => {
      locationRepository.findOne.mockResolvedValue(null);
      await expect(controller.findByBarcode('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
