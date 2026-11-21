import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Machine-local scratch: throwaway diagnostic scripts, not application code.
    // They are CommonJS by design (run directly with node against the database),
    // so linting them reported 16 no-require-imports errors that were never
    // defects in anything that ships.
    "scratch/**",
    // Generated / CLI-owned.
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
