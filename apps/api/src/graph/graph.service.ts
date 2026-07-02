import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';

export interface DirectoryUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
}

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  /**
   * Looks up a user in the partner directory by UPN (or mail), using an
   * already-acquired Microsoft Graph access token. Returns the matched
   * directory user, or null if no user exists. The caller decides how the
   * token was obtained (OBO in production, ROPC in dev).
   */
  /**
   * Returns the signed-in user's own profile from Graph (/me).
   * Throws if the token is invalid, expired, or lacks User.Read scope.
   * Used by the accept-invite flow to verify the Entra identity of the
   * user who clicked the invite link.
   */
  async getMe(graphToken: string): Promise<DirectoryUser> {
    const client = Client.init({ authProvider: (done) => done(null, graphToken) });
    const me = await client
      .api('/me')
      .select('id,displayName,mail,userPrincipalName')
      .get();
    return me as DirectoryUser;
  }

  async findUserByUpn(graphToken: string, upn: string): Promise<DirectoryUser | null> {
    const client = Client.init({ authProvider: (done) => done(null, graphToken) });

    // Escape single quotes to avoid OData injection.
    const safe = upn.replace(/'/g, "''");

    try {
      const res = await client
        .api('/users')
        .filter(`userPrincipalName eq '${safe}' or mail eq '${safe}'`)
        .select('id,displayName,mail,userPrincipalName')
        .top(1)
        .get();

      const match = res?.value?.[0];
      return match ?? null;
    } catch (err) {
      // 403 => delegated permission / admin consent missing (config error),
      // distinct from "user not found" (which is an empty result above).
      const status = err?.statusCode;
      if (status === 403) {
        this.logger.error(
          'Graph returned 403 — verify User.ReadBasic.All delegated permission and admin consent.',
        );
        throw new ServiceUnavailableException('Directory lookup not permitted (consent missing)');
      }
      this.logger.error(`Graph lookup failed: ${err.message}`);
      throw new ServiceUnavailableException('Directory lookup failed');
    }
  }
}
