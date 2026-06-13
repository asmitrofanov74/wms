import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { JwtTokenService } from '../../../infrastructure/auth/jwt.service';
import { IUserRepository } from '../../../domain/auth/user.repository.interface';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { LoginResponseDto } from '../../../api/auth/dto/login.dto';
import * as crypto from 'crypto';
import { USER_REPOSITORY } from '../../../api/common/constants/di-tokens';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.passwordService.compare(
      password,
      user['passwordHash'],
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<LoginResponseDto> {
    try {
      const payload = await this.jwtTokenService.verifyRefreshToken(
        refreshToken,
      );
      const tokenHash = this.hashToken(refreshToken);
      // In production, verify tokenHash exists in DB and is not revoked
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async revokeRefreshTokens(userId: string): Promise<void> {
    // Implementation: update refresh_tokens SET revoked_at = NOW()
    // WHERE user_id = $1 AND revoked_at IS NULL
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await this.passwordService.compare(
      currentPassword,
      user['passwordHash'],
    );
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await this.passwordService.hash(newPassword);
    // Update user password hash in DB
  }

  private async generateTokens(user: any): Promise<LoginResponseDto> {
    const tokenId = uuidv4();
    const roles = user.roles?.map((r: any) => r.name) || [];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtTokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        roles,
      }),
      this.jwtTokenService.generateRefreshToken({
        sub: user.id,
        tokenId,
      }),
    ]);

    // Store refresh token hash in DB for revocation
    const tokenHash = this.hashToken(refreshToken);
    // Save to refresh_tokens table

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
