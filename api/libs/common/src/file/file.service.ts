import { Readable } from 'node:stream';

import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import type { ByteRange } from './byte-range';
import { StoredFile } from './file.entity';
import { FILE_REPOSITORY } from './file.providers';
import { LoculusClient } from '../loculus/loculus.client';
import { LOCULUS_BACKEND } from '../loculus/loculus.config';

export interface FileUpload {
    /** The bytes to store. A stream keeps a large upload out of memory. */
    body: Buffer | Readable;
    /** Name the file arrived under. loculus derives the object key from it. */
    originalName: string;
    mimeType: string;
    /** Size in bytes. Required: loculus signs it into the URL as a Content-Length. */
    size: number;
    /** The organization the file belongs to. Required: `StoredFile` is audited. */
    organizationId: string;
    /** Id of the user the file belongs to. */
    createdBy?: string | null;
    /**
     * The caller's access token, relayed to loculus. Omitted, akouo falls back
     * to its own client credentials — see {@link ServiceToken}.
     */
    accessToken?: string;
}

/** A file recorded before its bytes exist, for an upload happening elsewhere. */
export interface PendingFile {
    /** The object key loculus gave out. */
    key: string;
    /** Which store holds it. Always `loculus` now, kept for rows written before. */
    bucket: string;
    originalName: string;
    mimeType: string;
    size: number;
    organizationId: string;
    createdBy?: string | null;
}

/**
 * Keeps a row per stored object, so the rest of the application references a file
 * by id and never has to know about keys.
 *
 * The bytes live in loculus. akouo holds no bucket credentials and signs nothing:
 * it asks loculus where a file may go, and for a URL to read one back.
 *
 * Every method that reaches loculus takes an optional `accessToken`. Pass the
 * caller's where there is one — akouo then needs no authority of its own for
 * anything a person asked for. Omit it only from work no person is waiting on,
 * which falls back to akouo's own client credentials and needs them configured.
 *
 * Two ways in, and the difference matters. `upload` is the older one — bytes
 * arrive here as `multipart/form-data` and akouo forwards them, so a large
 * recording still crosses this process. `createPending` is the newer one, where
 * the browser is given a URL and uploads to the store itself; nothing but JSON
 * reaches akouo. New callers should prefer the second.
 */
@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(
        @Inject(FILE_REPOSITORY)
        private readonly fileRepository: Repository<StoredFile>,
        private readonly loculus: LoculusClient,
    ) { }

    /**
     * Stores bytes that arrived here, by spending a presigned URL of akouo's own.
     *
     * Row first, then the object, then the row again: an interrupted upload
     * leaves an `INITIAL` row naming an object that may not exist, which a sweep
     * can find. The reverse order would leave an object nothing knows about.
     */
    async upload(upload: FileUpload): Promise<StoredFile> {
        const presigned = await this.loculus.createUpload(
            {
                fileName: upload.originalName,
                contentType: upload.mimeType,
                size: upload.size,
                // Recorded against the object in loculus, so a file can be
                // traced to the tenant it was uploaded for.
                organizationId: upload.organizationId,
            },
            upload.accessToken,
        );

        const file = await this.createPending({
            key: presigned.objectKey,
            bucket: LOCULUS_BACKEND,
            originalName: upload.originalName,
            mimeType: upload.mimeType,
            size: upload.size,
            organizationId: upload.organizationId,
            createdBy: upload.createdBy,
        });

        const response = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            headers: {
                // Both are signed into the URL, so they have to match exactly.
                'content-type': upload.mimeType,
                'content-length': String(upload.size),
            },
            body: upload.body as never,
            // Node needs this to send a stream body rather than buffering it.
            duplex: 'half',
        } as RequestInit);

        console.log(response);

        if (!response.ok) {
            this.logger.error(
                `Storing "${upload.originalName}" failed: ${response.status} ${response.statusText}`,
            );

            throw new ServiceUnavailableException('The file could not be stored.');
        }

        return this.markUploaded(file);
    }

    /**
     * Records a file that is *about* to be uploaded elsewhere, and returns the row.
     *
     * Written before the bytes exist, because the id is what the client comes back
     * with once they do — see `preparedUploadSchema`. It stays `INITIAL` until
     * something confirms the object arrived, so a row in that state means an upload
     * that was offered and never finished rather than a file that is missing.
     */
    async createPending(pending: PendingFile): Promise<StoredFile> {
        const entity: StoredFile = new StoredFile();

        entity.key = pending.key;
        entity.bucket = pending.bucket;
        entity.originalName = pending.originalName;
        entity.mimeType = pending.mimeType;
        entity.size = pending.size;
        entity.organizationId = pending.organizationId;
        entity.createdBy = pending.createdBy ?? null;
        entity.version = '';
        entity.status = 'INITIAL';

        return this.fileRepository.save(entity);
    }

    /** Marks a pending file as arrived. */
    async markUploaded(file: StoredFile): Promise<StoredFile> {
        file.status = 'UPLOADED';

        return this.fileRepository.save(file);
    }

    /**
     * A file, but only if it belongs to the organization asking.
     *
     * `findById` deliberately has no such filter: it is reached through a parent
     * row that already carries the boundary. This is for the one case that has no
     * parent yet — a client naming a file id directly, to attach it to something.
     * Without the check, any id would attach any organization's file to the
     * caller's own meeting.
     *
     * The miss is a 404 rather than a 403, matching `OrganizationGuard`: a
     * different answer for "exists but not yours" would confirm the id.
     */
    async findByIdInOrganization(
        id: string,
        organizationId: string,
    ): Promise<StoredFile> {
        const file = await this.findById(id);

        if (file.organizationId !== organizationId) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    async findById(id: string): Promise<StoredFile> {
        const file = await this.fileRepository.findOneBy({ id });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    /**
     * Opens the stored object for reading. The row is returned alongside it, because
     * a caller streaming a file back needs its content type and name for the response.
     */
    async download(
        id: string,
        range?: ByteRange,
        accessToken?: string,
    ): Promise<{ file: StoredFile; stream: Readable }> {
        const file = await this.findById(id);

        return { file, stream: await this.openStream(file, range, accessToken) };
    }

    /**
     * The bytes of a file that has already been loaded, so a caller that needed the
     * row first — to check access, or to read the size a `Range` header is relative
     * to — does not fetch it twice.
     *
     * A round trip more than reading a bucket directly: ask loculus for a URL,
     * then spend it. Worth avoiding where the bytes are only going to be
     * forwarded to the browser anyway — `getUrl` hands the client that same URL
     * and lets it fetch the object itself, which is the point of storing files
     * this way.
     */
    async openStream(
        file: StoredFile,
        range?: ByteRange,
        accessToken?: string,
    ): Promise<Readable> {
        const { downloadUrl } = await this.loculus.createDownload(
            file.key,
            accessToken,
        );

        const response = await fetch(downloadUrl, {
            headers: range ? { range: `bytes=${range.start}-${range.end}` } : {},
        });

        if (response.status === 404) {
            // The row outlived its object — to a caller that is the same as no file.
            throw new NotFoundException('File not found');
        }

        if (!response.ok || !response.body) {
            throw new ServiceUnavailableException(
                'The object store could not be read.',
            );
        }

        return Readable.fromWeb(response.body as never);
    }

    /**
     * A presigned URL the client can download the file from directly, so recordings
     * do not have to be streamed through this server.
     */
    async getUrl(id: string, accessToken?: string): Promise<string> {
        const file = await this.findById(id);
        const presigned = await this.loculus.createDownload(
            file.key,
            accessToken,
        );

        return presigned.downloadUrl;
    }

    /**
     * Removes the object first, then the row: an interrupted delete leaves a row
     * that can be retried, rather than an object nothing knows about any more.
     *
     * loculus answers the same whether or not the object was there, so there is no
     * missing-object case to forgive.
     */
    async delete(id: string, accessToken?: string): Promise<void> {
        const file = await this.findById(id);

        await this.loculus.remove(file.key, accessToken);
        await this.fileRepository.delete(file.id);
    }
}
