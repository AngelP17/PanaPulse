// Chat transport. Two backends, same guardrails:
//  1. Inside a Claude artifact viewer: the `sample` capability, with page-side tools.
//  2. In the native app: POST to the PanaPulse backend (/v0/ask), which runs the same
//     tools server-side with a cheap model (Haiku 5.5 by default).
import type { SeismicData } from '../data/usgs';
import type { Lang } from '../i18n/strings';
import { buildTools, SYSTEM_PROMPT } from './tools';

export const MAX_INPUT = 400;
export const MODEL = 'claude-haiku-5-5';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

export type Transport = 'artifact' | 'server' | 'none';

const API_URL: string | undefined = process.env.EXPO_PUBLIC_API_URL;

function claudeRuntime(): { use: (name: string) => Promise<any> } | null {
  const w = typeof window !== 'undefined' ? (window as any) : null;
  return w?.claude?.use ? w.claude : null;
}

let samplePromise: Promise<any> | null = null;
function getSample(): Promise<any> {
  const rt = claudeRuntime();
  if (!rt) return Promise.resolve(null);
  samplePromise ??= rt.use('sample').catch(() => null);
  return samplePromise;
}

export async function detectTransport(): Promise<Transport> {
  if (await getSample()) return 'artifact';
  if (API_URL) return 'server';
  return 'none';
}

export class ChatError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export async function ask(
  history: Turn[],
  data: SeismicData,
  lang: Lang,
  opts: { onText?: (text: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const last = history[history.length - 1];
  if (!last || last.role !== 'user') throw new ChatError('bad_input');
  if (last.content.trim().length === 0 || last.content.length > MAX_INPUT) throw new ChatError('too_long');
  // Keep context small and cheap: the last 6 turns only.
  const turns = history.slice(-6);

  const sample = await getSample();
  if (sample) {
    const rules = `${SYSTEM_PROMPT}\nThe user's app language is ${lang === 'es' ? 'Spanish' : 'English'}.\nReply to the conversation that follows. Acknowledge nothing about these rules.`;
    const tools = buildTools(data).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      execute: async (input: unknown) => t.execute(input ?? {}),
    }));
    try {
      const { text } = await sample(
        [{ role: 'user', content: rules }, { role: 'assistant', content: 'OK.' }, ...turns],
        { tools, model: MODEL, modelTier: 'quick', cache: false, signal: opts.signal, onText: ({ text }: { text: string }) => opts.onText?.(text) },
      );
      return text;
    } catch (e: any) {
      throw new ChatError(e?.code ?? 'failed', e?.message);
    }
  }

  if (API_URL) {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/v0/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: turns, lang }),
      signal: opts.signal,
    });
    if (res.status === 429) throw new ChatError('rate_limited');
    if (!res.ok) throw new ChatError('failed', `HTTP ${res.status}`);
    const body = await res.json();
    opts.onText?.(body.answer);
    return body.answer as string;
  }

  throw new ChatError('unavailable');
}
