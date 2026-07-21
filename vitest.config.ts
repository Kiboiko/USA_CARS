import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // node:sqlite is a newer built-in that Vite's resolver doesn't yet recognise;
  // keep it external so Node loads it natively instead of trying to bundle it.
  ssr: {
    external: ["node:sqlite"],
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        external: ["node:sqlite"],
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts", "src/middleware.ts"],
      exclude: ["src/lib/db/schema.ts"],
    },
  },
});
