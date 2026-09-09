import { CreateTemplateVersionDTO, TemplateVersionDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';

import { Template } from '../template.entity';
import { TemplateService } from '../template.service';
import { TemplateVersion } from './template-version.entity';
import { TemplateVersionMapper } from './template-version.mapper';

@Injectable()
export class TemplateVersionService {
  constructor(
    @Inject('TEMPLATE_VERSION_REPOSITORY')
    private readonly versionRepository: Repository<TemplateVersion>,
    private readonly versionMapper: TemplateVersionMapper,
    private readonly templateService: TemplateService,
  ) {}

  /** A template's history, newest first. */
  async findAll(
    user: Actor,
    templateId: string,
  ): Promise<TemplateVersionDTO[]> {
    await this.templateService.findById(user, templateId);

    const entities = await this.versionRepository
      .createQueryBuilder('version')
      .where('version.template = :templateId', { templateId })
      .orderBy('version.version', 'DESC')
      .getMany();

    return entities.map((entity) => this.versionMapper.toDTO(entity, templateId));
  }

  async findById(
    user: Actor,
    templateId: string,
    id: string,
  ): Promise<TemplateVersionDTO> {
    return this.versionMapper.toDTO(
      await this.loadVersion(user, templateId, id),
      templateId,
    );
  }

  /**
   * Snapshots a template. Without `content` the template's own is stored, which
   * is what "save a version" usually means; with it, a wording that was never on
   * the template can be kept — an alternative to come back to.
   *
   * Numbers run from 1 per template and are worked out here rather than counted
   * by the caller.
   */
  async create(
    user: Actor,
    templateId: string,
    version: CreateTemplateVersionDTO,
  ): Promise<TemplateVersionDTO> {
    // Also the access check: a template the caller does not own is not found.
    const template = await this.templateService.findById(user, templateId);

    const entity: TemplateVersion = new TemplateVersion();

    entity.template = this.templateReference(templateId);
    entity.version = (await this.latestNumber(templateId)) + 1;
    entity.content = version.content ?? template.content;
    entity.prompt = version.prompt ?? null;
    // Snapshots start as drafts; publishing one is its own step.
    entity.status = 'DRAFT';
    entity.createdBy = user.id;
    entity.organizationId = user.organizationId;

    const saved = await this.versionRepository.save(entity);

    return this.versionMapper.toDTO(saved, templateId);
  }

  /**
   * Marks a version as the published one.
   *
   * A template has at most one: whatever was published before goes back to
   * draft, so "published" always names a single wording. Publishing an already
   * published version changes nothing, which makes the button safe to press
   * twice.
   */
  async publish(
    user: Actor,
    templateId: string,
    id: string,
  ): Promise<TemplateVersionDTO> {
    const version = await this.loadVersion(user, templateId, id);

    if (version.status !== 'PUBLISHED') {
      await this.versionRepository
        .createQueryBuilder()
        .update(TemplateVersion)
        .set({ status: 'DRAFT' })
        .where('template_id = :templateId', { templateId })
        .andWhere('status = :status', { status: 'PUBLISHED' })
        .execute();

      version.status = 'PUBLISHED';

      await this.versionRepository.save(version);
    }

    return this.versionMapper.toDTO(version, templateId);
  }

  /**
   * Puts a version's wording back on the template. The template keeps its own
   * identity — only the content moves — and the history is left untouched, so
   * restoring is itself undoable.
   */
  async restore(
    user: Actor,
    templateId: string,
    id: string,
  ): Promise<TemplateVersionDTO> {
    const version = await this.loadVersion(user, templateId, id);

    await this.templateService.update(user, templateId, {
      content: version.content,
    });

    return this.versionMapper.toDTO(version, templateId);
  }

  async delete(
    user: Actor,
    templateId: string,
    id: string,
  ): Promise<void> {
    await this.versionRepository.remove(
      await this.loadVersion(user, templateId, id),
    );
  }

  private async latestNumber(templateId: string): Promise<number> {
    const latest = await this.versionRepository
      .createQueryBuilder('version')
      .where('version.template = :templateId', { templateId })
      .orderBy('version.version', 'DESC')
      .getOne();

    return latest?.version ?? 0;
  }

  private async loadVersion(
    user: Actor,
    templateId: string,
    id: string,
  ): Promise<TemplateVersion> {
    // A version has no owner of its own; the template it belongs to has one.
    await this.templateService.findById(user, templateId);

    const version = await this.versionRepository
      .createQueryBuilder('version')
      .where('version.id = :id', { id })
      .andWhere('version.template = :templateId', { templateId })
      .getOne();

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    return version;
  }

  /** A detached Template carrying just the id, enough to write the FK. */
  private templateReference(id: string): Template {
    const template: Template = new Template();
    template.id = id;

    return template;
  }
}
