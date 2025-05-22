import { pathToFileURL } from "url";
import path from "path";
import { createRequire } from "module";

const requireFunc = createRequire(import.meta.url);

export const activeModules: Map<string, any> = new Map();

/**
 * Reloads a module at given path.
 * @param filePath Path to module file.
 * @param onReload Callback invoked with (module|null, error?).
 * @returns The loaded module or null if an error occurred.
 */
export async function reloadModule<T = any>(
  filePath: string,
  onReload: (mod: T | null, filePath: string, error?: Error) => void = () => {}
): Promise<T | null> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const ext = path.extname(absolutePath).toLowerCase();

  try {
    let mod: any;

    if (ext === ".json") {
      const resolved = requireFunc.resolve(absolutePath);
      delete requireFunc.cache?.[resolved];
      mod = requireFunc(absolutePath);
    } else {
      const fileUrl = pathToFileURL(absolutePath).href;
      const imported = await import(`${fileUrl}?update=${Date.now()}`);
      mod = imported.default ?? imported;
    }

    activeModules.set(absolutePath, mod);
    onReload(mod as T, filePath, undefined);
    return mod as T;
  } catch (err) {
    onReload(null, filePath, err as Error);
    return null;
  }
}

/**
 * Cleans up and removes a module from activeModules cache.
 * If the module exports a cleanupModule function, it will be invoked.
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
  return [".js", ".mjs", ".cjs", ".json"].includes(ext);
}
