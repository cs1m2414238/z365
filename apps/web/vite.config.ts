import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      strictPort: true,
      proxy: {
        "/api": {
          target: env.BACKEND_PROXY_URL || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    preview: {
      strictPort: true,
      proxy: {
        "/api": {
          target: env.BACKEND_PROXY_URL || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    build: { outDir: "dist", sourcemap: false },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      maxWorkers: 1,
    },
  };
});
