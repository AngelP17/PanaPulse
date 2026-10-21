/** Connected beta never silently substitutes showcase scenarios or bundled records. */
export const CONNECTED = process.env.EXPO_PUBLIC_APP_MODE === 'connected';
export const PREVIEW_ALLOWED = !CONNECTED;
export const API_URL = process.env.EXPO_PUBLIC_APP_MODE === 'showcase'
  ? '' : (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, public detail?: string) { super(`HTTP_${status}`); }
}

export async function apiJson(path: string, init: RequestInit = {}, timeoutMs = 12000): Promise<any> {
  if (!API_URL) throw new Error('not_configured');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  init.signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init, signal: controller.signal,
      headers: { Accept: 'application/json', ...init.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, typeof body?.detail === 'string' ? body.detail : undefined);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
}
