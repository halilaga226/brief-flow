const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("atliApp", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (cfg) => ipcRenderer.invoke("save-config", cfg),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  runBackup: () => ipcRenderer.invoke("run-backup"),
  listLocals: () => ipcRenderer.invoke("list-locals"),
  openFolder: () => ipcRenderer.invoke("open-folder"),
  restoreLocal: (filePath) => ipcRenderer.invoke("restore-local", filePath),
  reloadPortal: () => ipcRenderer.invoke("reload-portal"),
  setSettingsOpen: (open) => ipcRenderer.invoke("set-settings-open", open),
  onStatus: (cb) => {
    const handler = (_event, text) => cb(text)
    ipcRenderer.on("status", handler)
    return () => ipcRenderer.removeListener("status", handler)
  },
  onLocals: (cb) => {
    const handler = (_event, rows) => cb(rows)
    ipcRenderer.on("locals", handler)
    return () => ipcRenderer.removeListener("locals", handler)
  },
  onSettingsOpen: (cb) => {
    const handler = (_event, open) => cb(open)
    ipcRenderer.on("settings-open", handler)
    return () => ipcRenderer.removeListener("settings-open", handler)
  },
})
