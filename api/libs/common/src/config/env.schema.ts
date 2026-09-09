import { z } from 'zod';

/** Reads a boolean from an environment variable, which is always a string. */
const BooleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

/** Every environment variable Aether OS reads, with its defaults. */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3310),

  DATABASE_PATH: z.string().min(1).default('db.sqlite'),
  DATABASE_SYNCHRONIZE: BooleanFromString.default(true),

  /**
   * Where multer writes an incoming recording before it is forwarded to the
   * object store. Only the `multipart/form-data` upload path uses it; a browser
   * given a presigned URL uploads to the store directly and never lands here.
   */
  UPLOAD_PATH: z.string().min(1).default('uploads/recordings'),
  /** Largest recording the multipart endpoint accepts, in bytes. */
  UPLOAD_MAX_FILE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024 * 1024),

  /*
   * Identity is delegated to pistis, the aether-zone authorization server.
   * akouo signs nothing and stores no passwords: the api accepts pistis's
   * access tokens, and the web app runs the authorization code flow as the
   * client registered there under OAUTH_CLIENT_ID.
   */

  /** Public origin of pistis. Must equal the `iss` claim of its tokens exactly. */
  OAUTH_ISSUER: z.url().default('http://localhost:3001'),
  /**
   * `aud` every accepted token must carry. pistis defaults its audience to its
   * own issuer, so this defaults to OAUTH_ISSUER rather than to a literal.
   */
  OAUTH_AUDIENCE: z.string().min(1).optional(),
  /**
   * Where pistis publishes its public signing keys. Derived from the issuer per
   * RFC 8414 when unset, which is what a normal deployment wants.
   */
  OAUTH_JWKS_URI: z.url().optional(),

  /*
   * loculus, the object store service. akouo asks it where a file may be put
   * and hands the answer to the browser, which uploads there directly.
   */

  /**
   * Internal origin of the loculus api — akouo reaches it server-to-server.
   * Not to be confused with the store address loculus signs into its URLs,
   * which has to be one the *browser* can resolve.
   */
  LOCULUS_BASE_URL: z.url().default('http://localhost:3112'),
  /** How long akouo waits for loculus before answering 504, in milliseconds. */
  LOCULUS_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),

  /*
   * akouo's own credentials at pistis, used only for work no caller is waiting
   * on — transcription reading a recording back, say, which starts from an
   * event after the response has gone.
   *
   * Optional, because every other path has a caller to borrow a token from, and
   * refusing to boot over a credential most of the api never touches would be
   * the wrong trade. Anything reaching loculus
   * without a relayed token fails with a message naming these instead.
   */
  OAUTH_CLIENT_ID: z.string().min(1).optional(),
  OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  /** pistis's token endpoint. Derived from the issuer when unset. */
  OAUTH_TOKEN_URI: z.url().optional(),

  /*
   * RabbitMQ. Events are published so work that follows a change — indexing,
   * transcribing, notifying — can happen outside the request that caused it.
   */

  /** `amqp://user:pass@host:5672`, or a vhost URL. */
  RABBITMQ_URI: z.string().min(1).default('amqp://localhost:5672'),
  /** Topic exchange events go to. Every aether-zone service shares one. */
  RABBITMQ_EXCHANGE: z.string().min(1).default('aether-zone'),
  /**
   * Wait this long for the broker before finishing the boot, in milliseconds.
   *
   * `0` starts anyway and connects in the background, which is what a
   * development machine without a broker wants — akouo still serves every
   * request that does not publish.
   */
  RABBITMQ_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(0).default(10_000),

  /** AssemblyAI API key. Without one, recordings go to the mock transcriber instead. */
  ASSEMBLYAI_API_KEY: z.string().min(1).optional(),
  /**
   * Whether AssemblyAI can reach the object store itself.
   *
   * True, a recording is transcribed from a presigned URL and its bytes never
   * touch this process. False — the default, and what development needs — akouo
   * reads the object and uploads it, because a store on `localhost` is not
   * something a third party can fetch from.
   *
   * Turning this on where the store is not publicly reachable does not fail
   * here; it fails inside AssemblyAI, as a transcript that never starts.
   */
  ASSEMBLYAI_FETCHES_FROM_STORE: BooleanFromString.default(false),

  MASTRA_PORT: z.coerce.number().int().positive().default(4111),
  OPENAI_API_KEY: z.string().min(1).optional(),
  /** Model text generation runs on when a caller names none. */
  OPENAI_LANGUAGE_MODEL: z.string().min(1).default('gpt-4o'),
  /** Model embeddings are made with. Changing it invalidates stored vectors. */
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
});

/** The validated environment, as handed to `ConfigService`. */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Validates `process.env` against {@link EnvSchema}, failing the boot with a
 * readable list of problems rather than an undefined value halfway through a request.
 */
export const validateEnv = (env: Record<string, unknown>): Env => {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
};
