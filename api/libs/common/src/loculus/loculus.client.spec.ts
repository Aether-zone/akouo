import {
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';

import { LoculusClient } from './loculus.client';
import { defaultLoculusConfig } from './loculus.config';

const config = { ...defaultLoculusConfig, baseUrl: 'http://loculus.test' };

const upload = {
  fileName: 'a.mp3',
  contentType: 'audio/mpeg',
  size: 10,
};

const presigned = {
  objectKey: 'abc-a.mp3',
  uploadUrl: 'http://store.test/abc-a.mp3?X-Amz-Signature=x',
  expiresAt: new Date(Date.now() + 900_000).toISOString(),
};

/** Stands in for `fetch`, recording what the client sent. */
function harness(response: Partial<Response> | Error) {
  const fetchMock = jest.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response as Response),
  );
  global.fetch = fetchMock as unknown as typeof fetch;

  return { client: new LoculusClient(config), fetchMock };
}

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;

const failing = (status: number, text = '') =>
  ({
    ok: false,
    status,
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(null),
  }) as Response;

describe('createUpload', () => {
  it('relays the caller’s token and returns what loculus signed', async () => {
    const { client, fetchMock } = harness(ok(presigned));

    const result = await client.createUpload(upload, 'token-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://loculus.test/objects/presign',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer token-123',
        }),
      }),
    );
    expect(result.objectKey).toBe('abc-a.mp3');
    // Parsed from the ISO string every caller would otherwise convert itself.
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('is a 502 when loculus answers with something else', async () => {
    const { client } = harness(ok({ objectKey: 'abc', nope: true }));

    await expect(client.createUpload(upload, 't')).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('is a 502, not a 401, when loculus refuses akouo’s token', async () => {
    // The caller's token was good enough to reach the handler, so answering
    // 401 would send them round a loop that cannot help — the two services
    // disagree about pistis, which is akouo's problem.
    const { client } = harness(failing(401));

    await expect(client.createUpload(upload, 't')).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('is a 504 when loculus does not answer in time', async () => {
    const timeout = Object.assign(new Error('timed out'), {
      name: 'TimeoutError',
    });
    const { client } = harness(timeout);

    await expect(client.createUpload(upload, 't')).rejects.toThrow(
      GatewayTimeoutException,
    );
  });

  it('is a 502 when loculus cannot be reached at all', async () => {
    const { client } = harness(new TypeError('fetch failed'));

    await expect(client.createUpload(upload, 't')).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('relays a refusal that belongs to the caller', async () => {
    const { client } = harness(failing(400, 'size must be positive'));

    await expect(client.createUpload(upload, 't')).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('createDownload', () => {
  it('escapes the key into the path', async () => {
    const { client, fetchMock } = harness(
      ok({ ...presigned, downloadUrl: presigned.uploadUrl, uploadUrl: undefined }),
    );

    await client.createDownload('a b.mp3', 't');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://loculus.test/objects/a%20b.mp3/presign',
    );
  });

  it('relays a 404 as a 404, because that one is the caller’s', async () => {
    const { client } = harness(failing(404, 'No object with key "x".'));

    await expect(client.createDownload('x', 't')).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('remove', () => {
  it('sends a DELETE and expects no body back', async () => {
    const { client, fetchMock } = harness({ ok: true, status: 204 } as Response);

    await expect(client.remove('abc-a.mp3', 't')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
  });
});
