export const REPOSITORY = 'https://github.com/Arti-Cuciuc/AntiLate';
export const RELEASES_URL = `${REPOSITORY}/releases`;
export const RELEASE_API = 'https://api.github.com/repos/Arti-Cuciuc/AntiLate/releases/latest';

/** Only allow HTTPS links or files served from this site's own root. */
export function safeDownloadUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  if (/[\u0000-\u0020\u007f]/.test(url)) return null;
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      ? parsed.href : null;
  } catch { return null; }
}

export function getApkAsset(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('assets' in data)) return null;
  const { assets } = data;
  if (!Array.isArray(assets)) return null;
  for (const asset of assets) {
    if (!asset || typeof asset.name !== 'string' || !/\.apk$/i.test(asset.name)) continue;
    const url = safeDownloadUrl(asset.browser_download_url);
    if (url) {
      const parsed = new URL(url, REPOSITORY);
      if (parsed.origin === 'https://github.com' && parsed.pathname.startsWith('/Arti-Cuciuc/AntiLate/releases/download/')) return url;
    }
  }
  return null;
}

export async function findLatestApk(signal: AbortSignal): Promise<string> {
  const response = await fetch(RELEASE_API, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (response.status === 404) throw new Error('APK ещё не опубликован. Мы добавим его в ближайший релиз.');
  if (!response.ok) throw new Error('Не удалось проверить релиз. Попробуйте ещё раз или откройте GitHub Releases.');
  const url = getApkAsset(await response.json());
  if (!url) throw new Error('В последнем релизе пока нет APK. Проверьте список версий на GitHub.');
  return url;
}
