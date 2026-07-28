type PreparedStatement = {
  bind: (...values: unknown[]) => PreparedStatement;
  run: () => Promise<{
    success?: boolean;
    meta?: { changes?: number };
  }>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{
    results?: T[];
  }>;
};

export type CommerceDatabase = {
  prepare: (query: string) => PreparedStatement;
  batch: (statements: PreparedStatement[]) => Promise<unknown>;
};

export async function getCommerceDatabase(): Promise<CommerceDatabase | null> {
  try {
    const { env } = await import("cloudflare:workers");
    return (
      (env as unknown as { DB?: CommerceDatabase }).DB ?? null
    );
  } catch {
    return null;
  }
}

export type R2ObjectBody = {
  body: ReadableStream<Uint8Array> | null;
  httpEtag?: string;
  size?: number;
  writeHttpMetadata?: (headers: Headers) => void;
};

export type MediaBucket = {
  put: (
    key: string,
    value: ArrayBuffer | ReadableStream | Blob,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectBody | null>;
  delete: (key: string) => Promise<void>;
};

export async function getMediaBucket(): Promise<MediaBucket | null> {
  try {
    const { env } = await import("cloudflare:workers");
    return (env as unknown as { MEDIA?: MediaBucket }).MEDIA ?? null;
  } catch {
    return null;
  }
}

export async function getRuntimeSecret(name: string) {
  try {
    const { env } = await import("cloudflare:workers");
    const value = (env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // Node-based builds and tests do not expose the Workers virtual module.
  }
  const value = process.env[name];
  return value?.trim() ?? "";
}

export const createRecordId = (prefix: string) =>
  `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
