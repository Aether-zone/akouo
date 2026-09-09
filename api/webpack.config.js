const { join } = require('path');

/**
 * Plain webpack — the api bundles itself, with no build framework in between.
 *
 * `compiler: tsc` in the previous Nx plugin meant ts-loader, and it transpiled
 * without type checking. That is kept: `pnpm typecheck` is the type gate, and
 * keeping it out of the bundle step is what makes a rebuild fast.
 */
module.exports = (_env, argv) => {
  const production = argv.mode === 'production';

  return {
    target: 'node',
    mode: production ? 'production' : 'development',
    entry: join(__dirname, 'src/main.ts'),
    devtool: 'source-map',

    /*
     * Never minify. NestJS resolves providers by constructor type and TypeORM
     * builds its schema from entity class names, both read at runtime out of
     * decorator metadata — so mangling names does not shrink the bundle, it
     * breaks it. Production without this dies on boot with
     * `CircularRelationsError: Circular relations detected: TypeORMp -> d -> d`,
     * which is three mangled identifiers wearing a trench coat.
     */
    optimization: { minimize: false },

    output: {
      path: join(__dirname, 'dist'),
      filename: 'main.js',
      clean: true,
      // `@ai-sdk/openai` stays an external loaded through a live `import()`,
      // which webpack only emits if the target is declared to support one.
      environment: { dynamicImport: true },
    },

    // Webpack does its own resolution and does not read `paths` out of
    // tsconfig.app.json. The libs under api/libs are path aliases within this
    // one project rather than workspace packages, so they are spelled out here
    // as well; keep the two lists in step.
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
      '@akouo/ai': join(__dirname, 'libs/ai/src'),
      '@akouo/common': join(__dirname, 'libs/common/src'),
      '@akouo/embedding': join(__dirname, 'libs/embedding/src'),
      '@akouo/extraction': join(__dirname, 'libs/extraction/src'),
      '@akouo/meeting': join(__dirname, 'libs/meeting/src'),
      '@akouo/person': join(__dirname, 'libs/person/src'),
      '@akouo/recording': join(__dirname, 'libs/recording/src'),
      '@akouo/search': join(__dirname, 'libs/search/src'),
      '@akouo/template': join(__dirname, 'libs/template/src'),
      '@akouo/transcription': join(__dirname, 'libs/transcription/src'),
      },
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: join(__dirname, 'tsconfig.app.json'),
              transpileOnly: true,
            },
          },
        },
      ],
    },

    /*
     * Everything from node_modules stays a real `require` at runtime; only this
     * project's own source is bundled. Deciding by request shape rather than by
     * scanning a node_modules directory matters under pnpm, where the api's
     * dependencies live in api/node_modules and a workspace-root scan misses
     * them entirely — which is how bcrypt and better-sqlite3 used to end up
     * bundled, their prebuilt `.node` binaries looked for under api/dist, and
     * the server dead on boot with "No native build was found". typeorm has the
     * same requirement for a different reason: it loads drivers through
     * `require(driverName)` with a computed name, which webpack cannot resolve.
     *
     * `@akouo/*` is the exception: those are this project's own libs (aliased
     * above) and `@akouo/contract`, which is consumed as TypeScript source, so
     * both have to be compiled in.
     */
    externals: [
      function ({ request }, callback) {
        if (!request || /^[./]/.test(request) || request.startsWith('@akouo/')) {
          return callback();
        }

        // ESM-only, and reached through `await import(...)` in app.module.ts
        // precisely because this bundle is CommonJS. Bundling it would turn
        // that into a require of a webpack chunk and undo the whole point.
        // (@mastra/core is loaded the same way but through a `Function`
        // constructor, so webpack never sees it.)
        if (request === '@ai-sdk/openai') {
          return callback(null, `module-import ${request}`);
        }

        return callback(null, `commonjs ${request}`);
      },
    ],
  };
};
