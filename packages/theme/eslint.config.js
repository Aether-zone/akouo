import base from "../../eslint.base.js";

/**
 * `@akouo/theme` sits at the bottom of the dependency graph. It must not import
 * from `@akouo/ui` or any app — enforcing the one-way rule theme ← ui ← apps.
 */
export default [
  ...base,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@akouo/ui",
                "@akouo/ui/*",
                "@akouo/app",
                "@akouo/app/*",
                "@akouo/desktop",
                "@akouo/desktop/*",
                "@akouo/website",
                "@akouo/website/*",
              ],
              message:
                "Dependency direction is one-way (theme ← ui ← apps): theme must not import ui or apps.",
            },
          ],
        },
      ],
    },
  },
];
