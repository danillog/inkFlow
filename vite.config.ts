/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import type { PluginOption } from "vite";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "InkFlow",
        short_name: "InkFlow",
        description: "InkFlow: Produtividade Local-First",
        theme_color: "#0D1117",
        background_color: "#0D1117",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          if (_req.url?.endsWith(".wasm")) {
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      },
    },
  ] as PluginOption[],
  resolve: {
    alias: {
      "ink-engine": path.resolve(__dirname, "src/wasm-modules/ink_engine.js"),
      "yjs": path.resolve(__dirname, "node_modules/yjs/dist/yjs.mjs"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    include: ['**/*.{test,spec,integration.test}.{ts,tsx}'],
    deps: {
      inline: [/^(?!.*vitest).*$/],
    },
  },
});
