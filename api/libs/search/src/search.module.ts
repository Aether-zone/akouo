import { Module } from '@nestjs/common';

import { EmbeddingModule } from '@akouo/embedding';
import { MeetingModule } from '@akouo/meeting';
import { RecordingModule } from '@akouo/recording';
import { TranscriptionModule } from '@akouo/transcription';

import { SearchService } from './search.service';
import { SearchController } from './search.controller';

/**
 * Searching is a reader: it owns no data of its own, and asks the libraries that
 * do. `RecordingModule` is in here alongside the obvious three because a meeting
 * no longer carries its recordings, and transcriptions hang off those.
 */
@Module({
  imports: [
    EmbeddingModule,
    MeetingModule,
    RecordingModule,
    TranscriptionModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
