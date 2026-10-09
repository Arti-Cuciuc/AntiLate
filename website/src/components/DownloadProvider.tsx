import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { findLatestApk, RELEASES_URL, safeDownloadUrl } from '../lib/release';
import { Arrow } from './Icons';

const DownloadContext = createContext<{ busy: boolean; error: string; download: () => Promise<void> } | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const cachedUrl = useRef(safeDownloadUrl(import.meta.env.VITE_APK_URL) ?? safeDownloadUrl(import.meta.env.VITE_BUNDLED_APK_URL));

  async function download() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const url = cachedUrl.current ?? await findLatestApk(controller.signal);
      cachedUrl.current = url;
      window.location.assign(url);
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== 'AbortError'
        ? reason.message : 'Сервер не ответил вовремя. Попробуйте ещё раз или откройте GitHub Releases.');
    } finally {
      window.clearTimeout(timeout);
      lock.current = false;
      setBusy(false);
    }
  }
  return <DownloadContext.Provider value={{ busy, error, download }}>{children}</DownloadContext.Provider>;
}

export function DownloadButton({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const context = useContext(DownloadContext)!;
  return <button className={`download-button ${light ? 'download-button-light' : ''} ${compact ? 'download-button-compact' : ''}`}
    onClick={() => void context.download()} disabled={context.busy} aria-busy={context.busy}>
    <span>{context.busy ? 'Проверяем релиз…' : 'Скачать APK'}</span><Arrow direction="down" />
  </button>;
}

export function DownloadStatus() {
  const context = useContext(DownloadContext)!;
  useEffect(() => {
    if (!context.error) return;
    document.getElementById('download-status')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }, [context.error]);
  return <div id="download-status" role="status" className="download-status" aria-live="polite">
    {context.error && <><p>{context.error}</p><a href={RELEASES_URL} target="_blank" rel="noreferrer">Открыть список релизов ↗</a></>}
  </div>;
}
