import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { LOCULUS_BACKEND } from '@akouo/common';

import { RecordingService } from './recording.service';

const actor = {
  id: 'user-1',
  organizationId: 'org-1',
  role: 'member',
  organizationName: 'Acme',
  clientId: 'akouo',
  scopes: [],
  organizations: {},
} as never;

const request = { fileName: 'a.mp3', contentType: 'audio/mpeg', size: 10 };

const presigned = {
  objectKey: 'abc-a.mp3',
  uploadUrl: 'http://store.test/abc-a.mp3?X-Amz-Signature=x',
  expiresAt: new Date(),
};

/** The service with every collaborator stubbed; only the wiring is under test. */
function harness(overrides: Record<string, unknown> = {}) {
  const fileService = {
    createPending: jest.fn().mockResolvedValue({ id: 'file-1' }),
    findByIdInOrganization: jest.fn(),
    markUploaded: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    ...(overrides.fileService as object),
  };
  const loculus = {
    createUpload: jest.fn().mockResolvedValue(presigned),
    createDownload: jest.fn().mockResolvedValue({}),
    ...(overrides.loculus as object),
  };
  const meetingService = { findById: jest.fn().mockResolvedValue({}) };
  /* `create` reads the row back through a query builder; each call chains. */
  const built = {
    leftJoinAndSelect: () => built,
    where: () => built,
    andWhere: () => built,
    getOne: () => Promise.resolve({ id: 'recording-1', file: {} }),
  };
  const recordingRepository = {
    save: jest.fn((e: unknown) => ({ ...(e as object), id: 'recording-1' })),
    createQueryBuilder: () => built,
  };
  const recordingMapper = { toEntity: jest.fn(() => ({})), toDTO: jest.fn(() => ({})) };
  const eventEmitter = { emit: jest.fn() };

  const service = new RecordingService(
    recordingRepository as never,
    recordingMapper as never,
    fileService as never,
    eventEmitter as never,
    meetingService as never,
    loculus as never,
  );

  return { service, fileService, loculus, meetingService };
}

describe('presignUpload', () => {
  it('checks the meeting before asking loculus for anything', async () => {
    const { service, meetingService, loculus } = harness();

    await service.presignUpload(actor, 'meeting-1', request, 'token');

    expect(meetingService.findById).toHaveBeenCalledWith(actor, 'meeting-1');
    expect(loculus.createUpload).toHaveBeenCalledWith(
      { ...request, organizationId: 'org-1' },
      'token',
    );
  });

  it('files the object under the actor’s organization, not the request’s', async () => {
    const { service, loculus } = harness();

    // Provenance dictated by the thing being recorded is worth nothing:
    // loculus stores what it is told without checking, so a browser naming
    // someone else's tenant must not reach it.
    await service.presignUpload(
      actor,
      'meeting-1',
      { ...request, organizationId: 'someone-elses' } as never,
      'token',
    );

    const [sent] = loculus.createUpload.mock.calls[0] as [
      { organizationId: string },
    ];

    expect(sent.organizationId).toBe('org-1');
  });

  it('does not mint a URL for a meeting the caller cannot see', async () => {
    const { service, meetingService, loculus } = harness();

    // `meetingService.findById` is what scopes the meeting to the caller's
    // organization; a presigned URL is a write, so it must not be issued first.
    meetingService.findById.mockRejectedValue(new NotFoundException());

    await expect(
      service.presignUpload(actor, 'someone-elses', request, 't'),
    ).rejects.toThrow(NotFoundException);
    expect(loculus.createUpload).not.toHaveBeenCalled();
  });

  it('records the file as pending, against the caller’s organization', async () => {
    const { service, fileService } = harness();

    const result = await service.presignUpload(actor, 'meeting-1', request, 't');

    expect(fileService.createPending).toHaveBeenCalledWith({
      key: 'abc-a.mp3',
      bucket: LOCULUS_BACKEND,
      originalName: 'a.mp3',
      mimeType: 'audio/mpeg',
      size: 10,
      organizationId: 'org-1',
      createdBy: 'user-1',
    });
    // The id is what the client comes back with, never the raw key.
    expect(result.fileId).toBe('file-1');
    expect(result.objectKey).toBe('abc-a.mp3');
  });
});

describe('upload — the multipart path', () => {
  /**
   * A real file on disk, because the service opens one for real.
   *
   * `createReadStream` on a missing path does not throw — it emits `'error'` a
   * tick later, which no `.catch()` on the returned promise can intercept.
   */
  async function temporaryUpload() {
    const directory = await mkdtemp(join(tmpdir(), 'akouo-upload-'));
    const path = join(directory, 'a.mp3');

    await writeFile(path, 'bytes');

    return path;
  }

  it('relays the caller’s token, so no service credentials are needed', async () => {
    const fileService = {
      /*
       * Drains the stream it is handed, because the real file service reads it.
       * A mock that only resolves leaves an unopened `ReadStream` behind, and
       * `upload` deletes the temporary file the moment this returns — so the
       * lazy open lands after the unlink and raises an unhandled `'error'`.
       * Reading to the end here is what makes the ordering deterministic.
       */
      upload: jest.fn(async ({ body }: { body: AsyncIterable<unknown> }) => {
        for await (const _chunk of body) {
          // Discarded; the point is that the file is read before it is removed.
        }

        return { id: 'file-1' };
      }),
      createPending: jest.fn(),
      findByIdInOrganization: jest.fn(),
      markUploaded: jest.fn(),
      findById: jest.fn(),
    };
    const { service } = harness({ fileService });

    await service
      .upload(
        actor,
        'meeting-1',
        {
          path: await temporaryUpload(),
          originalname: 'a.mp3',
          mimetype: 'audio/mpeg',
          size: 5,
        } as never,
        'token-123',
      )
      .catch(() => undefined);

    expect(fileService.upload).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'token-123' }),
    );
  });
});

describe('create — claiming an upload', () => {
  const pending = {
    id: 'file-1',
    key: 'abc-a.mp3',
    bucket: LOCULUS_BACKEND,
    status: 'INITIAL',
    organizationId: 'org-1',
  };

  it('confirms the object arrived, then marks the file uploaded', async () => {
    const { service, fileService, loculus } = harness({
      fileService: { findByIdInOrganization: jest.fn().mockResolvedValue({ ...pending }) },
    });

    await service.create(actor, 'meeting-1', { fileId: 'file-1' }, 'token');

    expect(loculus.createDownload).toHaveBeenCalledWith('abc-a.mp3', 'token');
    expect(fileService.markUploaded).toHaveBeenCalled();
  });

  it('refuses a file id belonging to another organization', async () => {
    const { service, loculus } = harness({
      fileService: {
        findByIdInOrganization: jest
          .fn()
          .mockRejectedValue(new NotFoundException('File not found')),
      },
    });

    await expect(
      service.create(actor, 'meeting-1', { fileId: 'someone-elses' }, 'token'),
    ).rejects.toThrow(NotFoundException);
    expect(loculus.createDownload).not.toHaveBeenCalled();
  });

  it('refuses to record a recording whose object never arrived', async () => {
    const { service, fileService } = harness({
      fileService: { findByIdInOrganization: jest.fn().mockResolvedValue({ ...pending }) },
      loculus: {
        createDownload: jest.fn().mockRejectedValue(new NotFoundException()),
      },
    });

    await expect(
      service.create(actor, 'meeting-1', { fileId: 'file-1' }, 'token'),
    ).rejects.toThrow(NotFoundException);
    expect(fileService.markUploaded).not.toHaveBeenCalled();
  });

  it('leaves a file already confirmed alone', async () => {
    const { service, loculus } = harness({
      fileService: {
        findByIdInOrganization: jest
          .fn()
          .mockResolvedValue({ ...pending, status: 'UPLOADED' }),
      },
    });

    await service.create(actor, 'meeting-1', { fileId: 'file-1' }, 'token');

    expect(loculus.createDownload).not.toHaveBeenCalled();
  });

  it('does not touch loculus for a file akouo stored itself', async () => {
    const { service, loculus } = harness({
      fileService: {
        findByIdInOrganization: jest
          .fn()
          .mockResolvedValue({ ...pending, bucket: 'akouo-recordings' }),
      },
    });

    await service.create(actor, 'meeting-1', { fileId: 'file-1' }, 'token');

    expect(loculus.createDownload).not.toHaveBeenCalled();
  });

  it('fails loudly rather than skipping the check when no token was relayed', async () => {
    const { service } = harness({
      fileService: { findByIdInOrganization: jest.fn().mockResolvedValue({ ...pending }) },
    });

    await expect(
      service.create(actor, 'meeting-1', { fileId: 'file-1' }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
