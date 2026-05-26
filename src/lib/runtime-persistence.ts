import { isSupabaseConfigured } from "./supabase-server";

export class PersistenceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceConfigurationError";
  }
}

export function isProductionRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

export function shouldUsePersistedRuntimeStore(): boolean {
  return isProductionRuntime();
}

export function ensurePersistedRuntimeStoreConfigured(feature: string): void {
  if (!shouldUsePersistedRuntimeStore()) return;
  if (isSupabaseConfigured()) return;
  throw new PersistenceConfigurationError(
    `${feature} を本番で使うには SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。`,
  );
}

export function isPersistenceConfigurationError(
  error: unknown,
): error is PersistenceConfigurationError {
  return error instanceof PersistenceConfigurationError;
}
