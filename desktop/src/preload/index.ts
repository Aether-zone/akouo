import { contextBridge } from "electron";

// Placeholder bridge — proves the preload wiring. Real IPC lands here later.
contextBridge.exposeInMainWorld("akouo", {
  name: "@akouo/desktop",
});
