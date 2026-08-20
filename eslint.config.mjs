import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    ".open-next/**",
    "public/sw.js",
  ]),
  {
    rules: {
      // Disable exhaustive deps for demo code
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
