const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("yedekAjani", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (cfg) => ipcRenderer.invoke("save-config", cfg),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  runBackup: () => ipcRenderer.invoke("run-backup"),
  listLocals: () => ipcRenderer.invoke("list-locals"),
  openFolder: () => ipcRenderer.invoke("open-folder"),
  restoreLocal: (filePath) => ipcRenderer.invoke("restore-local", filePath),
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
})
