import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GraphModule } from '../graph/graph.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { InviteTokenService } from './invite-token.service';
import { AppJwtService } from './app-jwt.service';
import { OboService } from 'src/graph/obo.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GraphModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("auth.jwtSecret"),
        signOptions: { expiresIn: config.get<string>("auth.jwtExpires") },
      }),
    }),
  ],
  controllers: [InvitesController],
  providers: [InvitesService, InviteTokenService, AppJwtService, OboService],
})
export class InvitesModule {}
