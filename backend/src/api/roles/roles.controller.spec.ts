import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesController } from './roles.controller';
import { Role } from '../../domain/auth/role.entity';
import { Permission } from '../../domain/auth/permission.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

describe('RolesController', () => {
  let controller: RolesController;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;

  const mockPermission: Permission = {
    id: 'perm-1', resource: 'users', action: 'create', description: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockRole: Role = {
    id: 'role-1', name: 'Admin', description: 'Admin role', isSystem: true,
    permissions: [mockPermission],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findByIds: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findByIds: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    roleRepository = module.get(getRepositoryToken(Role));
    permissionRepository = module.get(getRepositoryToken(Permission));
  });

  describe('listPermissions', () => {
    it('should return all permissions ordered by resource and action', async () => {
      permissionRepository.find.mockResolvedValue([mockPermission]);
      const result = await controller.listPermissions();
      expect(result.length).toBe(1);
      expect(permissionRepository.find).toHaveBeenCalledWith({ order: { resource: 'ASC', action: 'ASC' } });
    });
  });

  describe('findAll', () => {
    it('should return all roles with permission strings', async () => {
      roleRepository.find.mockResolvedValue([mockRole]);
      const result = await controller.findAll();
      expect(result.length).toBe(1);
      expect(result[0].permissions).toEqual(['users:create']);
    });
  });

  describe('create', () => {
    it('should create a role and return response DTO', async () => {
      const dto: CreateRoleDto = { name: 'Viewer', description: 'Can view', permissionIds: ['perm-1'] };
      roleRepository.findOne.mockResolvedValue(null);
      permissionRepository.findByIds.mockResolvedValue([mockPermission]);
      roleRepository.save.mockResolvedValue({ ...mockRole, id: 'role-2', name: 'Viewer', isSystem: false } as Role);

      const result = await controller.create(dto);

      expect(result.name).toBe('Viewer');
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when role name already exists', async () => {
      const dto: CreateRoleDto = { name: 'Admin' };
      roleRepository.findOne.mockResolvedValue(mockRole);
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return role when found', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      const result = await controller.findOne('role-1');
      expect(result.name).toBe('Admin');
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a non-system role', async () => {
      const dto: UpdateRoleDto = { name: 'Updated' };
      const nonSystemRole = { ...mockRole, isSystem: false };
      roleRepository.findOne.mockResolvedValue(nonSystemRole as Role);
      roleRepository.save.mockResolvedValue({ ...nonSystemRole, name: 'Updated' } as Role);

      const result = await controller.update('role-1', dto);

      expect(result.name).toBe('Updated');
    });

    it('should throw BadRequestException when trying to modify system role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      await expect(controller.update('role-1', {} as UpdateRoleDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      await expect(controller.update('nonexistent', {} as UpdateRoleDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a non-system role', async () => {
      const nonSystemRole = { ...mockRole, isSystem: false };
      roleRepository.findOne.mockResolvedValue(nonSystemRole as Role);
      await expect(controller.remove('role-1')).resolves.toBeUndefined();
      expect(roleRepository.delete).toHaveBeenCalledWith('role-1');
    });

    it('should throw BadRequestException when trying to delete system role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      await expect(controller.remove('role-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissions', () => {
    it('should return permission strings for role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      const result = await controller.getPermissions('role-1');
      expect(result).toEqual(['users:create']);
    });
  });

  describe('setPermissions', () => {
    it('should assign permissions to role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findByIds.mockResolvedValue([mockPermission]);
      await expect(controller.setPermissions('role-1', { permissionIds: ['perm-1'] })).resolves.toBeUndefined();
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      await expect(controller.setPermissions('nonexistent', { permissionIds: [] })).rejects.toThrow(NotFoundException);
    });
  });
});
