import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';

/**
 * Performs the On-Behalf-Of (OBO) token exchange: takes the admin's inbound
 * API access token and exchanges it for a Microsoft Graph access token that
 * acts as the admin (delegated permissions, no application permission needed).
 */
@Injectable()
export class OboService {
  private readonly logger = new Logger(OboService.name);
  private readonly cca: ConfidentialClientApplication;
  private readonly graphScope: string;

  constructor(private readonly config: ConfigService) {
    const tenantId = this.config.get<string>('azure.tenantId');
    this.graphScope = this.config.get<string>('azure.graphScope');
    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: this.config.get<string>('azure.clientId'),
        clientSecret: this.config.get<string>('azure.clientSecret'),
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }

  /**
   * DEV ONLY: acquires a Microsoft Graph access token directly using the
   * admin's username/password (ROPC), skipping the OBO hop. Uses the same
   * delegated Graph scope, so it exercises the admin's delegated permission
   * (no application permission). Fails for MFA/federated accounts.
   */
  async getGraphTokenByPassword(username: string, password: string): Promise<string> {
    try {
      const result = await this.cca.acquireTokenByUsernamePassword({
        scopes: [this.graphScope],
        username,
        password,
      });
      if (!result?.accessToken) {
        throw new Error('ROPC returned no access token');
      }
      return result.accessToken;
    } catch (err) {
      this.logger.error(`ROPC token acquisition failed: ${err.message}`);
      throw new InternalServerErrorException(
        'Failed to acquire Graph token via password (ROPC)',
      );
    }
  }

  async getGraphToken(userApiToken: string): Promise<string> {
    try {
      const result = await this.cca.acquireTokenOnBehalfOf({
        oboAssertion: userApiToken,
        scopes: [this.graphScope],
      });
      if (!result?.accessToken) {
        throw new Error('OBO returned no access token');
      }
      return result.accessToken;
    } catch (err) {
      this.logger.error(`OBO exchange failed: ${err.message}`);
      throw new InternalServerErrorException('Failed to acquire Graph token (OBO)');
    }
  }
}
