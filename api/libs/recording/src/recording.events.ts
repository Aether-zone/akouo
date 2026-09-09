import { MeetingDTO, RecordingDTO } from '@akouo/contract';
import type { Actor } from '@aether-zone/organon';

/**
 * Emitted once a recording's bytes are in the object store and the row that points
 * at them is written — the point from which the recording can be read back.
 *
 * Listeners are the way to hang work off an upload (transcribing it, say) without
 * this library having to know about them.
 */
export const RECORDING_STORED_EVENT = 'recording.stored';

export class RecordingStoredEvent {
    constructor(public readonly recording: RecordingDTO, public readonly meeting: MeetingDTO, public readonly user: Actor) { }
}
