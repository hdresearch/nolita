import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {files: ["**/*.{js,mjs,cjs,ts}"],},
  {languageOptions: { globals: globals.browser }},
  {ignores: ["node_modules/**", "dist/**", "docs/**", ]},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

    // Adding rule configuration to disable no-explicit-any
    {
      files: ["**/*.ts"], // Targeting TypeScript files specifically
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
];