import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/collaboration": {
        target: "ws://localhost:3002",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          blocknote: ["@blocknote/core", "@blocknote/react"],
          yjs: ["yjs", "@hocuspocus/provider"],
        },
      },
    },
  },
});
