import react from "../../eslint.react.js";

/**
 * `@akouo/ui` may depend on `@akouo/theme` but never on an app — enforcing the
 * one-way rule theme ← ui ← apps.
 */
export default [
  ...react,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@akouo/app",
                "@akouo/app/*",
                "@akouo/desktop",
                "@akouo/desktop/*",
                "@akouo/website",
                "@akouo/website/*",
              ],
              message:
                "Dependency direction is one-way (theme ← ui ← apps): ui must not import an app.",
            },
          ],
        },
      ],
    },
  },
];
