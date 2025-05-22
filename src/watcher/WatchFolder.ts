import chokidar, { FSWatcher } from "chokidar";
import path from "path";
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
  private readonly folderPath: string;

  /**
   * Initialize watcher on the given folder path.
   * @param folderPath Path to directory to watch.
   */
  constructor(folderPath: string) {
    const entryScript = process.argv[1] || process.cwd();
    const baseDir = path.dirname(entryScript);
    this.folderPath = path.isAbsolute(folderPath)
      ? folderPath
      : path.resolve(baseDir, folderPath);
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

  public async cleanup(): Promise<void> {
    await this.watcher.close();
    for (const filePath of this.modules.keys()) {
      handleModuleCleanup(filePath);
    }
    this.modules.clear();
  }

  private setupEvents(): void {
    this.watcher.on("add", (path) => this.handleAdd(path));
    this.watcher.on("change", (path) => this.handleChange(path));
    this.watcher.on("unlink", (path) => this.handleDelete(path));
  }

  private async handleAdd(pathStr: string): Promise<void> {
    const filePath = path.isAbsolute(pathStr)
      ? pathStr
      : path.resolve(this.folderPath, pathStr);
    if (!isModuleFile(filePath)) return;
    this.onAddCb(filePath);
    await this.reloadAndStore(filePath);
  }

  private async handleChange(pathStr: string): Promise<void> {
    const filePath = path.isAbsolute(pathStr)
      ? pathStr
      : path.resolve(this.folderPath, pathStr);
    if (!isModuleFile(filePath)) return;
    this.onChangeCb(filePath);
    await this.reloadAndStore(filePath);
  }

  private handleDelete(pathStr: string): void {
    const filePath = path.isAbsolute(pathStr)
      ? pathStr
      : path.resolve(this.folderPath, pathStr);
    if (!isModuleFile(filePath)) return;
    this.onDeleteCb(filePath);
    handleModuleCleanup(filePath);
    this.modules.delete(filePath);
  }

  private async reloadAndStore(path: string): Promise<void> {
    const mod = await reloadModule<T>(path, this.onReloadCb);
    if (mod !== null) {
      this.modules.set(path, mod);
    }
  }
}
