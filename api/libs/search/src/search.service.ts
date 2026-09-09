import { SearchQueryDTO, SearchResultDTO } from '@akouo/contract';
import { Injectable } from '@nestjs/common';

import type { Actor } from '@aether-zone/organon';
import { EmbeddingService } from '@akouo/embedding';
import { MeetingService } from '@akouo/meeting';
import { RecordingService } from '@akouo/recording';
import { TranscriptionService } from '@akouo/transcription';


/**
 * How many matches to pull before narrowing to one meeting.
 *
 * An embedding records what it was made from, but not which meeting that was —
 * so a meeting search takes a wide slice of the ranking and drops what belongs
 * elsewhere. Storing the meeting on the embedding would turn this into a filter
 * the store could apply itself; until then this is the cost.
 */
const CANDIDATES_PER_MEETING_SEARCH = 200;

@Injectable()
export class SearchService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly meetingService: MeetingService,
    private readonly recordingService: RecordingService,
    private readonly transcriptionService: TranscriptionService,
  ) { }

  /** Everything the caller has, nearest first. */
  async search(
    user: Actor,
    query: SearchQueryDTO,
  ): Promise<SearchResultDTO[]> {
    const matches = await this.embeddingService.search(user, query.q, {
      limit: query.limit,
      sourceType: query.sourceType,
    });

    return matches.map((match) => this.toResult(match));
  }

  /**
   * The same search, kept to one meeting.
   *
   * The meeting is loaded first — which is also what proves the caller owns it —
   * and its transcriptions and turns give the set of ids a match has to be in.
   */
  async searchMeeting(
    user: Actor,
    meetingId: string,
    query: SearchQueryDTO,
  ): Promise<SearchResultDTO[]> {
    await this.meetingService.findById(user, meetingId);

    const ids = await this.idsWithin(user, meetingId);

    if (ids.size === 0) {
      return [];
    }

    const matches = await this.embeddingService.search(user, query.q, {
      limit: CANDIDATES_PER_MEETING_SEARCH,
      sourceType: query.sourceType,
    });

    return matches
      .filter((match) => ids.has(match.sourceId))
      .slice(0, query.limit)
      .map((match) => this.toResult(match));
  }

  /**
   * Everything a meeting's text could have been embedded from: its
   * transcriptions, and the turns inside them.
   */
  private async idsWithin(
    user: Actor,
    meetingId: string,
  ): Promise<Set<string>> {
    const ids = new Set<string>();
    const recordings = await this.recordingService.findAll(user, meetingId);

    const transcriptionLists = await Promise.all(
      recordings.map((recording) =>
        this.transcriptionService.findAll(user, meetingId, recording.id),
      ),
    );

    for (const transcriptions of transcriptionLists) {
      for (const transcription of transcriptions) {
        ids.add(transcription.id);

        for (const utterance of transcription.utterances) {
          ids.add(utterance.id);
        }
      }
    }

    return ids;
  }

  private toResult(match: {
    sourceType: SearchResultDTO['sourceType'];
    sourceId: string;
    content: string;
    score: number;
  }): SearchResultDTO {
    return {
      sourceType: match.sourceType,
      sourceId: match.sourceId,
      content: match.content,
      score: match.score,
    };
  }
}
