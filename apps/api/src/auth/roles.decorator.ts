import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or controller) to the given app roles. Must be used
 * together with AppJwtGuard, which populates `req.appUser`.
 *
 * @example
 *   @UseGuards(AppJwtGuard, RolesGuard)
 *   @Roles('admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
