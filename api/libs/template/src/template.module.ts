import { Module } from '@nestjs/common';

import { TranscriptionModule } from '@akouo/transcription';

import { TemplateService } from './template.service';
import { TemplateMapper } from './template.mapper';
import { templateProviders } from './template.providers';
import { TemplateController } from './template.controller';
import { TemplateApplier } from './apply/template-applier';
import { TemplateApplierController } from './apply/template-applier.controller';
import { TemplateVersionService } from './version/template-version.service';
import { TemplateVersionMapper } from './version/template-version.mapper';
import { templateVersionProviders } from './version/template-version.providers';
import { TemplateVersionController } from './version/template-version.controller';

@Module({
  // For `TranscriptionService`: applying a version reads the transcription it is
  // applied to, and that library is the one that can load it.
  imports: [TranscriptionModule],
  providers: [
    ...templateProviders,
    ...templateVersionProviders,
    TemplateService,
    TemplateMapper,
    TemplateVersionService,
    TemplateVersionMapper,
    TemplateApplier,
  ],
  controllers: [
    TemplateController,
    TemplateVersionController,
    TemplateApplierController,
  ],
  exports: [
    TemplateService,
    TemplateMapper,
    TemplateVersionService,
    TemplateApplier,
  ],
})
export class TemplateModule { }
