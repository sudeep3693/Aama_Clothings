import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: {
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify("http://localhost:4000"),
    "import.meta.env.VITE_AES_KEY": JSON.stringify("cb4b2cc04110a860abffcd504d46fd2550ae1ed42b70e43f74f97cd918e0d1e7"),
  },
});
