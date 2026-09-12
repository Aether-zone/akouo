import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Readable } from 'node:stream';

import { LOCULUS_BACKEND } from '../loculus/loculus.config';
import { FileService } from './file.service';
import type { StoredFile } from './file.entity';

const stored = {
  id: 'file-1',
  key: 'abc-a.mp3',
  bucket: LOCULUS_BACKEND,
  organizationId: 'org-1',
} as StoredFile;

function harness(overrides: Record<string, unknown> = {}) {
  const loculus = {
    createUpload: jest.fn().mockResolvedValue({
      objectKey: 'abc-a.mp3',
      uploadUrl: 'http://store/put',
      expiresAt: new Date(),
    }),
    createDownload: jest
      .fn()
      .mockResolvedValue({ downloadUrl: 'http://store/get' }),
    remove: jest.fn().mockResolvedValue(undefined),
    ...(overrides.loculus as object),
  };
  const fileRepository = {
    findOneBy: jest.fn().mockResolvedValue(overrides.file ?? stored),
    save: jest.fn((entity: object) => ({ id: 'file-1', ...entity })),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new FileService(fileRepository as never, loculus as never),
    loculus,
    fileRepository,
  };
}

const okResponse = () =>
  ({
    ok: true,
    status: 200,
    body: Readable.toWeb(Readable.from(['bytes'])),
  }) as unknown as Response;

describe('upload', () => {
  const upload = {
    body: Readable.from(['bytes']),
    originalName: 'a.mp3',
    mimeType: 'audio/mpeg',
    size: 5,
    organizationId: 'org-1',
    accessToken: 'token',
  };

  it('spends a presigned URL, sending exactly what was signed', async () => {
    const { service, loculus } = harness();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as never;

    await service.upload(upload);

    expect(loculus.createUpload).toHaveBeenCalledWith(
      {
        fileName: 'a.mp3',
        contentType: 'audio/mpeg',
        size: 5,
        // Carried so loculus can record which tenant the file was for.
        organizationId: 'org-1',
      },
      'token',
    );
    expect(fetchMock.mock.calls[0][0]).toBe('http://store/put');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { 'content-type': 'audio/mpeg', 'content-length': '5' },
    });
  });

  it('records the row before the bytes, and marks it uploaded after', async () => {
    const { service, fileRepository } = harness();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as never;

    const result = await service.upload(upload);

    // Two saves: INITIAL on the way in, UPLOADED once the object landed.
    expect(fileRepository.save).toHaveBeenCalledTimes(2);
    expect(fileRepository.save.mock.calls[0][0]).toMatchObject({
      status: 'INITIAL',
      bucket: LOCULUS_BACKEND,
    });
    expect(result.status).toBe('UPLOADED');
  });

  it('leaves the row INITIAL when the store refuses the bytes', async () => {
    const { service, fileRepository } = harness();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 }) as never;

    await expect(service.upload(upload)).rejects.toThrow(
      ServiceUnavailableException,
    );
    // Saved once — a row a sweep can find, not a file claiming to exist.
    expect(fileRepository.save).toHaveBeenCalledTimes(1);
  });
});

describe('openStream', () => {
  it('reads the object through a presigned URL', async () => {
    const { service, loculus } = harness();
    global.fetch = jest.fn().mockResolvedValue(okResponse()) as never;

    const stream = await service.openStream(stored, undefined, 'token');

    expect(loculus.createDownload).toHaveBeenCalledWith('abc-a.mp3', 'token');
    expect(stream).toBeInstanceOf(Readable);
  });

  it('passes a Range through to the store', async () => {
    const { service } = harness();
    const fetchMock = jest.fn().mockResolvedValue(okResponse());
    global.fetch = fetchMock as never;

    await service.openStream(stored, { start: 5, end: 9 });

    expect(fetchMock.mock.calls[0][1]).toEqual({
      headers: { range: 'bytes=5-9' },
    });
  });

  it('is a 404 when the row outlived its object', async () => {
    const { service } = harness();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as never;

    await expect(service.openStream(stored)).rejects.toThrow(NotFoundException);
  });
});

describe('getUrl', () => {
  it('hands back loculus’s own signed URL', async () => {
    const { service } = harness();

    await expect(service.getUrl('file-1', 'token')).resolves.toBe(
      'http://store/get',
    );
  });

  it('falls back to akouo’s own identity when no caller is relaying one', async () => {
    const { service, loculus } = harness();

    // Background work — the transcriber — has nobody to borrow from.
    await service.getUrl('file-1');

    expect(loculus.createDownload).toHaveBeenCalledWith('abc-a.mp3', undefined);
  });
});

describe('delete', () => {
  it('removes the object, then the row', async () => {
    const { service, loculus, fileRepository } = harness();

    await service.delete('file-1', 'token');

    expect(loculus.remove).toHaveBeenCalledWith('abc-a.mp3', 'token');
    expect(fileRepository.delete).toHaveBeenCalledWith('file-1');
  });
});

describe('findByIdInOrganization', () => {
  it('refuses a file belonging to another organization', async () => {
    const { service } = harness({
      file: { ...stored, organizationId: 'org-2' },
    });

    await expect(
      service.findByIdInOrganization('file-1', 'org-1'),
    ).rejects.toThrow(NotFoundException);
  });
});

/*
 * The other way in, for loculus's `object.uploaded`. No organization and no id:
 * an event has neither, and the key is loculus's own — see the method.
 */
describe('markUploadedByKey', () => {
  it('settles the row the key names', async () => {
    const { service, fileRepository } = harness();

    const settled = await service.markUploadedByKey('abc-a.mp3');

    expect(fileRepository.findOneBy).toHaveBeenCalledWith({ key: 'abc-a.mp3' });
    expect(settled?.status).toBe('UPLOADED');
  });

  it('has nothing to say about a key it never handed out', async () => {
    // Another service's object in the shared bucket. Ordinary, not an error.
    const { service, fileRepository } = harness();
    // Set here rather than through `harness`, whose `??` reads a null override
    // as "not given" and falls back to the stored row.
    fileRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.markUploadedByKey('aether/org-1/x.pdf'),
    ).resolves.toBeNull();
  });

  it('leaves a settled row alone rather than writing it again', async () => {
    /*
     * At-least-once delivery means this runs more than once for one upload, and
     * `updatedAt` is an `@UpdateDateColumn` — re-saving would make the file look
     * freshly changed every time the broker repeated itself.
     */
    const { service, fileRepository } = harness({
      file: { ...stored, status: 'UPLOADED' },
    });

    await service.markUploadedByKey('abc-a.mp3');

    expect(fileRepository.save).not.toHaveBeenCalled();
  });
});
