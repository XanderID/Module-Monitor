import chokidar, { FSWatcher } from "chokidar";
import { reloadModule, handleModuleCleanup } from "../utils/module";
import path from "path";

/**
 * Callback invoked when a module is reloaded.
 * @param module The new module instance or null if error occurred.
 * @param filePath The path of File Module
 * @param error Optional error thrown during reload.
 */
export type ReloadCallback<T = any> = (module: T | null, filePath: string, error?: Error) => void;

/**
 * Callback invoked on file change (before reload).
 * @param path The file path that changed.
 */
export type ChangeCallback = (path: string) => void;

/**
 * Callback invoked on file deletion.
 * @param path The file path that was deleted.
 */
export type DeleteCallback = (path: string) => void;

/**
 * WatchFile monitors a single file for changes,
 * reloads the module, and invokes callbacks on events.
 */
export class WatchFile<T = any> {
  private absPath: string;
  private watcher: FSWatcher;
  private onReloadCb: ReloadCallback<T> = () => {};
  private onChangeCb: ChangeCallback = () => {};
  private onDeleteCb: DeleteCallback = () => {};

  /**
   * Initialize watcher on the given file path.
   * @param filePath Path to file to watch.
   */
  constructor(filePath: string) {
    const entry = process.argv[1] || process.cwd();
    const baseDir = path.dirname(entry);
    this.absPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(baseDir, filePath);

    this.watcher = chokidar.watch(this.absPath, { ignoreInitial: true });
    this.watcher.on("change", (path) => {
      this.cleanup();
      this.onChangeCb(path);
      this.handleReload();
    });
    this.watcher.on("unlink", async (path) => {
      this.cleanup();
      this.onDeleteCb(path);
      await this.watcher.close();
    });
  }

  /**
   * Set callback to invoke when file reloads successfully or on error.
   */
  public setOnReload(cb: ReloadCallback<T>): void {
    this.onReloadCb = cb;
  }

  /**
   * Set callback to invoke when file is changed (before reload).
   */
  public setOnChange(cb: ChangeCallback): void {
    this.onChangeCb = cb;
  }

  /**
   * Set callback to invoke when file is deleted.
   */
  public setOnDelete(cb: DeleteCallback): void {
    this.onDeleteCb = cb;
  }

  private async cleanup(): Promise<void> {
    handleModuleCleanup(this.absPath);
  }

  private async handleReload(): Promise<T | null> {
    return reloadModule<T>(this.absPath, this.onReloadCb);
  }
}
