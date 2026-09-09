import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { extname } from 'node:path';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { catchError, Observable, throwError } from 'rxjs';

import type { EnvService } from '@akouo/common';

/** A recording is audio or video; anything else is a client mistake, not a recording. */
const ACCEPTED_MIME_TYPE = /^(audio|video)\//;

/** The multipart field the upload endpoint reads the file from. */
export const RECORDING_FILE_FIELD = 'file';

/**
 * Multer configuration for recording uploads: files land on disk under
 * `UPLOAD_PATH` so a large recording never has to fit in memory.
 */
export const recordingUploadOptions = (config: EnvService): MulterOptions => {
  const destination = config.get('UPLOAD_PATH', { infer: true });

  // Multer fails every upload if the directory is missing, so create it once at boot.
  mkdirSync(destination, { recursive: true });

  return {
    storage: diskStorage({
      destination,
      // Client names collide and are attacker-controlled; only the extension is
      // kept, so the stored file stays recognisable by name alone.
      filename: (_request, file, callback) =>
        callback(
          null,
          `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
        ),
    }),
    limits: {
      fileSize: config.get('UPLOAD_MAX_FILE_SIZE', { infer: true }),
      files: 1,
    },
    fileFilter: (_request, file, callback) => {
      if (!ACCEPTED_MIME_TYPE.test(file.mimetype)) {
        callback(
          new UnsupportedMediaTypeException(
            `Unsupported recording type: ${file.mimetype}`,
          ),
          false,
        );

        return;
      }

      callback(null, true);
    },
  };
};

/**
 * Deletes the stored file when the request fails. Multer writes to disk before the
 * route's pipes and handler run, so a rejected upload — a bad meeting id, a failed
 * insert — would otherwise leave a file nothing points at.
 *
 * Register it after the `FileInterceptor`, so it wraps the pipes as well as the handler.
 */
@Injectable()
export class UploadedFileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        const { file } = context
          .switchToHttp()
          .getRequest<{ file?: Express.Multer.File }>();

        if (file?.path) {
          // Best effort: the request is already failing, and a leftover file
          // is not worth replacing the original error with an unlink error.
          void unlink(file.path).catch(() => undefined);
        }

        return throwError(() => error);
      }),
    );
  }
}
