import { pathToFileURL } from "url";
import path from "path";

export const activeModules: Map<string, any> = new Map();

/**
 * Reloads a module at given path, cache-busting via query param.
 * @param filePath Path to module file.
 * @param onReload Callback invoked with (module|null, error?).
 */
export async function reloadModule<T = any>(
  filePath: string,
  onReload: (mod: T | null, error?: Error) => void = () => {}
): Promise<T | null> {
  const fileUrl = pathToFileURL(filePath).href;
  try {
    const mod = (await import(`${fileUrl}?update=${Date.now()}`)) as T;
    activeModules.set(filePath, mod);
    onReload(mod, undefined);
    return mod;
  } catch (error) {
    onReload(null, error as Error);
    return null;
  }
}

/**
 * Cleans up and removes a module from activeModules cache.
 */
export function handleModuleCleanup(filePath: string): void {
  const existing = activeModules.get(filePath);
  if (existing) {
    const target = existing.default || existing;
    if (typeof target.cleanupModule === "function") {
      target.cleanupModule();
    }
    activeModules.delete(filePath);
  }
}

/**
 * Detects if a given file path represents a loadable module by extension.
 */
export function isModuleFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".json"].includes(ext);
}
