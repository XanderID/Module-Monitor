# Module-Monitor

Module-Monitor facilitates automatic reloading of modules in Node.js applications, ensuring real-time updates during development.

## About The Project

Modul-Monitor is a lightweight utility for Node.js applications that enables automatic reloading of modules when they are modified. It provides a seamless development experience by monitoring specified directories for file changes and refreshing the modules accordingly, ensuring that the latest code changes are always reflected during development.

## Features

- **WatchFile**: Monitor a single module file for changes, reload dynamically, and handle cleanup.
- **WatchFolder**: Monitor an entire directory for module additions, changes, and deletions.
- **Cache Management**: Automatic cache-busting and cleanup via query parameters and cleanupModule support.
- **TypeScript Support**: Written entirely in TypeScript with typings included.

## Installation

```bash
npm install module-monitor
```

## Usage

### CommonJS

```js
const { WatchFile, WatchFolder } = require("module-monitor");
```

### ES6

```ts
import { WatchFile, WatchFolder } from "module-monitor";
```

### WatchFile Example

`config.js`

```js
function getConfig(){
    return { name: 'XanderID' };
}

export default { getConfig }
```

`index.js`

```ts
import { WatchFile } from "module-monitor";

const watcher = new WatchFile("./config.js");

watcher.setOnChange(path => {
  console.log(`File changed: ${path}`);
});

watcher.setOnReload((mod, file, err) => {
  if (err) console.error("Reload failed:", err);
  else console.log("Config reloaded:", mod.default.getConfig());
});

watcher.setOnDelete(path => {
  console.log(`File deleted: ${path}`);
});
```

### WatchFolder Example

```ts
import { WatchFolder } from "module-monitor";

const commands = new WatchFolder("./commands");

commands.setOnAdd(path => console.log(`Module added: ${path}`));
commands.setOnChange(path => console.log(`Module updated: ${path}`));
commands.setOnDelete(path => console.log(`Module removed: ${path}`));
commands.setOnReload((mod, file, err) => {
  if (err) console.error("Reload error:", err);
  else console.log(`Module loaded:`, mod);
});
```

## Warning

If your modules perform ongoing tasks (e.g., `setInterval`), implement and export a `cleanupModule` function to prevent duplicate operations on reload.

**Usage Example** (e.g., `message.js`):

```js
let messages = [];
let counter = 1;
const interval = setInterval(() => {
  messages.push(`This is message #${counter}`);
  counter++;
}, 1000);

export async function cleanupModule() {
  clearInterval(interval);
}
```

This ensures old intervals are cleared before reloading, avoiding duplicate timers or resource leaks.

## API

- `WatchFile<T>`
  - `constructor(filePath: string)`
  - `setOnChange(cb: (path: string) => void)`
  - `setOnReload(cb: (mod: T | null, filePath: string, err?: Error) => void)`
  - `setOnDelete(cb: (path: string) => void)`
  - `cleanup(): Promise<void>`

- `WatchFolder<T>`
  - `constructor(folderPath: string)`
  - `setOnAdd(cb: (path: string) => void)`
  - `setOnChange(cb: (path: string) => void)`
  - `setOnDelete(cb: (path: string) => void)`
  - `setOnReload(cb: (mod: T | null, filePath: string, err?: Error) => void)`
  - `cleanup(): Promise<void>`

## Contributing

Contributions are welcome! Please open issues and pull requests on GitHub.

## License

Distributed under the MIT License.
