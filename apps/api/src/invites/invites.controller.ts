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
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller("invites")
export class InvitesController {
  constructor(
    private readonly invites: InvitesService,
    private readonly obo: OboService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseGuards(AzureJwtGuard, AdminGuard)
  async create(@Body() dto: CreateInviteDto, @AzureToken() adminApiToken: string, @CurrentUser() admin: User) {
    const graphToken = await this.obo.getGraphToken(adminApiToken);
    return this.invites.invite(dto, graphToken, admin.id);
  }

  @Post("dev")
  @HttpCode(200)
  async devInvite(@Body() dto: CreateInviteDto) {
    return this.invites.devInvite(dto);
  }

  @Post("accept")
  @HttpCode(200)
  accept(@Body() dto: AcceptInviteDto) {
    return this.invites.accept(dto);
  }
}
