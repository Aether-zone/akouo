import { Global, Module } from '@nestjs/common';

import { FileMapper } from './file.mapper';
import { fileProviders } from './file.providers';
import { FileService } from './file.service';

/**
 * Provides {@link FileService} application-wide, so any module can store a file
 * without knowing where the bytes end up.
 *
 * No configuration of its own any more: the bytes live in loculus, and where
 * that is belongs to `LoculusModule`. This module keeps only the rows.
 */
@Global()
@Module({
  providers: [...fileProviders, FileMapper, FileService],
  exports: [FileService, FileMapper],
})
export class FileModule {}
