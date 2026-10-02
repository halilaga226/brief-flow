const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  dialog,
  shell,
} = require("electron")
const path = require("path")
const fs = require("fs")
const Store = require("electron-store")

const store = new Store({
  name: "yedek-ajani",
  defaults: {
    portalUrl: "http://127.0.0.1:4317",
    agentToken: "",
    backupDir: "",
    intervalHours: 6,
    keepLocal: 30,
    autoBackup: true,
  },
})

/** @type {BrowserWindow | null} */
let mainWindow = null
/** @type {Tray | null} */
let tray = null
/** @type {NodeJS.Timeout | null} */
let timer = null
let lastStatus = "Hazır"
let busy = false

function defaultBackupDir() {
  return path.join(app.getPath("documents"), "Atli-Karakaya-Yedekler")
}

function ensureBackupDir(dir) {
  const target = dir || defaultBackupDir()
  fs.mkdirSync(target, { recursive: true })
  if (!store.get("backupDir")) store.set("backupDir", target)
  return store.get("backupDir") || target
}

function appIcon() {
  const iconPath = path.join(__dirname, "assets", "icon.png")
  if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath)
  return undefined
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    return
  }

  mainWindow = new BrowserWindow({
    width: 720,
    height: 780,
    minWidth: 560,
    minHeight: 640,
    title: "Atlı Karakaya · Yedek Ajanı",
    backgroundColor: "#0f1419",
    icon: appIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, "index.html"))
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

function trayIcon() {
  const trayPath = path.join(__dirname, "assets", "tray.png")
  if (fs.existsSync(trayPath)) {
    return nativeImage.createFromPath(trayPath)
  }
  return appIcon() || nativeImage.createEmpty()
}

function updateTray() {
  if (!tray) return
  tray.setToolTip(`Atlı Karakaya Yedek · ${lastStatus}`)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: lastStatus, enabled: false },
      { type: "separator" },
      { label: "Pencereyi aç", click: () => createWindow() },
      {
        label: "Şimdi yedekle",
        click: () => {
          void runBackup("tray")
        },
      },
      { type: "separator" },
      {
        label: "Çıkış",
        click: () => {
          app.isQuitting = true
          app.quit()
        },
      },
    ]),
  )
}

function setStatus(text) {
  lastStatus = text
  updateTray()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status", text)
  }
}

function pruneLocal(dir, keep) {
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name.startsWith("atli-karakaya-yedek-"))
    .map((name) => {
      const full = path.join(dir, name)
      return { name, full, mtime: fs.statSync(full).mtimeMs }
    })
    .sort((a, b) => b.mtime - a.mtime)
  for (const file of files.slice(Math.max(1, keep))) {
    try {
      fs.unlinkSync(file.full)
    } catch {
      /* ignore */
    }
  }
}

function listLocalBackups() {
  const dir = ensureBackupDir(store.get("backupDir"))
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const full = path.join(dir, name)
      const st = fs.statSync(full)
      return {
        name,
        path: full,
        size: st.size,
        mtime: st.mtime.toISOString(),
      }
    })
    .sort((a, b) => (a.mtime < b.mtime ? 1 : -1))
}

async function runBackup(source = "manual") {
  if (busy) {
    setStatus("Yedek zaten sürüyor…")
    return { ok: false, error: "busy" }
  }
  busy = true
  setStatus("Siteden yedek alınıyor…")
  try {
    const portalUrl = String(store.get("portalUrl") || "").replace(/\/$/, "")
    const token = String(store.get("agentToken") || "").trim()
    if (!portalUrl || !token) {
      throw new Error("Portal adresi ve ajan anahtarı gerekli.")
    }
    const dir = ensureBackupDir(store.get("backupDir"))
    const res = await fetch(`${portalUrl}/api/agent/backup`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Sunucu ${res.status}: ${body.slice(0, 180)}`)
    }
    const text = await res.text()
    const createdAt = res.headers.get("x-backup-created-at") || new Date().toISOString()
    const stamp = createdAt.replace(/[:.]/g, "-").slice(0, 19)
    const filename = `atli-karakaya-yedek-${stamp}.json`
    const full = path.join(dir, filename)
    fs.writeFileSync(full, text, "utf8")
    pruneLocal(dir, Number(store.get("keepLocal") || 30))
    setStatus(`Son yedek: ${new Date().toLocaleString("tr-TR")} (${source})`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("locals", listLocalBackups())
    }
    return { ok: true, path: full, filename }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setStatus(`Hata: ${message}`)
    return { ok: false, error: message }
  } finally {
    busy = false
  }
}

async function restoreLocal(filePath) {
  if (busy) return { ok: false, error: "busy" }
  busy = true
  setStatus("Yedek siteye yükleniyor…")
  try {
    const portalUrl = String(store.get("portalUrl") || "").replace(/\/$/, "")
    const token = String(store.get("agentToken") || "").trim()
    if (!portalUrl || !token) throw new Error("Portal adresi ve ajan anahtarı gerekli.")
    const raw = fs.readFileSync(filePath, "utf8")
    const res = await fetch(`${portalUrl}/api/agent/backup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: raw,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Sunucu ${res.status}`)
    setStatus(`Geri yüklendi: ${new Date().toLocaleString("tr-TR")}`)
    return { ok: true, result: data.result }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setStatus(`Hata: ${message}`)
    return { ok: false, error: message }
  } finally {
    busy = false
  }
}

function schedule() {
  if (timer) clearInterval(timer)
  timer = null
  if (!store.get("autoBackup")) return
  const hours = Math.max(1, Number(store.get("intervalHours") || 6))
  timer = setInterval(
    () => {
      void runBackup("zamanlayıcı")
    },
    hours * 60 * 60 * 1000,
  )
}

function wireIpc() {
  ipcMain.handle("get-config", () => {
    ensureBackupDir(store.get("backupDir"))
    return {
      portalUrl: store.get("portalUrl"),
      agentToken: store.get("agentToken"),
      backupDir: store.get("backupDir") || defaultBackupDir(),
      intervalHours: store.get("intervalHours"),
      keepLocal: store.get("keepLocal"),
      autoBackup: store.get("autoBackup"),
      status: lastStatus,
      locals: listLocalBackups(),
    }
  })

  ipcMain.handle("save-config", (_event, next) => {
    if (typeof next.portalUrl === "string") store.set("portalUrl", next.portalUrl.trim())
    if (typeof next.agentToken === "string") store.set("agentToken", next.agentToken.trim())
    if (typeof next.backupDir === "string" && next.backupDir) {
      ensureBackupDir(next.backupDir)
      store.set("backupDir", next.backupDir)
    }
    if (next.intervalHours != null) store.set("intervalHours", Number(next.intervalHours) || 6)
    if (next.keepLocal != null) store.set("keepLocal", Number(next.keepLocal) || 30)
    if (typeof next.autoBackup === "boolean") store.set("autoBackup", next.autoBackup)
    schedule()
    setStatus("Ayarlar kaydedildi")
    return { ok: true }
  })

  ipcMain.handle("pick-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    })
    if (result.canceled || !result.filePaths[0]) return null
    const dir = result.filePaths[0]
    store.set("backupDir", dir)
    ensureBackupDir(dir)
    return dir
  })

  ipcMain.handle("run-backup", async () => runBackup("manuel"))
  ipcMain.handle("list-locals", () => listLocalBackups())
  ipcMain.handle("open-folder", () => {
    const dir = ensureBackupDir(store.get("backupDir"))
    shell.openPath(dir)
    return true
  })
  ipcMain.handle("restore-local", async (_event, filePath) => restoreLocal(filePath))
}

app.whenReady().then(() => {
  ensureBackupDir(store.get("backupDir"))
  wireIpc()
  tray = new Tray(trayIcon())
  updateTray()
  tray.on("double-click", () => createWindow())
  createWindow()
  schedule()
  setStatus("Hazır — siteyle bağlı yedek ajanı")

  // İlk açılışta otomatik açıksa bir kez dene (token varsa)
  if (store.get("autoBackup") && store.get("agentToken")) {
    setTimeout(() => {
      void runBackup("başlangıç")
    }, 4000)
  }
})

app.on("before-quit", () => {
  app.isQuitting = true
})

app.on("window-all-closed", (event) => {
  // tray'de kalsın
  event.preventDefault()
})
