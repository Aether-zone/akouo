import { z } from 'zod';

/**
 * Asking for somewhere to put a file before uploading it.
 *
 * The browser sends this, akouo relays it to loculus, and the URL that comes
 * back is spent by the browser directly against the object store — the bytes
 * never pass through either api.
 */
export const createPresignedUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(\s*;.*)?$/i,
      'must be a media type, such as "audio/mpeg"',
    ),
  /**
   * Bytes. loculus signs this into the URL as a `Content-Length`, so the upload
   * has to match it exactly — a URL issued for a small file cannot be spent on
   * a large one.
   */
  size: z.number().int().positive(),
  /**
   * Which organization the file is being uploaded for, recorded against the
   * object in loculus.
   *
   * Optional here because **a browser never supplies it**: this schema also
   * validates the request the browser sends to akouo, and akouo fills the field
   * in from the caller's `Actor` before relaying to loculus. Anything a client
   * did send is discarded rather than trusted — the value is provenance, and
   * provenance dictated by the thing being recorded is worth nothing.
   */
  organizationId: z.uuid().optional(),
});

export const presignedUploadSchema = z.object({
  /** loculus's name for the object. Store it to refer to the file later. */
  objectKey: z.string().min(1),
  uploadUrl: z.url(),
  /**
   * Coerced, because this arrives as an ISO string over JSON and every caller
   * wants to compare it to a clock.
   */
  expiresAt: z.coerce.date(),
});

export const presignedDownloadSchema = presignedUploadSchema
  .omit({ uploadUrl: true })
  .extend({ downloadUrl: z.url() });

/**
 * What akouo answers with, which is loculus's URL plus the row akouo wrote to
 * expect the file.
 *
 * The client comes back with `fileId`, never `objectKey`. loculus has no notion
 * of who owns an object — it signs URLs and stores bytes — so a key arriving
 * from a browser is unattributable, and akouo would have to take its word for
 * which organization it belonged to. A `fileId` is a row akouo made, for a
 * meeting it had already checked, so there is nothing to take on trust.
 */
export const preparedUploadSchema = presignedUploadSchema.extend({
  fileId: z.uuid(),
});

export type CreatePresignedUploadDTO = z.infer<
  typeof createPresignedUploadSchema
>;
export type PresignedUploadDTO = z.infer<typeof presignedUploadSchema>;
export type PresignedDownloadDTO = z.infer<typeof presignedDownloadSchema>;
export type PreparedUploadDTO = z.infer<typeof preparedUploadSchema>;
