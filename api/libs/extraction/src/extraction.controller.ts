import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ExtractionService } from "./extraction.service";
import { CurrentActor, OrganizationGuard, type Actor } from '@aether-zone/organon';

@Controller('organizations/:organizationId/extractions')
@UseGuards(OrganizationGuard)
export class ExtractionController {

    constructor(
        private readonly extractionService: ExtractionService
    ) { }

    @Get()
    getExtractions(
        @CurrentActor() user: Actor
    ) {
        return this.extractionService.findAll(user)
    }
}