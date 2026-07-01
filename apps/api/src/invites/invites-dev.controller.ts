import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OboService } from '../graph/obo.service';
import { UsersService } from '../users/users.service';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

/**
 * DEV-ONLY invite endpoint. Skips the Entra sign-in / bearer-token guards and
 * instead acquires the admin's delegated token from hard-coded ROPC creds,
 * then runs the exact same OBO -> Graph -> invite flow.
 *
 * Enabled only when DEV_MODE=true. Remove or disable before production;
 * production traffic must use the guarded POST /api/invites.
 */
@Controller('invites')
export class InvitesDevController {
  private readonly logger = new Logger(InvitesDevController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly obo: OboService,
    private readonly users: UsersService,
    private readonly invites: InvitesService,
  ) {}

  @Post('dev')
  @HttpCode(200)
  async devInvite(@Body() dto: CreateInviteDto) {
    if (!this.config.get<boolean>('dev.enabled')) {
      throw new ForbiddenException('Dev invite endpoint is disabled');
    }

    const username = this.config.get<string>('dev.adminUsername');
    const password = this.config.get<string>('dev.adminPassword');
    if (!username || !password) {
      throw new ForbiddenException('DEV_ADMIN_USERNAME / DEV_ADMIN_PASSWORD not configured');
    }

    this.logger.warn(`DEV invite requested by hard-coded admin ${username}`);

    // 1. Acquire a Graph token directly via ROPC (stands in for sign-in + OBO).
    const graphToken = await this.obo.getGraphTokenByPassword(username, password);

    // 2. Resolve the local admin record for invited_by (may be null if not seeded).
    const admin = await this.users.findByEmail(username);

    // 3. Same invite flow: Graph verify -> state machine.
    return this.invites.invite(dto, graphToken, admin?.id);
  }
}
