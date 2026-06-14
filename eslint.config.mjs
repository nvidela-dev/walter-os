import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Type-aware rules, scoped to our own TypeScript sources. `strictTypeChecked`
  // already bans `any`, unsafe access, floating promises, redundant conditions,
  // non-null assertions, etc.; `stylisticTypeChecked` adds `??` over `||`,
  // optional chaining and other tidy-ups. We only layer extras on top.
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // ── Robust types ──────────────────────────────────────────────────
      // No `as`: model the type correctly instead of asserting it.
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      // Public surfaces declare their types explicitly.
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: false,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // Conditions must be real booleans — no truthy/nullable coercion.
      "@typescript-eslint/strict-boolean-expressions": "error",
      // Numbers interpolate cleanly into templates; everything else must be a string.
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // Every union/enum branch is handled.
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Lock down anything that never gets reassigned.
      "@typescript-eslint/prefer-readonly": "error",
      // Dead code is a type smell; allow intentional `_`-prefixed escapes.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ── Minimal, stylish code ─────────────────────────────────────────
      // Fold type-only imports into the value import line.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-lonely-if": "error",
      "no-unneeded-ternary": "error",
      "no-useless-rename": "error",
      "operator-assignment": ["error", "always"],
      eqeqeq: ["error", "smart"],

      // ── Imports ───────────────────────────────────────────────────────
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/no-duplicates": "error",
    },
  },

  // Tests favour readability over ceremony: testing-library/vitest matchers and
  // mocks are loosely typed, and inline callbacks gain nothing from explicit
  // return types. Production code stays fully strict.
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },

  // Plain JS (config files, scripts) has no project type info — drop the
  // type-aware rules there so they don't error out.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    "coverage/**",
    "public/sw.js",
    "public/workbox-*.js",
  ]),
]);
