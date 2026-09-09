import {
  presignedDownloadSchema,
  presignedUploadSchema,
  type CreatePresignedUploadDTO,
  type PresignedDownloadDTO,
  type PresignedUploadDTO,
} from '@akouo/contract';
import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ZodType } from 'zod';

import { LOCULUS_CONFIG, type LoculusConfig } from './loculus.config';
import { ServiceToken } from './service-token';

/**
 * akouo's client for loculus, the object store service.
 *
 * akouo asks loculus where a file may be put and hands the answer to the
 * browser, which uploads to the store directly. No recording bytes pass
 * through this process, which is the whole point: an api that streams uploads
 * is an api sized by its largest file.
 *
 * The caller's own access token is forwarded where there is a caller. pistis
 * issued it, loculus verifies it against the same keys, and relaying it keeps
 * one identity across the hop — akouo cannot ask loculus for anything the
 * person could not have asked for themselves.
 *
 * Work no person is waiting on — transcription, which starts from an event
 * after the response has gone — has nobody to borrow from, and falls back to
 * akouo's own client credentials. See {@link ServiceToken}.
 */
/**
 * A key is a path — `{requestor}/{organizationId}/{name}` — so each segment is
 * encoded on its own. `encodeURIComponent` on the whole key would turn its
 * slashes into `%2F`, and loculus's wildcard route matches real separators.
 */
const encodeKey = (objectKey: string): string =>
  objectKey.split('/').map(encodeURIComponent).join('/');

@Injectable()
export class LoculusClient {
  private readonly logger = new Logger(LoculusClient.name);

  constructor(
    @Inject(LOCULUS_CONFIG) private readonly config: LoculusConfig,
    private readonly serviceToken: ServiceToken,
  ) {}

  /** Somewhere to PUT a file, and the key it will be known by afterwards. */
  createUpload(
    request: CreatePresignedUploadDTO,
    accessToken?: string,
  ): Promise<PresignedUploadDTO> {
    return this.send(
      'POST',
      '/objects/presign',
      accessToken,
      presignedUploadSchema,
      request,
    );
  }

  /** Somewhere to GET one back from. */
  createDownload(
    objectKey: string,
    accessToken?: string,
  ): Promise<PresignedDownloadDTO> {
    return this.send(
      'GET',
      `/objects/${encodeKey(objectKey)}/presign`,
      accessToken,
      presignedDownloadSchema,
    );
  }

  async remove(objectKey: string, accessToken?: string): Promise<void> {
    await this.send(
      'DELETE',
      `/objects/${encodeKey(objectKey)}`,
      accessToken,
      null,
    );
  }

  private async send<T>(
    method: string,
    path: string,
    accessToken: string | undefined,
    schema: ZodType<T> | null,
    body?: unknown,
  ): Promise<T> {
    const response = await this.fetch(method, path, accessToken, body);

    if (!response.ok) {
      throw await this.failure(response, method, path);
    }

    if (!schema) {
      return undefined as T;
    }

    const parsed = schema.safeParse(await response.json().catch(() => null));

    if (!parsed.success) {
      // loculus answered, but not with what its contract promises. That is a
      // deployment mismatch rather than anything the caller did.
      this.logger.error(
        `loculus answered ${method} ${path} with an unexpected body: ${parsed.error.message}`,
      );

      throw new BadGatewayException('The object store gave an unusable answer.');
    }

    return parsed.data;
  }

  private async fetch(
    method: string,
    path: string,
    accessToken: string | undefined,
    body?: unknown,
  ): Promise<Response> {
    /*
     * The caller's token where there is a caller, akouo's own where there is
     * not. Reads triggered by a background job have nobody to borrow from.
     */
    const token = accessToken ?? (await this.serviceToken.get());

    try {
      return await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: {
          // Relayed as given: loculus verifies it against pistis itself.
          authorization: `Bearer ${token}`,
          ...(body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === 'TimeoutError';

      this.logger.error(
        `loculus did not answer ${method} ${path}: ${
          cause instanceof Error ? cause.message : 'unknown failure'
        }`,
      );

      throw timedOut
        ? new GatewayTimeoutException('The object store did not answer in time.')
        : new BadGatewayException('The object store could not be reached.');
    }
  }

  /**
   * Turns loculus's refusal into akouo's.
   *
   * A 401 from loculus is *not* passed through as a 401: the caller's token was
   * good enough to reach this handler, so telling them to authenticate again
   * would send them round a loop that cannot help. It means the two services
   * disagree about pistis — a different issuer or audience — which is akouo's
   * problem to fix, and a 502 says so. A 404 and a 400 do belong to the caller
   * and are relayed unchanged.
   */
  private async failure(
    response: Response,
    method: string,
    path: string,
  ): Promise<HttpException> {
    const detail = await response.text().catch(() => '');

    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `loculus refused akouo's token for ${method} ${path} (${response.status}). ` +
          'Check that both services name the same pistis issuer and audience.',
      );

      return new BadGatewayException('The object store refused this request.');
    }

    return new HttpException(
      detail || `The object store failed ${method} ${path}.`,
      response.status >= 400 && response.status < 500
        ? response.status
        : HttpStatusBadGateway,
    );
  }
}

/** 502, spelled out so the ternary above stays readable. */
const HttpStatusBadGateway = 502;
