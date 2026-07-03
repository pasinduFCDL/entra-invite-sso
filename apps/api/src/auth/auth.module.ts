import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { GraphModule } from '../graph/graph.module';
import { AzureJwtGuard } from './azure-jwt.guard';
import { AdminGuard } from './admin.guard';
import { AppJwtGuard } from './app-jwt.guard';
import { RolesGuard } from './roles.guard';
import { AppJwtService } from './app-jwt.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    GraphModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('auth.jwtExpires') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AzureJwtGuard, AdminGuard, AppJwtGuard, RolesGuard, AppJwtService, AuthService],
  exports: [AzureJwtGuard, AdminGuard, AppJwtGuard, RolesGuard, AppJwtService],
})
export class AuthModule {}
