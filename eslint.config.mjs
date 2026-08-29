import boundaries from "eslint-plugin-boundaries";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const architectureFiles = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "features/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "src/**/*.{ts,tsx}",
  "di/**/*.{ts,tsx}",
  "drizzle/**/*.{ts,tsx}",
];

const architectureElements = [
  { type: "framework", pattern: "app", partialMatch: false },
  { type: "framework", pattern: "components", partialMatch: false },
  { type: "framework", pattern: "features", partialMatch: false },
  { type: "framework", pattern: "hooks", partialMatch: false },
  { type: "framework", pattern: "lib", partialMatch: false },
  {
    type: "interface-adapters",
    pattern: "src/interface-adapters",
    partialMatch: false,
  },
  {
    type: "application",
    pattern: "src/application",
    partialMatch: false,
  },
  { type: "entities", pattern: "src/entities", partialMatch: false },
  {
    type: "infrastructure",
    pattern: "src/infrastructure",
    partialMatch: false,
  },
  { type: "di", pattern: "di", partialMatch: false },
  { type: "database", pattern: "drizzle", partialMatch: false },
];

const architecturePolicies = [
  {
    from: { element: { type: "framework" } },
    allow: {
      to: {
        element: {
          type: ["framework", "interface-adapters", "entities", "di"],
        },
      },
    },
  },
  {
    from: { element: { type: "interface-adapters" } },
    allow: {
      to: {
        element: { type: ["interface-adapters", "application", "entities"] },
      },
    },
  },
  {
    from: { element: { type: "application" } },
    allow: {
      to: { element: { type: ["application", "entities"] } },
    },
  },
  {
    from: { element: { type: "entities" } },
    allow: { to: { element: { type: "entities" } } },
  },
  {
    from: { element: { type: "infrastructure" } },
    allow: {
      to: {
        element: {
          type: ["infrastructure", "application", "entities", "database"],
        },
      },
    },
  },
  {
    from: { element: { type: "di" } },
    allow: {
      to: {
        element: {
          type: ["di", "interface-adapters", "application", "infrastructure"],
        },
      },
    },
  },
  {
    from: { element: { type: "database" } },
    allow: { to: { element: { type: "database" } } },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: architectureFiles,
    plugins: { boundaries },
    settings: { "boundaries/elements": architectureElements },
    rules: {
      "boundaries/dependencies": [
        "error",
        { default: "disallow", policies: architecturePolicies },
      ],
      "boundaries/no-unknown-files": "error",
      "boundaries/no-unknown-dependencies": "error",
    },
  },
  // ponytail: bypass broken ESLint 10 auto-detect; remove after eslint-plugin-react supports ESLint 10.
  { settings: { react: { version: "19.2" } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
