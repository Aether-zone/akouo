import { Global, Module } from '@nestjs/common';

import { FileMapper } from './file.mapper';
import { fileProviders } from './file.providers';
import { FileService } from './file.service';
import { ObjectUploadedListener } from './object-uploaded.listener';

/**
 * Provides {@link FileService} application-wide, so any module can store a file
 * without knowing where the bytes end up.
 *
 * No configuration of its own any more: the bytes live in loculus, and where
 * that is belongs to `LoculusModule`. This module keeps only the rows.
 *
 * `ObjectUploadedListener` lives here because it settles those rows and needs
 * nothing else. It is not exported: a consumer is not something another module
 * calls, and Nest binds its queue from the provider alone.
 */
@Global()
@Module({
  providers: [
    ...fileProviders,
    FileMapper,
    FileService,
    ObjectUploadedListener,
  ],
  exports: [FileService, FileMapper],
})
export class FileModule {}
