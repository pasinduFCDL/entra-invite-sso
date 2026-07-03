import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/user-status.enum';

/**
 * Confirms the authenticated requester is an active Admin in our local users
 * table. Must run AFTER AzureJwtGuard (relies on req.user claims).
 *
 * The requester's email is taken from the token's `preferred_username` (UPN)
 * or `email` claim, then matched against the local users table.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const claims = req.user || {};
    const email: string = claims.preferred_username || claims.upn || claims.email;

    if (!email) {
      throw new ForbiddenException('Cannot determine requester identity');
    }

    const user = await this.users.findByEmail(email);
    if (!user || user.role?.name !== UserRole.ADMIN || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Admin role required');
    }

    // Expose the resolved local user for downstream handlers (e.g. invited_by)
    req.localUser = user;
    return true;
  }
}
