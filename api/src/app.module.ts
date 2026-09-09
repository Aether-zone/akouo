import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PistisAuthModule, jwksUriFor } from '@aether-zone/organon';

import {
  AppConfigModule,
  EnvService,
  DatabaseModule,
  FileModule,
  LoculusModule,
  commonEntities,
} from '@akouo/common';

import { RabbitMqModule } from '@aether-zone/organon';

import { AIModule } from '@akouo/ai';

import { EmbeddingModule } from '@akouo/embedding';
import { ExtractionModule, extractionEntities } from '@akouo/extraction';
import { MeetingModule, meetingEntities } from '@akouo/meeting';
import { PersonModule, personEntities } from '@akouo/person';
import { RecordingModule, recordingEntities } from '@akouo/recording';
import { SearchModule } from '@akouo/search';
import { TemplateModule, templateEntities } from '@akouo/template';
import {
  TranscriptionModule,
  transcriptionEntities,
} from '@akouo/transcription';

@Module({
  imports: [
    AppConfigModule,
    AIModule.forRootAsync({
      inject: [ConfigService],
      /*
       * Which provider the application talks to is decided here and nowhere
       * else. `@ai-sdk/openai` is imported inside the factory rather than at the
       * top of the file: it is ESM-only and this build is CommonJS, so a static
       * import of it does not compile. A factory may return a promise, which is
       * what makes that possible.
       */
      useFactory: async (config: EnvService) => {
        const { createOpenAI } = await import('@ai-sdk/openai');

        return {
          provider: createOpenAI({
            apiKey: config.get('OPENAI_API_KEY', { infer: true }),
          }),
          embeddingModel: config.get('OPENAI_EMBEDDING_MODEL', { infer: true }),
          languageModel: config.get('OPENAI_LANGUAGE_MODEL', { infer: true })
        };
      },
    }),
    // Registered once for the whole app: the emitter it provides is global, so a
    // library can emit or listen without wiring anything of its own.
    EventEmitterModule.forRoot(),
    DatabaseModule.forRootAsync(
      [
        ...commonEntities,
        ...extractionEntities,
        ...meetingEntities,
        ...personEntities,
        ...recordingEntities,
        ...templateEntities,
        ...transcriptionEntities,
      ],
      {
        inject: [ConfigService],
        useFactory: (config: EnvService) => ({
          database: config.get('DATABASE_PATH', { infer: true }),
          synchronize: config.get('DATABASE_SYNCHRONIZE', { infer: true }),
        }),
      },
    ),
    FileModule,
    /*
     * Events. Published so that what follows a change can happen outside the
     * request that caused it, and in another service if it belongs there.
     */
    RabbitMqModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: EnvService) => {
        const timeout = config.get('RABBITMQ_CONNECT_TIMEOUT_MS', {
          infer: true,
        });

        return {
          uri: config.get('RABBITMQ_URI', { infer: true }),
          exchange: config.get('RABBITMQ_EXCHANGE', { infer: true }),
          // 0 means "do not wait": start, and connect in the background.
          connectTimeoutMs: timeout === 0 ? false : timeout,
        };
      },
    }),
    /*
     * Where files live. akouo signs nothing itself: it asks loculus for a URL
     * and passes it on, so no recording bytes cross this process.
     */
    LoculusModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: EnvService) => {
        const issuer = config.get('OAUTH_ISSUER', { infer: true });
        const clientId = config.get('OAUTH_CLIENT_ID', { infer: true });
        const clientSecret = config.get('OAUTH_CLIENT_SECRET', { infer: true });

        return {
          baseUrl: config.get('LOCULUS_BASE_URL', { infer: true }),
          timeoutMs: config.get('LOCULUS_TIMEOUT_MS', { infer: true }),
          // Both or neither: half a credential is not one, and silently
          // sending an empty secret would fail as `invalid_client` far away
          // from the variable that was missed.
          serviceCredentials:
            clientId && clientSecret
              ? {
                  clientId,
                  clientSecret,
                  tokenUri:
                    config.get('OAUTH_TOKEN_URI', { infer: true }) ??
                    `${issuer}/api/oauth/token`,
                }
              : undefined,
        };
      },
    }),
    /*
     * Identity comes from pistis. This registers akouo as a resource server for
     * it — tokens are verified against pistis's published keys and nothing here
     * issues, stores or refreshes a credential.
     */
    PistisAuthModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: EnvService) => {
        const issuer = config.get('OAUTH_ISSUER', { infer: true });

        return {
          issuer,
          audience: config.get('OAUTH_AUDIENCE', { infer: true }) ?? issuer,
          jwksUri:
            config.get('OAUTH_JWKS_URI', { infer: true }) ?? jwksUriFor(issuer),
        };
      },
    }),
    EmbeddingModule,
    ExtractionModule,
    MeetingModule,
    PersonModule,
    RecordingModule,
    SearchModule,
    TemplateModule,
    TranscriptionModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
