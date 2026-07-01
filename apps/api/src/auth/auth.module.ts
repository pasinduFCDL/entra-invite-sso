import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AzureJwtGuard } from './azure-jwt.guard';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [UsersModule],
  providers: [AzureJwtGuard, AdminGuard],
  exports: [AzureJwtGuard, AdminGuard],
})
export class AuthModule {}
