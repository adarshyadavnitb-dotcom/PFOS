import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy /api/pfos/* to the n8n webhook API so the browser stays
// same-origin (no CORS). In production, Vercel rewrites do the same thing.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          vendor: ["react", "react-dom", "framer-motion"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api/pfos": {
        target: "https://80.225.221.129.sslip.io",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/pfos/, "/webhook/pfos-api"),
      },
    },
  },
});
