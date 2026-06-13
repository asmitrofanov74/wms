import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { JwtTokenService } from '../../../infrastructure/auth/jwt.service';
import { IUserRepository } from '../../../domain/auth/user.repository.interface';
import { Role } from '../../../domain/auth/role.entity';
import { USER_REPOSITORY } from '../../../api/common/constants/di-tokens';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;

  const mockRole: Role = {
    id: 'role-1', name: 'Admin', description: '', isSystem: true,
    permissions: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUser = {
    id: 'user-1',
    email: 'admin@wms.com',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    roles: [mockRole],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    fullName: 'Admin User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            verifyAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(USER_REPOSITORY);
    passwordService = module.get(PasswordService);
    jwtTokenService = module.get(JwtTokenService);
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      passwordService.compare.mockResolvedValue(true);
      jwtTokenService.generateAccessToken.mockResolvedValue('access-token');
      jwtTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      const result = await service.login('admin@wms.com', 'password123');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('admin@wms.com');
      expect(passwordService.compare).toHaveBeenCalledWith('password123', mockUser.passwordHash);
    });

    it('should throw UnauthorizedException when email not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.login('unknown@wms.com', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUser, isActive: false } as any);
      await expect(service.login('admin@wms.com', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      passwordService.compare.mockResolvedValue(false);
      await expect(service.login('admin@wms.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      jwtTokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user-1', tokenId: 'token-1' });
      userRepository.findById.mockResolvedValue(mockUser as any);
      jwtTokenService.generateAccessToken.mockResolvedValue('new-access-token');
      jwtTokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtTokenService.verifyRefreshToken.mockRejectedValue(new Error('invalid token'));
      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found for token', async () => {
      jwtTokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user-1', tokenId: 'token-1' });
      userRepository.findById.mockResolvedValue(null);
      await expect(service.refreshTokens('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshTokens', () => {
    it('should not throw when revoking tokens', async () => {
      await expect(service.revokeRefreshTokens('user-1')).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('new-hashed-password');

      await expect(service.changePassword('user-1', 'currentPassword', 'newPassword')).resolves.toBeUndefined();
      expect(passwordService.hash).toHaveBeenCalledWith('newPassword');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.changePassword('user-1', 'current', 'new')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      passwordService.compare.mockResolvedValue(false);
      await expect(service.changePassword('user-1', 'wrong', 'new')).rejects.toThrow(UnauthorizedException);
    });
  });
});
