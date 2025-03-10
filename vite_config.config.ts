import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const root = `${process.cwd()}`;

// https://vitejs.dev/config/
export default defineConfig({
  root: root,
  publicDir: "plugin",
  build: {
    target: "es2015",
    outDir: `${path.resolve(__dirname)}/dist/config`,
    emptyOutDir: false,
    sourcemap: true,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,

    rollupOptions: {
      input: {
        config: `${path.resolve(root, "src/config/index.tsx")}/`,
      },
      output: {
        format: "iife",
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name]-chunk.js",
      },
    },
  },
  plugins: [react(), tsconfigPaths()],
});
