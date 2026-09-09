import { Module } from '@nestjs/common';

import { ExtractionService } from './extraction.service';
import { ExtractionMapper } from './extraction.mapper';
import { extractionProviders } from './extraction.providers';
import { ExtractionListener } from './extraction.listener';
import { ExtractionController } from './extraction.controller';

/**
 * No controller yet: extractions are written by whatever applies a template and
 * read alongside the transcription they came from, both inside the application.
 */
@Module({
  providers: [...extractionProviders, ExtractionService, ExtractionMapper, ExtractionListener],
  controllers: [
    ExtractionController
  ],
  exports: [ExtractionService, ExtractionMapper],
})
export class ExtractionModule { }
