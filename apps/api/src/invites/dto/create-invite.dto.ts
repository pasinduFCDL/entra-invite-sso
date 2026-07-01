import { IsIn, IsString, Matches } from 'class-validator';
import { UserRole } from '../../users/user-status.enum';

export class CreateInviteDto {
  /**
   * Local part of the email only (Option A). The partner domain
   * (TARGET_INVITE_DOMAIN) is appended on the backend.
   * e.g. "jane" -> jane@partnerorg.com
   */
  @IsString()
  @Matches(/^[a-zA-Z0-9._%+-]+$/, {
    message: 'username must be the local part of the email (no domain)',
  })
  username: string;

  @IsIn([UserRole.ADMIN, UserRole.MEMBER, UserRole.VIEWER])
  role: string;
}
