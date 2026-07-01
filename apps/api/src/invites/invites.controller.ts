import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AzureJwtGuard } from '../auth/azure-jwt.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AzureToken, CurrentUser } from '../auth/request-context.decorator';
import { User } from '../users/entities/user.entity';
import { OboService } from '../graph/obo.service';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
@UseGuards(AzureJwtGuard, AdminGuard)
export class InvitesController {
  constructor(
    private readonly invites: InvitesService,
    private readonly obo: OboService,
  ) {}

  @Post()
  @HttpCode(200) // 200 for renew; created path returns its own code in the body
  async create(
    @Body() dto: CreateInviteDto,
    @AzureToken() adminApiToken: string,
    @CurrentUser() admin: User,
  ) {
    // Production flow: exchange the admin's delegated API token for a Graph
    // token via OBO, then run the invite.
    const graphToken = await this.obo.getGraphToken(adminApiToken);
    return this.invites.invite(dto, graphToken, admin.id);
  }
}
