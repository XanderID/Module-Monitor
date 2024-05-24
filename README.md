<br />
<div align="center">
  <a href="https://github.com/XanderID/Module-Monitor">

  <h3 align="center">Module-Monitor</h3>

  <p align="center">
    Modul-Monitor facilitates automatic reloading of modules in Node.js applications, ensuring real-time updates during development.
    <br />
    <br />
    <a href="https://github.com/XanderID/Module-Monitor/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/XanderID/Module-Monitor/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#callback-events">Callback Events</a></li>
      </ul>
    </li>
    <li><a href="#warning">Warning</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

Modul-Monitor is a lightweight utility for Node.js applications that enables automatic reloading of modules when they are modified. It provides a seamless development experience by monitoring specified directories for file changes and refreshing the modules accordingly, ensuring that the latest code changes are always reflected during development.

## Getting Started

First of all you have to Include this Module into your Project, here's how to Include Module-Monitor.

With CommonJS:

```js
const { WatchFile, WatchFolder } = require("module-monitor");
```

With ES6:

```js
import { WatchFile, WatchFolder } from "module-monitor";
```

Then you can use it as an example below:

```js
// Check that config.js has been changed or not using WatchFile
let config = new WatchFile("./config.js");

// Then you can also use the Callback Event as an example:
config.setOnReload((module, err) => {
  if (err) {
    console.error("Failed to reload:", err);
  } else {
    let getConfig = module.getConfig();
    console.log(`Module Reloaded: ${getConfig}`);
  }
});

// Monitor Folder using WatchFolder if there is Module Addition or Module Deletion
let commands = {}; // A new module will be in this collection
let commandsWatch = new WatchFolder("./commands", commands);

// then you can use the Callback Event
commandsWatch.setOnAdd((filePath) => {
  console.log(`New Module in: ${filePath}`);
});
```

## Callback Events

In Module-Monitor there are a total of 4 Callback Events but 1 specifically for WatchFolder only.

and these are the Callback Events available on the Module-Monitor:

### Reload Module Event

This event works if you want to check if the Module that was changed or added was successfully loaded or not.

```js
watcher.setOnReload((module, err) => {
  // module: is the Module that was just loaded and Imported
  // err: Err only exists when the Module cannot be loaded
});
```

### Module Change Event

This event works when there is a change in the Module being monitored.

```js
watcher.setOnChange((filePath) => {
  // filePath: the location of the changed file in the Module
});
```

### Deleted Module Event

this event works only when the Module is deleted

```js
watcher.setOnDelete((filePath) => {
  // filePath: the location of the deleted file in the Module
});
```

### Add Module Event

This event only works when a new Module is added and only works on `WatchFolder`.

```js
watcher.setOnAdd((filePath) => {
  // filePath: the location of the new file in the Module
});
```

## Warning

if you use setInterval or whatever on the Module you want to monitor, please use `cleanupModule`.

Usage Example:

```js
// This is on the module that you want to Handle if there is a task or whatever it is, for example in message.js

let messages = [];
let counter = 1;
let interval = setInterval(function () {
  messages.push(`This is the message of ${counter}`);
  counter++;
}, 1000);

export async function cleanupModule() {
  clearInterval(interval);
}
```

So there will be no double intervals or spam.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag _enhancement_.
Don't forget to give the project a star! Thanks again!

## License

Distributed under the MIT. See `LICENSE` for more information.
