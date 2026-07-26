type PreparedStatement = {
  bind: (...values: unknown[]) => PreparedStatement;
  run: () => Promise<unknown>;
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

export const createRecordId = (prefix: string) =>
  `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
