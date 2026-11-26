import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// สร้างเป็นไฟล์ HTML ไฟล์เดียว (dist/index.html) นำไปวางบนโฮสต์ไหนก็ได้ เช่น Netlify Drop
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 }
});
