import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackStartVite } from "@tanstack/start-plugin";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    TanStackStartVite({
      server: {
        preset: "cloudflare-pages",
      },
    }),
  ],
  ssr: {
    noExternal: true,
  },
  build: {
    // This tells Vite to build both client and server
    ssr: true,
    rollupOptions: {
      input: {
        client: "src/entry-client.tsx",
        server: "src/start.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
