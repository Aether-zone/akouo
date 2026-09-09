import { Inject, Injectable, Logger } from '@nestjs/common';

import { LOCULUS_CONFIG, type LoculusConfig } from './loculus.config';

/** Renew this long before expiry, so a token never expires mid-request. */
const RENEW_BEFORE_MS = 30_000;

/**
 * akouo's own access token, for work no person is waiting on.
 *
 * The presign and claim paths relay the caller's token, which is right while
 * there is a caller: one identity crosses the hop and akouo cannot ask loculus
 * for anything the person could not. Background work has no such caller —
 * transcription starts from an event, after the response has gone — so it needs
 * a credential of akouo's own, which is what the client credentials grant is.
 *
 * The token is cached until shortly before it expires. A burst of listeners
 * waking at once shares one request rather than each asking pistis, and a
 * failure is not cached: pistis being briefly unreachable should cost one
 * retry, not every request until the process restarts.
 */
@Injectable()
export class ServiceToken {
  private readonly logger = new Logger(ServiceToken.name);
  private cached: { token: string; expiresAt: number } | null = null;
  private inFlight: Promise<string> | null = null;

  constructor(
    @Inject(LOCULUS_CONFIG) private readonly config: LoculusConfig,
  ) {}

  async get(): Promise<string> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.token;
    }

    this.inFlight ??= this.request().finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  private async request(): Promise<string> {
    const credentials = this.config.serviceCredentials;

    if (!credentials) {
      throw new Error(
        'akouo has no service credentials, so it cannot reach loculus without a ' +
          'caller to borrow a token from. Set OAUTH_CLIENT_ID and ' +
          'OAUTH_CLIENT_SECRET, and register the client for the ' +
          'client_credentials grant in pistis.',
      );
    }

    const response = await fetch(credentials.tokenUri, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');

      this.logger.error(
        `pistis refused akouo's client credentials (${response.status}): ${detail}`,
      );

      throw new Error('Could not obtain a service token from pistis.');
    }

    const body = (await response.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };

    if (typeof body.access_token !== 'string') {
      throw new Error('pistis returned no access token.');
    }

    const lifetime =
      typeof body.expires_in === 'number' ? body.expires_in : 3600;

    this.cached = {
      token: body.access_token,
      expiresAt: Date.now() + lifetime * 1000 - RENEW_BEFORE_MS,
    };

    return body.access_token;
  }
}
