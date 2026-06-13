import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZonesController } from './zones.controller';
import { WarehouseZone, ZoneType } from '../../domain/warehouse/zone.entity';
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import { CreateZoneDto } from './dto/warehouse.dto';

describe('ZonesController', () => {
  let controller: ZonesController;
  let zoneRepository: jest.Mocked<Repository<WarehouseZone>>;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;

  const mockZone: WarehouseZone = {
    id: 'zone-1', warehouseId: 'wh-1', code: 'A01', name: 'Zone A',
    zoneType: ZoneType.STORAGE, isActive: true,
    warehouse: {} as Warehouse, locations: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZonesController],
      providers: [
        {
          provide: getRepositoryToken(WarehouseZone),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ZonesController>(ZonesController);
    zoneRepository = module.get(getRepositoryToken(WarehouseZone));
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
  });

  describe('findAll', () => {
    it('should return zones for a warehouse', async () => {
      zoneRepository.find.mockResolvedValue([mockZone]);
      const result = await controller.findAll('wh-1');
      expect(result.length).toBe(1);
      expect(zoneRepository.find).toHaveBeenCalledWith({ where: { warehouseId: 'wh-1' } });
    });
  });

  describe('create', () => {
    it('should create a zone when warehouse exists', async () => {
      const dto: CreateZoneDto = { code: 'B01', name: 'Zone B', zoneType: ZoneType.PICKING };
      warehouseRepository.findOne.mockResolvedValue({ id: 'wh-1' } as Warehouse);
      zoneRepository.save.mockResolvedValue({ ...mockZone, id: 'zone-2', code: 'B01', zoneType: ZoneType.PICKING });

      const result = await controller.create('wh-1', dto);

      expect(result.code).toBe('B01');
      expect(result.zoneType).toBe(ZoneType.PICKING);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      warehouseRepository.findOne.mockResolvedValue(null);
      await expect(controller.create('nonexistent', {} as CreateZoneDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return zone with locations', async () => {
      zoneRepository.findOne.mockResolvedValue(mockZone);
      const result = await controller.findOne('zone-1');
      expect(result.id).toBe('zone-1');
    });

    it('should throw NotFoundException when zone not found', async () => {
      zoneRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update zone fields', async () => {
      const dto: CreateZoneDto = { code: 'A02', name: 'Updated Zone', zoneType: ZoneType.OVERFLOW };
      zoneRepository.findOne.mockResolvedValue(mockZone);
      zoneRepository.save.mockResolvedValue({ ...mockZone, code: 'A02', name: 'Updated Zone' });

      const result = await controller.update('zone-1', dto);

      expect(result.code).toBe('A02');
    });
  });

  describe('remove', () => {
    it('should delete zone when found', async () => {
      zoneRepository.findOne.mockResolvedValue(mockZone);
      await expect(controller.remove('zone-1')).resolves.toBeUndefined();
      expect(zoneRepository.delete).toHaveBeenCalledWith('zone-1');
    });

    it('should throw NotFoundException when zone not found', async () => {
      zoneRepository.findOne.mockResolvedValue(null);
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
