import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GraphModule } from '../graph/graph.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { InviteTokenService } from './invite-token.service';
import { OboService } from 'src/graph/obo.service';

@Module({
  imports: [AuthModule, UsersModule, GraphModule],
  controllers: [InvitesController],
  providers: [InvitesService, InviteTokenService, OboService],
})
export class InvitesModule {}
