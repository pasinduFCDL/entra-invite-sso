import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  /** A valid Microsoft Graph access token for the signed-in user (scope: User.Read) */
  @IsString()
  @IsNotEmpty()
  entraToken: string;
}
