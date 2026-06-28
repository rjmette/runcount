/**
 * Safe, versioned, schema-validated localStorage access.
 *
 * All persisted application data should flow through these helpers instead of
 * touching `localStorage` directly. They provide:
 *  - quota/availability safety (private-mode and full-storage failures never throw),
 *  - integrity validation via caller-supplied type guards,
 *  - automatic clearing of corrupt or wrong-shaped entries,
 *  - a versioned envelope (`{ v, data }`) so future schema changes can migrate
 *    old data instead of crashing.
 *
 * Encryption note (intentional, see issue #44):
 * Client-side encryption of non-sensitive game data is deliberately NOT
 * implemented. Any key shipped in the JS bundle is recoverable by the client,
 * so it would be obfuscation rather than real security while adding migration
 * and performance cost. The only genuinely sensitive data (auth/session tokens)
 * is managed separately under `src/aws-auth/` and is out of scope here.
 */

/**
 * Current persisted-data schema version. Bump this when the on-disk shape of any
 * enveloped value changes, and add a migration step in the relevant migrator.
 */
export const SCHEMA_VERSION = 1;

interface StorageEnvelope<T> {
  v: number;
  data: T;
}

/**
 * Migrates legacy/older data to the current schema shape.
 * Receives the stored version (0 for legacy/unversioned data) and the raw data.
 */
export type Migrator = (fromVersion: number, data: unknown) => unknown;

/** Reads a raw string from localStorage, returning null if storage is unavailable. */
export const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}":`, error);
    return null;
  }
};

/** Writes a raw string to localStorage. Returns false on quota/availability failure. */
export const safeSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Unable to write localStorage key "${key}":`, error);
    return false;
  }
};

/** Removes a key from localStorage, swallowing any storage errors. */
export const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Unable to remove localStorage key "${key}":`, error);
  }
};

const isEnvelope = (value: unknown): value is StorageEnvelope<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  'v' in value &&
  typeof (value as { v: unknown }).v === 'number' &&
  'data' in value;

/**
 * Reads, validates, and (if needed) migrates a persisted value.
 *
 * The stored value may be either a versioned envelope (`{ v, data }`) written by
 * {@link writeValidated} or a legacy/unversioned value (treated as version 0).
 * If the JSON is malformed, the data fails the type guard, or migration throws,
 * the corrupt entry is cleared and `fallback` is returned.
 */
export function readValidated<T>(
  key: string,
  guard: (value: unknown) => value is T,
  fallback: T,
  migrate?: Migrator,
): T {
  const raw = safeGet(key);
  if (raw === null) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`Corrupt JSON in localStorage key "${key}", clearing.`, error);
    safeRemove(key);
    return fallback;
  }

  let version = 0;
  let data: unknown = parsed;
  if (isEnvelope(parsed)) {
    version = parsed.v;
    data = parsed.data;
  }

  if (version < SCHEMA_VERSION && migrate) {
    try {
      data = migrate(version, data);
    } catch (error) {
      console.warn(`Migration failed for localStorage key "${key}", clearing.`, error);
      safeRemove(key);
      return fallback;
    }
  }

  if (!guard(data)) {
    console.warn(`Invalid data shape in localStorage key "${key}", clearing.`);
    safeRemove(key);
    return fallback;
  }

  return data;
}

/** Writes a value wrapped in the current-version envelope. Returns false on failure. */
export function writeValidated<T>(key: string, data: T): boolean {
  const envelope: StorageEnvelope<T> = { v: SCHEMA_VERSION, data };
  return safeSet(key, JSON.stringify(envelope));
}

// --- Generic primitive type guards (composable for callers) ---

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isNumberRecord = (value: unknown): value is Record<string, number> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item));
