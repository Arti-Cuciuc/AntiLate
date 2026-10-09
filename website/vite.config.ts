import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localApk } from './plugins/local-apk.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss(), localApk()],
});
