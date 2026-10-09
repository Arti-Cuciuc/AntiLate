import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localApk } from './plugins/local-apk.mjs';

export default defineConfig({
  // Shared mobile constants must use the website config, not Expo's parent config.
  tsconfig: './tsconfig.json',
  plugins: [react(), tailwindcss(), localApk()],
});
