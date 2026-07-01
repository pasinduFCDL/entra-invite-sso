import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GraphModule } from '../graph/graph.module';
import { InvitesController } from './invites.controller';
import { InvitesDevController } from './invites-dev.controller';
import { InvitesService } from './invites.service';
import { InviteTokenService } from './invite-token.service';

@Module({
  imports: [AuthModule, UsersModule, GraphModule],
  controllers: [InvitesController, InvitesDevController],
  providers: [InvitesService, InviteTokenService],
})
export class InvitesModule {}
