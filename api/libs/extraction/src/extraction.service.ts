import { CreateExtractionDTO, ExtractionDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';
import { TemplateVersion } from '@akouo/template';
import { Transcription } from '@akouo/transcription';

import { Extraction } from './extraction.entity';
import { ExtractionMapper } from './extraction.mapper';

@Injectable()
export class ExtractionService {
  constructor(
    @Inject('EXTRACTION_REPOSITORY')
    private readonly extractionRepository: Repository<Extraction>,
    private readonly extractionMapper: ExtractionMapper,
  ) { }

  async findAll(
    user: Actor
  ): Promise<ExtractionDTO[]> {
    const entities = await this.extractionRepository
      .createQueryBuilder('extraction')
      .leftJoinAndSelect('extraction.templateVersion', 'templateVersion')
      .leftJoinAndSelect('extraction.transcription', 'transcription')
      .where('extraction.organizationId = :organizationId', { organizationId: user.organizationId })
      .orderBy('extraction.createdAt', 'DESC')
      .getMany();

    return entities.map((e) => this.extractionMapper.toDTO(e, e.templateVersion.id, e.transcription.id))
  }

  /** Everything extracted from one transcription, newest first. */
  async findAllForTranscription(
    user: Actor,
    transcriptionId: string,
  ): Promise<ExtractionDTO[]> {
    const entities = await this.extractionRepository
      .createQueryBuilder('extraction')
      .leftJoinAndSelect('extraction.templateVersion', 'templateVersion')
      .where('extraction.organizationId = :organizationId', { organizationId: user.organizationId })
      .andWhere('extraction.transcription = :transcriptionId', {
        transcriptionId,
      })
      .orderBy('extraction.createdAt', 'DESC')
      .getMany();

    return entities.map((entity) =>
      this.extractionMapper.toDTO(
        entity,
        entity.templateVersion?.id ?? '',
        transcriptionId,
      ),
    );
  }

  async findById(user: Actor, id: string): Promise<ExtractionDTO> {
    const entity = await this.loadExtraction(user, id);

    return this.extractionMapper.toDTO(
      entity,
      entity.templateVersion?.id ?? '',
      entity.transcription?.id ?? '',
    );
  }

  /**
   * Keeps a result. Nothing here produces it — a caller that has run a template
   * hands the answer over, the same way a vector is handed to the embedding
   * library already computed.
   */
  async create(
    user: Actor,
    extraction: CreateExtractionDTO,
  ): Promise<ExtractionDTO> {
    const entity: Extraction = new Extraction();

    entity.templateVersion = this.reference(
      TemplateVersion,
      extraction.templateVersionId,
    );
    entity.transcription = this.reference(
      Transcription,
      extraction.transcriptionId,
    );
    entity.output = extraction.output;
    // Every read filters on the owner, so an unstamped row would be invisible
    // to the caller that just created it.
    entity.createdBy = user.id;
    entity.organizationId = user.organizationId;

    const saved = await this.extractionRepository.save(entity);

    return this.extractionMapper.toDTO(
      saved,
      extraction.templateVersionId,
      extraction.transcriptionId,
    );
  }

  async delete(user: Actor, id: string): Promise<void> {
    await this.extractionRepository.remove(await this.loadExtraction(user, id));
  }

  private async loadExtraction(
    user: Actor,
    id: string,
  ): Promise<Extraction> {
    const extraction = await this.extractionRepository
      .createQueryBuilder('extraction')
      .leftJoinAndSelect('extraction.templateVersion', 'templateVersion')
      .leftJoinAndSelect('extraction.transcription', 'transcription')
      .where('extraction.id = :id', { id })
      .andWhere('extraction.organizationId = :organizationId', { organizationId: user.organizationId })
      .getOne();

    if (!extraction) {
      throw new NotFoundException('Extraction not found');
    }

    return extraction;
  }

  /** A detached row carrying just the id, enough for TypeORM to write the FK. */
  private reference<T extends { id: string }>(
    Entity: new () => T,
    id: string,
  ): T {
    const entity = new Entity();
    entity.id = id;

    return entity;
  }
}
