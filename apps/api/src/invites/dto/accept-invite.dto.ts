import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInviteDto {
  /** The invitation JWT from the invite URL (?token=...) */
  @IsString()
  @IsNotEmpty()
  invitationToken: string;

  /** A valid Microsoft Graph access token for the signed-in user (scope: User.Read) */
  @IsString()
  @IsNotEmpty()
  entraToken: string;
}
