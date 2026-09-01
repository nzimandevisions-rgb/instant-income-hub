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
      // This tells the plugin to not bundle server code into the client
      server: {
        preset: "cloudflare-pages",
      },
    }),
  ],
  // Important: This separates client and server builds
  ssr: {
    noExternal: true,
  },
  build: {
    // Build both client and server
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
