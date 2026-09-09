import { TemplateVersionDTO } from '@akouo/contract';
import type { TranscriptionDTO } from '@akouo/contract';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';


// Type-only, and erased at compile time: applying a template reads a
// transcription, but nothing here calls into that library at runtime.

import { AIProvider } from '@akouo/ai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TEMPLATE_APPLIED_EVENT, TemplateAppliedEvent } from './template-applied.event';
import type { Actor } from '@aether-zone/organon';

/*
 * `@mastra/core` is ESM and this build is CommonJS, so the module is imported
 * where it is used and only its type is named here.
 */
type MastraAgentModule = typeof import('@mastra/core/agent', { with: { 'resolution-mode': 'import' } });

type Agent = InstanceType<MastraAgentModule['Agent']>;

/**
 * What the agent is told when a version carries no prompt of its own. The schema
 * says what the answer must look like; this says what to do with the transcript.
 */
const DEFAULT_INSTRUCTIONS =
  'Read the transcript and answer with the JSON the caller asked for.';

/**
 * Loads `@mastra/core/agent` at runtime, out of the bundler's sight.
 *
 * A plain `import()` is compiled by webpack into a chunk load, and `nest build`
 * emits a single `main.js` with no chunks beside it — so the import fails at
 * runtime with "Cannot find module ./vendors-…mastra…". Building the import
 * through `Function` leaves webpack nothing to rewrite, and Node performs a real
 * ESM import, which is what this ESM-only package needs.
 */
const importMastraAgent = new Function(
  'return import("@mastra/core/agent")',
) as () => Promise<MastraAgentModule>;

/**
 * Turns a template version and a transcription into the text the version
 * describes — the summary, the note, whatever the wording is for.
 *
 * A version rather than a template: the wording and the prompt that go together
 * are the ones recorded on a snapshot, so applying one is reproducible after the
 * template itself has moved on.
 */
@Injectable()
export class TemplateApplier {

  private readonly logger = new Logger(TemplateApplier.name);

  constructor(
    private readonly aiProvider: AIProvider,
    private readonly eventEmitter: EventEmitter2
  ) { }

  /**
   * Runs the version's agent over a transcription and hands back the structured
   * answer.
   *
   * The version's body is a JSON schema: it describes the shape of the result,
   * and is given to the model as its response format rather than repeated in the
   * message. The prompt stays the standing instruction, and the transcript is
   * the only material sent per run.
   */
  async apply(
    templateVersion: TemplateVersionDTO,
    transcription: TranscriptionDTO,
    user: Actor
  ): Promise<unknown> {
    const schema = this.parseSchema(templateVersion);
    const agent = await this.createAgent(templateVersion);

    const result = await agent.generate(this.buildMessage(transcription), {
      structuredOutput: { schema },
    });

    if (result.object === undefined || result.object === null) {
      // No object means the model answered with something that did not fit the
      // schema. Returning it anyway would hand the caller a shape it cannot use.
      throw new ServiceUnavailableException(
        `The model returned nothing matching the schema of template version ${templateVersion.version}`,
      );
    }

    this.logger.log(
      `Applied template version ${templateVersion.version} to transcription "${transcription.id}"`,
    );

    const event: TemplateAppliedEvent = new TemplateAppliedEvent(result.object, templateVersion, transcription.id, user);

    console.log(event);

    this.eventEmitter.emit(TEMPLATE_APPLIED_EVENT, event)
    return result.object;
  }

  /**
   * The version's body, read as a JSON schema.
   *
   * A body that is not valid JSON, or not an object, cannot describe a result —
   * that is a broken template rather than a failed run, so it is refused before
   * a model is called and paid for.
   */
  private parseSchema(templateVersion: TemplateVersionDTO): object {
    let parsed: unknown;

    try {
      parsed = JSON.parse(templateVersion.content);
    } catch {
      throw new BadRequestException(
        `The body of template version ${templateVersion.version} is not valid JSON, so it cannot be used as a schema`,
      );
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new BadRequestException(
        `The body of template version ${templateVersion.version} is not a JSON schema object`,
      );
    }

    return parsed;
  }

  /**
   * What the agent is given for one run: the transcript, and nothing else. The
   * shape of the answer is carried by the schema, not by the message.
   */
  private buildMessage(transcription: TranscriptionDTO): string {
    return `Transcript:\n${this.transcript(transcription)}`;
  }

  /**
   * The transcript as text, turn by turn where the turns are known.
   *
   * Who said what is worth keeping — a summary that can attribute a decision is
   * more useful than one that cannot — and `content` is the same words without
   * the speakers, which is the fallback when a transcription has no utterances.
   */
  private transcript(transcription: TranscriptionDTO): string {
    if (transcription.utterances.length === 0) {
      return transcription.content;
    }

    return transcription.utterances
      .map((utterance) => `${utterance.speakerLabel}: ${utterance.content}`)
      .join('\n');
  }

  /**
   * An agent that follows this version's prompt.
   *
   * The prompt is the agent's instructions — what it is for — while the
   * transcription is the material it is given per run, which is why the agent is
   * built from the version alone. A version with no prompt gets a plain default:
   * its body is a schema, which says what the answer looks like but not what to
   * do.
   *
   * `@mastra/core` is ESM and this build is CommonJS, so it is imported here
   * rather than at the top of the file.
   */
  private async createAgent(
    templateVersion: TemplateVersionDTO,
  ): Promise<Agent> {
    const model = this.aiProvider.languageModel;

    if (!model) {
      throw new ServiceUnavailableException(
        'No language model is configured, so a template cannot be applied',
      );
    }

    const { Agent } = await importMastraAgent();

    return new Agent({
      id: 'mastra-agent',
      name: `template-version-${templateVersion.version}`,
      instructions: templateVersion.prompt ?? DEFAULT_INSTRUCTIONS,
      model,
    });
  }
}
