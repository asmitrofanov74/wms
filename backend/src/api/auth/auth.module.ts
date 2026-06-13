import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtTokenService } from '../../infrastructure/auth/jwt.service';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { User } from '../../domain/auth/user.entity';
import { RefreshToken } from '../../domain/auth/refresh-token.entity';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.impl';
import { USER_REPOSITORY } from '../common/constants/di-tokens';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtTokenService,
    PasswordService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
