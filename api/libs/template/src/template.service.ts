import { CreateTemplateDTO, TemplateDTO, UpdateTemplateDTO } from '@akouo/contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import type { Actor } from '@aether-zone/organon';

import { Template } from './template.entity';
import { TemplateMapper } from './template.mapper';

@Injectable()
export class TemplateService {
  constructor(
    @Inject('TEMPLATE_REPOSITORY')
    private readonly templateRepository: Repository<Template>,
    private readonly templateMapper: TemplateMapper,
  ) {}

  /** The caller's templates, by name. */
  async findAll(user: Actor): Promise<TemplateDTO[]> {
    const entities = await this.templateRepository
      .createQueryBuilder('template')
      .where('template.organizationId = :organizationId', { organizationId: user.organizationId })
      .orderBy('template.name', 'ASC')
      .getMany();

    return entities.map((entity) => this.templateMapper.toDTO(entity));
  }

  async findById(user: Actor, id: string): Promise<TemplateDTO> {
    return this.templateMapper.toDTO(await this.loadTemplate(user, id));
  }

  async create(
    user: Actor,
    template: CreateTemplateDTO,
  ): Promise<TemplateDTO> {
    const entity: Template = this.templateMapper.toEntity(template);

    // Every read here filters on the owner, so an unstamped row would be
    // invisible to the caller that just created it.
    entity.createdBy = user.id;
    entity.organizationId = user.organizationId;

    return this.templateMapper.toDTO(
      await this.templateRepository.save(entity),
    );
  }

  /** Only what is sent changes; the rest stays as it was. */
  async update(
    user: Actor,
    id: string,
    update: UpdateTemplateDTO,
  ): Promise<TemplateDTO> {
    const entity = await this.loadTemplate(user, id);

    if (update.name !== undefined) {
      entity.name = update.name;
    }
    if (update.description !== undefined) {
      // `null` is a real value here: it clears a description that was set.
      entity.description = update.description;
    }
    if (update.content !== undefined) {
      entity.content = update.content;
    }

    return this.templateMapper.toDTO(
      await this.templateRepository.save(entity),
    );
  }

  async delete(user: Actor, id: string): Promise<void> {
    await this.templateRepository.remove(await this.loadTemplate(user, id));
  }

  private async loadTemplate(user: Actor, id: string): Promise<Template> {
    const template = await this.templateRepository
      .createQueryBuilder('template')
      .where('template.id = :id', { id })
      .andWhere('template.organizationId = :organizationId', { organizationId: user.organizationId })
      .getOne();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }
}
