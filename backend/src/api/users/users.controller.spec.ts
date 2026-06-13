import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersController } from './users.controller';
import { IUserRepository } from '../../domain/auth/user.repository.interface';
import { User } from '../../domain/auth/user.entity';
import { Role } from '../../domain/auth/role.entity';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { USER_REPOSITORY } from '../common/constants/di-tokens';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let userRepository: jest.Mocked<IUserRepository>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let passwordService: jest.Mocked<PasswordService>;

  const mockRole: Role = {
    id: 'role-1', name: 'Admin', description: '', isSystem: true,
    permissions: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@wms.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    roles: [mockRole],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    fullName: 'John Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: USER_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
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
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    userRepository = module.get(USER_REPOSITORY);
    roleRepository = module.get(getRepositoryToken(Role));
    passwordService = module.get(PasswordService);
  });

  describe('findAll', () => {
    it('should return all users as response DTOs', async () => {
      userRepository.findAll.mockResolvedValue([mockUser as User]);
      const result = await controller.findAll();
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('user@wms.com');
      expect(result[0].roles).toEqual(['Admin']);
    });
  });

  describe('create', () => {
    it('should create a user and return response DTO', async () => {
      const dto: CreateUserDto = { email: 'new@wms.com', password: 'password123', firstName: 'New', lastName: 'User', roleIds: ['role-1'] };
      passwordService.hash.mockResolvedValue('hashed-password');
      roleRepository.findByIds.mockResolvedValue([mockRole]);
      userRepository.save.mockResolvedValue({ ...mockUser, id: 'new-id', email: 'new@wms.com', firstName: 'New', lastName: 'User' } as User);

      const result = await controller.create(dto);

      expect(result.email).toBe('new@wms.com');
      expect(passwordService.hash).toHaveBeenCalledWith('password123');
      expect(roleRepository.findByIds).toHaveBeenCalledWith(['role-1']);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should create user without roles when roleIds is empty', async () => {
      const dto: CreateUserDto = { email: 'new@wms.com', password: 'password123', firstName: 'New', lastName: 'User' };
      passwordService.hash.mockResolvedValue('hashed-password');
      userRepository.save.mockResolvedValue({ ...mockUser, id: 'new-id', email: 'new@wms.com' } as User);

      const result = await controller.create(dto);

      expect(result.email).toBe('new@wms.com');
      expect(roleRepository.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      userRepository.findById.mockResolvedValue(mockUser as User);
      const result = await controller.findOne('user-1');
      expect(result.email).toBe('user@wms.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user fields and return response DTO', async () => {
      const dto: UpdateUserDto = { firstName: 'Jane', roleIds: ['role-1'] };
      userRepository.findById.mockResolvedValue(mockUser as User);
      roleRepository.findByIds.mockResolvedValue([mockRole]);
      userRepository.save.mockResolvedValue({ ...mockUser, firstName: 'Jane' } as User);

      const result = await controller.update('user-1', dto);

      expect(result.firstName).toBe('Jane');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(controller.update('nonexistent', {} as UpdateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle isActive and return updated user', async () => {
      userRepository.findById.mockResolvedValue({ ...mockUser, isActive: true } as User);
      userRepository.save.mockResolvedValue({ ...mockUser, isActive: false } as User);

      const result = await controller.toggleActive('user-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      userRepository.delete.mockResolvedValue(undefined);
      await expect(controller.remove('user-1')).resolves.toBeUndefined();
      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });
  });
});
