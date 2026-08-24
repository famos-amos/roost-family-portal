import * as Crypto from 'expo-crypto';

/** Short, dependency-light unique id generator for local records. */
export function makeId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback for environments where the native module isn't ready yet
    // (e.g. first render on web/tests).
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
