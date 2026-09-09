import { CreateExtractionDTO } from '@akouo/contract';
import { Injectable } from "@nestjs/common";
import { ExtractionService } from "./extraction.service";
import { OnEvent } from "@nestjs/event-emitter";
import { TEMPLATE_APPLIED_EVENT, TemplateAppliedEvent } from "@akouo/template";

@Injectable()
export class ExtractionListener {

    constructor(
        private readonly extractionService: ExtractionService
    ) {

    }

    @OnEvent(TEMPLATE_APPLIED_EVENT)
    onTemplateApplied(event: TemplateAppliedEvent) {
        const { transcriptionId, result, templateVersion, user } = event;
        const extraction: CreateExtractionDTO = {
            templateVersionId: templateVersion.id,
            output: result,
            transcriptionId: transcriptionId
        }

        this.extractionService.create(user, extraction);
    }
}