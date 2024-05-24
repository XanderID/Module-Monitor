import { pathToFileURL } from "url";
import path from "path";

export const activeModules = new Map();

export async function reloadModule(filePath, onReload = null) {
  const fileUrl = pathToFileURL(filePath).href;
  try {
    const module = await import(`${fileUrl}?update=${Date.now()}`);
    if (onReload) {
      onReload(module, null);
    }

    return module;
  } catch (error) {
    if (onReload) {
      onReload(null, error);
    }

    return null;
  }
}

export function handleModuleCleanup(filePath) {
  const existingModule = activeModules.get(filePath);
  if (existingModule) {
    const moduleToCleanup = existingModule.default || existingModule;

    if (typeof moduleToCleanup.cleanupModule === "function") {
      moduleToCleanup.cleanupModule();
    }

    activeModules.delete(filePath);
  }
}

export function isModuleFile(filePath) {
  const ext = path.extname(filePath);
  return ext === ".js" || ext === ".mjs";
}
