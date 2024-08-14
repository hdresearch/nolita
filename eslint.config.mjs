import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      import: pluginImport,
    },
    rules: {
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "always",
          mjs: "always",
          cjs: "always",
          ts: "never",
        }
      ],
    },
  },
  { languageOptions: { globals: globals.browser, parserOptions: { sourceType: "module" } } },
  { ignores: ["node_modules/**", "dist/**", "docs/**"] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];