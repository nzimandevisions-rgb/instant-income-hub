export type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ meta?: { changes?: number } }>;
    };
  };
};
export function getDatabase(context: unknown): D1DatabaseLike | null {
  const value = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested =
    value["env"] && typeof value["env"] === "object"
      ? (value["env"] as Record<string, unknown>)
      : null;
  const globalEnv = (globalThis as unknown as { __env__?: Record<string, unknown> }).__env__;
  const processEnv = (globalThis as unknown as { process?: { env?: Record<string, unknown> } })
    .process?.env;
  return (value["DB"] ??
    nested?.["DB"] ??
    globalEnv?.["DB"] ??
    processEnv?.["DB"] ??
    null) as D1DatabaseLike | null;
}
