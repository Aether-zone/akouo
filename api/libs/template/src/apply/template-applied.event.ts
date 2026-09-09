import { TemplateVersionDTO } from '@akouo/contract';
import type { Actor } from '@aether-zone/organon';


/**
 * Emitted when a published version has been applied to a transcription.
 *
 * Only published ones: a draft is applied to try it out, and whatever listens —
 * keeping the result, acting on it — should not treat an experiment as the
 * meeting's answer.
 */
export const TEMPLATE_APPLIED_EVENT = 'template.applied';

export class TemplateAppliedEvent {
  constructor(
    /** What the version produced, in the shape its schema described. */
    public readonly result: unknown,
    public readonly templateVersion: TemplateVersionDTO,
    public readonly transcriptionId: string,
    /**
     * Whose run this was. Carried because a listener acting on it reaches
     * resources checked against their owner, and there is no request left to
     * take one from by the time this is emitted.
     */
    public readonly user: Actor,
  ) { }
}
