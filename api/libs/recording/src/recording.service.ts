import { CreateRecordingDTO, RecordingDTO } from '@akouo/contract';
import type {
  CreatePresignedUploadDTO,
  PreparedUploadDTO,
} from '@akouo/contract';
import type { MeetingDTO } from '@akouo/contract';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import type { Readable } from 'node:stream';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';
import {
  FileService,
  LOCULUS_BACKEND,
  LoculusClient,
  StoredFile,
} from '@akouo/common';
import type { ByteRange } from '@akouo/common';

import { Meeting, MeetingService } from '@akouo/meeting';

import { Recording } from './recording.entity';
import { RecordingMapper } from './recording.mapper';
import { RECORDING_STORED_EVENT, RecordingStoredEvent } from './recording.events';


@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  constructor(
    @Inject('RECORDING_REPOSITORY')
    private readonly recordingRepository: Repository<Recording>,
    private readonly recordingMapper: RecordingMapper,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly meetingService: MeetingService,
    private readonly loculus: LoculusClient
  ) { }

  async findAll(user: Actor, meetingId: string): Promise<RecordingDTO[]> {
    const entities = await this.recordingRepository
      .createQueryBuilder('recording')
      .leftJoinAndSelect('recording.file', 'file')
      .where('recording.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('recording.meeting = :meetingId', { meetingId })
      .orderBy('recording.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) =>
      this.recordingMapper.toDTO(entity, meetingId),
    );
  }

  async findById(
    user: Actor,
    meetingId: string,
    id: string,
  ): Promise<RecordingDTO> {
    return this.recordingMapper.toDTO(
      await this.loadRecording(user, meetingId, id),
      meetingId,
    );
  }

  /**
   * The stored file behind a recording, once the caller has been shown to own it.
   * A streaming response needs the size, type and name before it can answer a
   * `Range` header, so those come back without touching the object store.
   */
  async findFile(
    user: Actor,
    meetingId: string,
    id: string,
  ): Promise<StoredFile> {
    return (await this.loadRecording(user, meetingId, id)).file;
  }

  /**
   * Opens the recording's bytes, optionally just the requested range. Takes the file
   * from {@link findFile} rather than an id, so the access check is not repeated and
   * the row is not loaded twice.
   */
  openStream(
    file: StoredFile,
    range: ByteRange | undefined,
    accessToken: string,
  ): Promise<Readable> {
    return this.fileService.openStream(file, range, accessToken);
  }

  /**
   * Attaches a file already in storage — the upload endpoint is the other way in.
   *
   * This is also where an upload presigned through loculus is claimed, which is
   * why the file is fetched with the organization filter and then confirmed to
   * exist. Neither check is about the happy path: the first stops a file id from
   * another organization being attached to this caller's meeting, and the second
   * stops a presigned PUT that failed after the browser stopped watching from
   * becoming a recording whose bytes are not there — a fault that would
   * otherwise surface much later, in a player.
   */
  async create(
    user: Actor,
    meetingId: string,
    recording: CreateRecordingDTO,
    accessToken?: string,
  ): Promise<RecordingDTO> {
    const file = await this.fileService.findByIdInOrganization(
      recording.fileId,
      user.organizationId,
    );

    if (file.bucket === LOCULUS_BACKEND && file.status !== 'UPLOADED') {
      await this.confirmUploaded(file, accessToken);
    }
    const entity: Recording = this.recordingMapper.toEntity(file);

    entity.createdBy = user.id;

    entity.organizationId = user.organizationId;
    entity.meeting = this.meetingReference(meetingId);

    const saved = await this.recordingRepository.save(entity);

    return this.recordingMapper.toDTO(
      await this.loadRecording(user, meetingId, saved.id),
      meetingId,
    );
  }

  /**
   * Stores a file multer has written to disk, then registers the recording against it.
   * The bytes are streamed from the temporary file rather than buffered, so a large
   * recording never has to fit in memory on the way to the object store.
   */
  async upload(
    user: Actor,
    meetingId: string,
    file: Express.Multer.File,
    accessToken: string,
  ): Promise<RecordingDTO> {
    const stored = await this.fileService.upload({
      body: createReadStream(file.path),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      organizationId: user.organizationId,
      createdBy: user.id,
      // Relayed, so this path needs no service credentials of akouo's own.
      accessToken,
    });

    // Multer's copy has served its purpose; the object store holds the recording now.
    await this.discardTemporaryFile(file.path);

    const entity: Recording = this.recordingMapper.toEntity(stored);

    entity.createdBy = user.id;

    entity.organizationId = user.organizationId;
    entity.meeting = this.meetingReference(meetingId);

    let recording: RecordingDTO;

    try {
      const saved = await this.recordingRepository.save(entity);

      recording = this.recordingMapper.toDTO(
        await this.loadRecording(user, meetingId, saved.id),
        meetingId,
      );
    } catch (error) {
      // A stored file no recording points at is invisible, so it goes with the failure.
      await this.fileService
        .delete(stored.id)
        .catch((cleanupError: unknown) => {
          this.logger.error(
            `Failed to remove orphaned file "${stored.id}"`,
            cleanupError,
          );
        });

      throw error;
    }

    const meeting: MeetingDTO = await this.meetingService.findById(user, meetingId);
    // Outside the block above on purpose: the recording is stored either way, and a
    // listener throwing must not be mistaken for a failed upload and undo it. Emitted
    // only once both the object and the row are in place, so a listener acting on this
    // can read the recording back.
    this.eventEmitter.emit(
      RECORDING_STORED_EVENT,
      new RecordingStoredEvent(recording, meeting, user),
    );

    return recording;
  }

  /** Recordings outlive the call they came from, so removing one needs admin or owner. */
  async delete(
    user: Actor,
    meetingId: string,
    id: string,
    accessToken: string,
  ): Promise<void> {
    const recording = await this.loadRecording(user, meetingId, id);
    const file: StoredFile = recording.file;

    // The row first: while it exists it still points at the file.
    await this.recordingRepository.remove(recording);
    await this.fileService.delete(file.id, accessToken);
  }

  private async loadRecording(
    user: Actor,
    meetingId: string,
    id: string,
  ): Promise<Recording> {
    const recording = await this.recordingRepository
      .createQueryBuilder('recording')
      .leftJoinAndSelect('recording.file', 'file')
      .where('recording.id = :id', { id })
      .andWhere('recording.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('recording.meeting = :meetingId', { meetingId })
      .getOne();

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    return recording;
  }

  /** A detached Meeting carrying just the id, enough for TypeORM to write the FK. */
  /**
   * Asks loculus where a recording for this meeting may be uploaded.
   *
   * The meeting is looked up first, through `meetingService`, which is what
   * scopes it to the actor's organization — `OrganizationGuard` proved the
   * caller belongs to *an* organization, not that this meeting is in it. A
   * presigned URL is a write credential, and minting one for a meeting the
   * caller cannot see would hand it out on the strength of a guessed id.
   *
   * A row is written for the file before the URL goes out, and its id — not the
   * object key — is what the client comes back with. loculus has no notion of
   * who owns an object, so a key arriving from a browser is unattributable;
   * a `fileId` is a row akouo made, for a meeting it had already checked.
   *
   * The row stays `INITIAL` until something confirms the object arrived. No
   * recording exists yet: a URL that is never spent leaves a pending file to
   * sweep up, rather than a recording pointing at nothing.
   */
  async presignUpload(
    user: Actor,
    meetingId: string,
    request: CreatePresignedUploadDTO,
    accessToken: string,
  ): Promise<PreparedUploadDTO> {
    await this.meetingService.findById(user, meetingId);

    /*
     * The organization comes from the token's Actor, and overwrites anything
     * the request carried: a browser naming its own tenant would be filing an
     * object under one it need not belong to, and loculus records what it is
     * told without checking.
     */
    const presigned = await this.loculus.createUpload(
      { ...request, organizationId: user.organizationId },
      accessToken,
    );

    const file = await this.fileService.createPending({
      key: presigned.objectKey,
      bucket: LOCULUS_BACKEND,
      originalName: request.fileName,
      mimeType: request.contentType,
      size: request.size,
      organizationId: user.organizationId,
      createdBy: user.id,
    });

    return { ...presigned, fileId: file.id };
  }

  /**
   * Asks loculus whether the object is really there, and records that it is.
   *
   * `createDownload` is the cheapest question that gets a truthful answer:
   * loculus heads the object before it signs anything, so a 404 comes back for a
   * key that was never uploaded. The URL it returns is thrown away.
   */
  private async confirmUploaded(
    file: StoredFile,
    accessToken?: string,
  ): Promise<void> {
    if (!accessToken) {
      // Reached only if a caller wires this without relaying the token, which
      // would silently skip the check rather than fail it.
      throw new InternalServerErrorException(
        'Claiming a loculus upload needs the caller\'s access token.',
      );
    }

    await this.loculus.createDownload(file.key, accessToken);
    await this.fileService.markUploaded(file);
  }

  private meetingReference(id: string): Meeting {
    const meeting: Meeting = new Meeting();
    meeting.id = id;

    return meeting;
  }

  /**
   * Best effort: the upload has already succeeded, and a leftover temporary file is
   * not worth failing the request over.
   */
  private async discardTemporaryFile(path: string): Promise<void> {
    await unlink(path).catch((error: unknown) => {
      this.logger.warn(
        `Failed to remove temporary upload "${path}": ${String(error)}`,
      );
    });
  }
}
