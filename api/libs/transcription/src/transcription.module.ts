import { Module } from '@nestjs/common';

import { TranscriptionService } from './transcription.service';
import { TranscriptionMapper } from './transcription.mapper';
import { transcriptionProviders } from './transcription.providers';
import { TranscriptionController } from './transcription.controller';
import { RecordingListener } from './recording.listener';
import { TRANSCRIBER } from './transcriber';
import { AssemblyAiTranscriber } from './transcriber.assemblyai';
import { UtteranceModule } from './utterance/utterance.module';

// Transcriptions hang off a recording, but nothing here calls into the recording
// module: a transcription is reached by its own repository and checked against the
// caller, and uploads arrive as an event, so the dependency on `@akouo/recording`
// is types alone.
@Module({
  // Utterances are written and read as part of a transcription, so the service and
  // mapper that handle them come from their own module rather than this one.
  imports: [UtteranceModule],
  providers: [
    ...transcriptionProviders,
    TranscriptionService,
    TranscriptionMapper,
    RecordingListener,
    /*
     * The one place a transcriber is chosen. `MockTranscriber` is still there to
     * swap in when a test wants transcription without the network, but recordings
     * now go to AssemblyAI, which means a key has to be configured for the app to
     * start at all.
     */
    { provide: TRANSCRIBER, useClass: AssemblyAiTranscriber },
  ],
  controllers: [TranscriptionController],
  exports: [TranscriptionService, TRANSCRIBER],
})
export class TranscriptionModule {}
