import {
  RecordingDTO,
  createPresignedUploadSchema,
  createRecordingSchema,
} from '@akouo/contract';
import type {
  CreatePresignedUploadDTO,
  CreateRecordingDTO,
  PreparedUploadDTO,
} from '@akouo/contract';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';
import {
  ZodValidationPipe,
  bearerToken,
  byteRangeLength,
  parseByteRange,
} from '@akouo/common';

import { RecordingService } from './recording.service';
import {
  RECORDING_FILE_FIELD,
  UploadedFileCleanupInterceptor,
} from './recording.upload';

/**
 * `inline` with the uploaded name. The quoted form is ASCII-only for old clients,
 * with `filename*` carrying the real name for everything else.
 */
const contentDisposition = (originalName: string): string => {
  const ascii = originalName
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '\\$&');

  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(originalName)}`;
};

@Controller('organizations/:organizationId/meetings/:meetingId/recordings')
@UseGuards(OrganizationGuard)
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Get()
  getRecordings(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<RecordingDTO[]> {
    return this.recordingService.findAll(user, meetingId);
  }

  @Get('/:id')
  getRecording(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RecordingDTO> {
    return this.recordingService.findById(user, meetingId, id);
  }

  /**
   * Attaches a stored file to the meeting.
   *
   * Also the step that claims an upload presigned through loculus, which is why
   * the caller's token is relayed: confirming the object arrived is a question
   * for loculus, asked as the person who uploaded it.
   */
  @Post()
  createRecording(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(createRecordingSchema))
    recording: CreateRecordingDTO,
  ): Promise<RecordingDTO> {
    return this.recordingService.create(
      user,
      meetingId,
      recording,
      bearerToken(authorization),
    );
  }

  /**
   * Asks loculus where this recording may be uploaded.
   *
   * The browser spends the returned URL against the object store directly, so
   * the bytes never cross akouo — which is what lets a two-hour recording cost
   * this api one small JSON round trip. The `objectKey` that comes back is what
   * a later `POST` attaches to the meeting.
   *
   * Organization membership is already established by `OrganizationGuard`, and
   * the caller's own token is what loculus is asked with: akouo can obtain
   * nothing here that the person could not have obtained themselves.
   */
  @Post('/presign')
  presignUpload(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(createPresignedUploadSchema))
    request: CreatePresignedUploadDTO,
  ): Promise<PreparedUploadDTO> {
    return this.recordingService.presignUpload(
      user,
      meetingId,
      request,
      bearerToken(authorization),
    );
  }

  /**
   * Uploads the recording file itself, as `multipart/form-data`. Storage, the size
   * cap and the accepted media types come from the module's multer configuration.
   */
  @Post('/upload')
  @UseInterceptors(
    FileInterceptor(RECORDING_FILE_FIELD),
    UploadedFileCleanupInterceptor,
  )
  uploadRecording(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ): Promise<RecordingDTO> {
    return this.recordingService.upload(
      user,
      meetingId,
      file,
      bearerToken(authorization),
    );
  }

  /**
   * Streams the recording's bytes back, honouring `Range` so a player can seek
   * without pulling the whole file. Only the requested bytes are fetched from the
   * object store, and they are piped straight through rather than buffered here.
   */
  @Get('/:id/stream')
  @Header('Accept-Ranges', 'bytes')
  async streamRecording(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('range') rangeHeader: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.recordingService.findFile(user, meetingId, id);
    const requested = parseByteRange(rangeHeader, file.size);

    if (requested.kind === 'unsatisfiable') {
      // A 416 has to say what the acceptable range would have been.
      response.setHeader('Content-Range', `bytes */${file.size}`);

      throw new HttpException(
        'Requested range not satisfiable',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    }

    const range = requested.kind === 'partial' ? requested.range : undefined;

    if (range) {
      response.status(HttpStatus.PARTIAL_CONTENT);
      response.setHeader(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${file.size}`,
      );
    }

    return new StreamableFile(
      await this.recordingService.openStream(
        file,
        range,
        bearerToken(authorization),
      ),
      {
        type: file.mimeType,
        // `inline`, so a browser plays the recording instead of downloading it.
        disposition: contentDisposition(file.originalName),
        length: range ? byteRangeLength(range) : file.size,
      },
    );
  }

  @Delete('/:id')
  deleteRecording(
    @CurrentActor() user: Actor,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<void> {
    return this.recordingService.delete(
      user,
      meetingId,
      id,
      bearerToken(authorization),
    );
  }
}
