import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppTokenPayload } from './app-jwt.service';
import { ROLES_KEY } from './roles.decorator';

/**
 * Authorizes the request against the roles declared with @Roles(...). Must run
 * AFTER AppJwtGuard, which sets `req.appUser` from the app session JWT.
 *
 * If no @Roles() is present, the route is allowed (authentication-only).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user: AppTokenPayload | undefined = req.appUser;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
