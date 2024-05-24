import fs from "fs";
import {
  reloadModule,
  handleModuleCleanup,
  activeModules,
  isModuleFile,
} from "../utils/module.js";

class WatchFile {
  constructor(filePath) {
    this.filePath = filePath;
    this.onReload = null;
    this.onChange = null;
    this.onDelete = null;

    if (!isModuleFile(filePath)) {
      const error = new TypeError(`Cannot watch non-module file: ${filePath}`);
      Error.captureStackTrace(error, this.constructor);
      throw error;
    }

    this.init();
  }

  async init() {
    fs.watchFile(this.filePath, this.handleChange.bind(this));
    const module = await reloadModule(this.filePath, this.onReload);
    if (module) {
      activeModules.set(this.filePath, module);
      if (this.onReload) this.onReload(module, null);
    }
  }

  async handleChange(curr, prev) {
    if (curr.mtime !== prev.mtime) {
      const module = await reloadModule(this.filePath, this.onReload);
      if (this.onChange) this.onChange(this.filePath);
      if (module) {
        handleModuleCleanup(this.filePath);
        activeModules.set(this.filePath, module);
      }
    } else if (curr.nlink === 0) {
      handleModuleCleanup(this.filePath);
      if (this.onDelete) this.onDelete(this.filePath);
      fs.unwatchFile(this.filePath);
    }
  }

  setOnReload(callback) {
    this.onReload = callback;
  }

  setOnChange(callback) {
    this.onChange = callback;
  }

  setOnDelete(callback) {
    this.onDelete = callback;
  }
}

export default WatchFile;
