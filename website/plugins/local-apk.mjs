import { createReadStream, existsSync, statSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../AntiLate.apk', import.meta.url));
const downloadPath = '/downloads/AntiLate.apk';

// Serve only this selected binary; keep it out of Git.
export function localApk() {
  const available = existsSync(source);
  let outputDirectory;
  let building = false;
  return {
    name: 'antilate-local-apk',
    config: () => ({ define: { 'import.meta.env.VITE_BUNDLED_APK_URL': JSON.stringify(available ? downloadPath : '') } }),
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
      building = config.command === 'build';
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== downloadPath || !available) return next();
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' });
          return response.end();
        }
        try {
          const { size } = statSync(source);
          response.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Disposition': 'attachment; filename="AntiLate.apk"',
            'Content-Length': size,
            'X-Content-Type-Options': 'nosniff',
          });
          if (request.method === 'HEAD') return response.end();
          createReadStream(source).on('error', () => response.destroy()).pipe(response);
        } catch { response.writeHead(404); response.end(); }
      });
    },
    async closeBundle() {
      if (!available || !building) return;
      await mkdir(resolve(outputDirectory, 'downloads'), { recursive: true });
      await copyFile(source, resolve(outputDirectory, 'downloads/AntiLate.apk'));
    },
  };
}
