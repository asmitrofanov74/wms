import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/services/auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto, LoginResponseDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshTokens: jest.fn(),
            revokeRefreshTokens: jest.fn(),
            changePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const dto: LoginDto = { email: 'admin@wms.com', password: 'password123' };
      const expected: LoginResponseDto = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith('admin@wms.com', 'password123');
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens and return new tokens', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'old-rt' };
      const expected: LoginResponseDto = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 900 };
      authService.refreshTokens.mockResolvedValue(expected);

      const result = await controller.refresh(dto);

      expect(result).toEqual(expected);
      expect(authService.refreshTokens).toHaveBeenCalledWith('old-rt');
    });
  });

  describe('logout', () => {
    it('should call authService.revokeRefreshTokens with user id', async () => {
      await controller.logout('user-1');
      expect(authService.revokeRefreshTokens).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with user id and dto', async () => {
      const dto: ChangePasswordDto = { currentPassword: 'old', newPassword: 'new' };
      await controller.changePassword('user-1', dto);
      expect(authService.changePassword).toHaveBeenCalledWith('user-1', 'old', 'new');
    });
  });
});
