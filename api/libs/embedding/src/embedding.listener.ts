import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EMBEDDING_EVENT, EmbeddingEvent } from "./embedding.events";
import { EmbeddingService } from "./embedding.service";
import { AIProvider } from "@akouo/ai";

@Injectable()
export class EmbeddingListener {

    constructor(
        private readonly embeddingService: EmbeddingService,
        private readonly aiProvider: AIProvider
    ) { }

    @OnEvent(EMBEDDING_EVENT)
    public async onEmbeddingRequested(event: EmbeddingEvent) {
        const { user, content, sourceId, sourceType } = event;

        const vector = await this.aiProvider.embed(content);

        this.embeddingService.create(user, {
            content,
            sourceId,
            sourceType,
            vector
        })
    }
}