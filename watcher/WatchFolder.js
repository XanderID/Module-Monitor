import fs from "fs";
import path from "path";
import {
  reloadModule,
  handleModuleCleanup,
  activeModules,
  isModuleFile,
} from "../utils/module.js";

class WatchFolder {
  constructor(folderPath, collection) {
    this.folderPath = folderPath;
    this.collection = collection;
    this.onAdd = null;
    this.onReload = null;
    this.onChange = null;
    this.onDelete = null;
    this.existingFiles = new Set();
    this.init();
  }

  async init() {
    fs.readdir(this.folderPath, (err, files) => {
      if (err) {
        const error = new Error(
          `Failed to list contents of directory: ${folderPath}`,
        );
        Error.captureStackTrace(error, this.constructor);
        throw error;
      }

      files.forEach((file) => {
        const filePath = path.join(this.folderPath, file);
        if (isModuleFile(filePath)) {
          this.existingFiles.add(filePath);
          this.watchFileInFolder(filePath);
        }
      });
    });

    fs.watch(this.folderPath, this.handleFolderChange.bind(this));
  }

  async watchFileInFolder(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    fs.watchFile(filePath, async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        const module = await reloadModule(filePath, this.onReload);
        if (this.onChange) this.onChange(filePath);
        if (module) {
          handleModuleCleanup(filePath);
          activeModules.set(filePath, module);
          this.collection[fileName] = module;
        }
      } else if (curr.nlink === 0) {
        handleModuleCleanup(filePath);
        delete this.collection[fileName];
        if (this.onDelete) this.onDelete(filePath);
        fs.unwatchFile(filePath);
      }
    });

    const module = await reloadModule(filePath, this.onReload);
    if (module) {
      activeModules.set(filePath, module);
      this.collection[fileName] = module;
    }
  }

  async handleFolderChange(eventType, filename) {
    if (filename) {
      const filePath = path.join(this.folderPath, filename);
      if (eventType === "rename") {
        if (!isModuleFile(filePath)) return false;

        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (err) {
            this.existingFiles.delete(filePath);
            const fileName = path.basename(filePath, path.extname(filePath));
            handleModuleCleanup(filePath);
            delete this.collection[fileName];
            if (this.onDelete) this.onDelete(filePath);
            fs.unwatchFile(filePath);
          } else {
            this.existingFiles.add(filePath);
            this.watchFileInFolder(filePath);
            if (this.onAdd) this.onAdd(filePath);
          }
        });
      }
    }
  }

  setOnAdd(callback) {
    this.onAdd = callback;
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

export default WatchFolder;
