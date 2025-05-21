import chokidar, { FSWatcher } from "chokidar";
import {
  reloadModule,
  handleModuleCleanup,
  isModuleFile,
} from "../utils/module";

export type ChangeCallback = (path: string) => void;

export type FolderCallbacks<T> = {
  onAdd?: ChangeCallback;
  onChange?: ChangeCallback;
  onDelete?: ChangeCallback;
  onReload?: (mod: T | null, err?: Error) => void;
};

/**
 * WatchFolder monitors a directory for module file changes,
 * automatically reloads modules on add/change, and invokes callbacks.
 */
export class WatchFolder<T = any> {
  private watcher: FSWatcher;
  private onAddCb: ChangeCallback = () => {};
  private onChangeCb: ChangeCallback = () => {};
  private onDeleteCb: ChangeCallback = () => {};
  private onReloadCb: (mod: T | null, err?: Error) => void = () => {};
  public modules: Map<string, T> = new Map();

  /**
   * Initialize watcher on the given folder path.
   * @param folderPath Path to directory to watch.
   */
  constructor(private readonly folderPath: string) {
    this.watcher = chokidar.watch(this.folderPath, { ignoreInitial: false });
    this.setupEvents();
  }

  /**
   * Set callback for file add events.
   * @param callback Function called with file path when a new module is added.
   */
  public setOnAdd(callback: ChangeCallback): void {
    this.onAddCb = callback;
  }

  /**
   * Set callback for file change events.
   * @param callback Function called with file path before reloading the module.
   */
  public setOnChange(callback: ChangeCallback): void {
    this.onChangeCb = callback;
  }

  /**
   * Set callback for file delete events.
   * @param callback Function called with file path when a module file is deleted.
   */
  public setOnDelete(callback: ChangeCallback): void {
    this.onDeleteCb = callback;
  }

  /**
   * Set callback for module reload events.
   * @param callback Function called with new module or null on error, and optional error.
   */
  public setOnReload(callback: (mod: T | null, err?: Error) => void): void {
    this.onReloadCb = callback;
  }

  /**
   * Bulk set callbacks via an object.
   * @param cbs FolderCallbacks object containing optional callbacks.
   */
  public setCallbacks(cbs: FolderCallbacks<T>): void {
    if (cbs.onAdd) this.onAddCb = cbs.onAdd;
    if (cbs.onChange) this.onChangeCb = cbs.onChange;
    if (cbs.onDelete) this.onDeleteCb = cbs.onDelete;
    if (cbs.onReload) this.onReloadCb = cbs.onReload;
  }

  /**
   * Stop watching the folder and cleanup all loaded modules.
   */
  public async cleanup(): Promise<void> {
    await this.watcher.close();
    for (const filePath of this.modules.keys()) {
      handleModuleCleanup(filePath);
    }
    this.modules.clear();
  }

  private setupEvents(): void {
    this.watcher.on("add", path => this.handleAdd(path));
    this.watcher.on("change", path => this.handleChange(path));
    this.watcher.on("unlink", path => this.handleDelete(path));
  }

  private async handleAdd(path: string): Promise<void> {
    if (!isModuleFile(path)) return;
    this.onAddCb(path);
    await this.reloadAndStore(path);
  }

  private async handleChange(path: string): Promise<void> {
    if (!isModuleFile(path)) return;
    this.onChangeCb(path);
    await this.reloadAndStore(path);
  }

  private handleDelete(path: string): void {
    if (!isModuleFile(path)) return;
    this.onDeleteCb(path);
    handleModuleCleanup(path);
    this.modules.delete(path);
  }

  private async reloadAndStore(path: string): Promise<void> {
    const mod = await reloadModule<T>(path, this.onReloadCb);
    if (mod !== null) {
      this.modules.set(path, mod);
    }
  }
}
