import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Env, validateEnv } from './env.schema';

/** {@link ConfigService} narrowed to {@link Env}, so `get(key, { infer: true })` is typed. */
export type EnvService = ConfigService<Env, true>;

/**
 * Loads `.env`, validates it against {@link EnvSchema}, and makes the result
 * available application-wide through {@link ConfigService}.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
