import { MeetingDTO } from '@akouo/contract';
import type { CreateUtteranceDTO, RecordingDTO } from '@akouo/contract';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssemblyAI, TranscribeParams } from 'assemblyai';

import { FileService, type EnvService } from '@akouo/common';

import type { Transcriber, TranscriptionResult } from './transcriber';

/**
 * {@link Transcriber} backed by AssemblyAI.
 *
 * There are two ways to get the audio there, and which one is right depends on
 * whether AssemblyAI can reach the object store:
 *
 * - **It can.** The job is pointed at a presigned URL and the bytes never touch
 *   this process — no read, no upload, nothing held in memory. Set
 *   `ASSEMBLYAI_FETCHES_FROM_STORE`.
 * - **It cannot**, which is every development machine, where the store is on
 *   `localhost`. The recording is streamed out of the store and straight up to
 *   AssemblyAI, so a long meeting is still never written to disk or buffered
 *   whole; the upload hands back a URL only AssemblyAI can read.
 *
 * The store's URL lifetime is the constraint on the first: AssemblyAI fetches
 * when the job leaves its queue, not when it is created, so a presigned URL has
 * to outlive that wait. loculus's `DOWNLOAD_URL_EXPIRES_IN` is what governs it.
 */
@Injectable()
export class AssemblyAiTranscriber implements Transcriber {
    private readonly logger = new Logger(AssemblyAiTranscriber.name);

    private readonly client: AssemblyAI;

    /** Whether AssemblyAI fetches the recording itself; see the class comment. */
    private readonly fetchesFromStore: boolean;

    constructor(
        @Inject(ConfigService) config: EnvService,
        private readonly fileService: FileService,
    ) {
        const apiKey = config.get('ASSEMBLYAI_API_KEY', { infer: true });

        this.fetchesFromStore = config.get('ASSEMBLYAI_FETCHES_FROM_STORE', {
            infer: true,
        });

        if (!apiKey) {
            throw new Error(
                'ASSEMBLYAI_API_KEY is not set, so AssemblyAiTranscriber cannot be used',
            );
        }

        this.client = new AssemblyAI({ apiKey });
    }

    /**
     * A URL AssemblyAI can read the recording from.
     *
     * Either the store's own presigned URL, or one AssemblyAI issues for a copy
     * akouo pushed to it. Both are time-limited and readable only with the URL.
     */
    private async audioFor(recording: RecordingDTO): Promise<string> {
        const { file } = recording;

        if (this.fetchesFromStore) {
            this.logger.log(
                `Pointing AssemblyAI at recording "${recording.id}" (${file.originalName}, ${file.size} bytes) in the object store`,
            );

            return this.fileService.getUrl(file.id);
        }

        const stream = await this.fileService.openStream(
            await this.fileService.findById(file.id),
        );

        this.logger.log(
            `Uploading recording "${recording.id}" (${file.originalName}, ${file.size} bytes) to AssemblyAI`,
        );

        return this.client.files.upload(stream);
    }

    async transcribe(recording: RecordingDTO, meeting: MeetingDTO): Promise<TranscriptionResult> {
        const audio = await this.audioFor(recording);

        // `transcribe` polls until the job leaves the queue, which is why this runs
        // from a listener rather than inide the upload request.
        const params: TranscribeParams = {
            audio,
            speaker_labels: true,
            speakers_expected: (meeting.participants || []).length || 1,
            punctuate: true
        };

        const transcript = await this.client.transcripts.transcribe(params);

        if (transcript.status === 'error') {
            throw new Error(
                `AssemblyAI failed to transcribe recording "${recording.id}": ${transcript.error ?? 'unknown error'}`,
            );
        }

        /*
         * `speaker_labels` above is what fills `utterances`: without it AssemblyAI
         * returns the text alone and this comes back null. An utterance with no
         * words in it would fail the DTO's own rules, so it is dropped here rather
         * than at the point it is saved.
         */
        const utterances: CreateUtteranceDTO[] = (transcript.utterances ?? [])
            .filter((utterance) => utterance.text.trim().length > 0)
            .map((utterance) => ({
                speakerLabel: utterance.speaker,
                // Nobody has matched the diarization label to a participant yet.
                participantId: null,
                content: utterance.text,
                confidence: utterance.confidence,
                // AssemblyAI reports both offsets in milliseconds, as the column stores them.
                start: utterance.start,
                end: utterance.end,
            }));

        this.logger.log(
            `AssemblyAI transcript ${transcript.id} ready for recording "${recording.id}" (${utterances.length} utterances)`,
        );

        // A recording with no speech in it comes back completed with no text.
        return { content: transcript.text ?? '', utterances };
    }
}
