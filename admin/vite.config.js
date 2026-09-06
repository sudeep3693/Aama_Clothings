import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  define: {
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify("http://localhost:4000"),
  },
});
