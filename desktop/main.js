const {
  app,
  BrowserWindow,
  BrowserView,
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
  name: "atli-karakaya-masaustu",
  defaults: {
    portalUrl: "",
    agentToken: "",
    backupDir: "",
    intervalHours: 6,
    keepLocal: 30,
    autoBackup: true,
  },
})

/** @type {BrowserWindow | null} */
let mainWindow = null
/** @type {BrowserView | null} */
let portalView = null
/** @type {Tray | null} */
let tray = null
/** @type {NodeJS.Timeout | null} */
let timer = null
let lastStatus = "Hazır"
let busy = false
let settingsOpen = false
const TOOLBAR_H = 56

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

function trayIcon() {
  const trayPath = path.join(__dirname, "assets", "tray.png")
  if (fs.existsSync(trayPath)) return nativeImage.createFromPath(trayPath)
  return appIcon() || nativeImage.createEmpty()
}

function normalizePortalUrl(raw) {
  const value = String(raw || "").trim().replace(/\/$/, "")
  if (!value) return ""
  if (!/^https?:\/\//i.test(value)) return `https://${value}`
  return value
}

function layoutPortalView() {
  if (!mainWindow || !portalView) return
  const [width, height] = mainWindow.getContentSize()

  // Ayarlar açıkken BrowserView siteyi örter — kaldır ki panel görünsün
  if (settingsOpen) {
    if (mainWindow.getBrowserView()) {
      mainWindow.removeBrowserView(portalView)
    }
    return
  }

  if (!mainWindow.getBrowserView()) {
    mainWindow.setBrowserView(portalView)
  }
  portalView.setBounds({
    x: 0,
    y: TOOLBAR_H,
    width,
    height: Math.max(0, height - TOOLBAR_H),
  })
  portalView.setAutoResize({ width: true, height: true })
}

function setSettingsOpen(open) {
  settingsOpen = Boolean(open)
  layoutPortalView()
  sendShell("settings-open", settingsOpen)
}

function sendShell(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function setStatus(text) {
  lastStatus = text
  updateTray()
  sendShell("status", text)
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

function pruneLocal(dir, keep) {
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name.startsWith("atli-karakaya-yedek-"))
    .map((name) => {
      const full = path.join(dir, name)
      return { full, mtime: fs.statSync(full).mtimeMs }
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

async function runBackup(source = "manual") {
  if (busy) {
    setStatus("Yedek zaten sürüyor…")
    return { ok: false, error: "busy" }
  }
  busy = true
  setStatus("Siteden yedek alınıyor…")
  try {
    const portalUrl = normalizePortalUrl(store.get("portalUrl"))
    const token = String(store.get("agentToken") || "").trim()
    if (!portalUrl || !token) {
      throw new Error("Önce Ayarlar’dan portal adresi ve ajan anahtarını kaydedin.")
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
    sendShell("locals", listLocalBackups())
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
    const portalUrl = normalizePortalUrl(store.get("portalUrl"))
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
    reloadPortal()
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
  timer = setInterval(() => {
    void runBackup("zamanlayıcı")
  }, hours * 60 * 60 * 1000)
}

function reloadPortal() {
  const url = normalizePortalUrl(store.get("portalUrl"))
  if (!portalView) return
  if (!url) {
    portalView.webContents.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        `<!doctype html><html><body style="font-family:system-ui;background:#0c1218;color:#e8eef4;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center;max-width:420px;padding:24px"><h1 style="color:#c9a227;font-weight:600">Atlı Karakaya</h1><p>Ayarlar’dan portal adresinizi girin; site bu pencerede açılacak.</p></div></body></html>`,
      )}`,
    )
    return
  }
  portalView.webContents.loadURL(url)
}

function createPortalView() {
  if (!mainWindow || portalView) return
  portalView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.setBrowserView(portalView)
  layoutPortalView()
  portalView.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
  reloadPortal()
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    return
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: "Atlı Karakaya",
    backgroundColor: "#e8ebf2",
    icon: appIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.setMaxListeners(20)

  mainWindow.loadFile(path.join(__dirname, "shell.html"))
  mainWindow.once("ready-to-show", () => {
    createPortalView()
    mainWindow.show()
  })
  mainWindow.webContents.on("did-finish-load", () => {
    if (!portalView) createPortalView()
    else layoutPortalView()
  })
  mainWindow.on("resize", () => layoutPortalView())
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on("closed", () => {
    portalView = null
    mainWindow = null
  })
}

function updateTray() {
  if (!tray) return
  tray.setToolTip(`Atlı Karakaya · ${lastStatus}`)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: lastStatus, enabled: false },
      { type: "separator" },
      { label: "Uygulamayı aç", click: () => createWindow() },
      {
        label: "Şimdi yedekle",
        click: () => {
          void runBackup("tray")
        },
      },
      {
        label: "Siteyi yenile",
        click: () => reloadPortal(),
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

function buildAppMenu() {
  const template = [
    {
      label: "Atlı Karakaya",
      submenu: [
        { label: "Siteyi yenile", accelerator: "CmdOrCtrl+R", click: () => reloadPortal() },
        {
          label: "Şimdi yedekle",
          accelerator: "CmdOrCtrl+B",
          click: () => {
            void runBackup("menu")
          },
        },
        { type: "separator" },
        {
          label: "Çıkış",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.isQuitting = true
            app.quit()
          },
        },
      ],
    },
    {
      label: "Görünüm",
      submenu: [
        { role: "togglefullscreen" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function wireIpc() {
  ipcMain.handle("get-config", () => {
    ensureBackupDir(store.get("backupDir"))
    return {
      portalUrl: store.get("portalUrl") || "",
      agentToken: store.get("agentToken") || "",
      backupDir: store.get("backupDir") || defaultBackupDir(),
      intervalHours: store.get("intervalHours"),
      keepLocal: store.get("keepLocal"),
      autoBackup: store.get("autoBackup"),
      status: lastStatus,
      locals: listLocalBackups(),
      needsSetup: !normalizePortalUrl(store.get("portalUrl")),
    }
  })

  ipcMain.handle("save-config", (_event, next) => {
    if (typeof next.portalUrl === "string") {
      store.set("portalUrl", normalizePortalUrl(next.portalUrl))
    }
    if (typeof next.agentToken === "string") store.set("agentToken", next.agentToken.trim())
    if (typeof next.backupDir === "string" && next.backupDir) {
      ensureBackupDir(next.backupDir)
      store.set("backupDir", next.backupDir)
    }
    if (next.intervalHours != null) store.set("intervalHours", Number(next.intervalHours) || 6)
    if (next.keepLocal != null) store.set("keepLocal", Number(next.keepLocal) || 30)
    if (typeof next.autoBackup === "boolean") store.set("autoBackup", next.autoBackup)
    schedule()
    reloadPortal()
    setSettingsOpen(false)
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
    shell.openPath(ensureBackupDir(store.get("backupDir")))
    return true
  })
  ipcMain.handle("restore-local", async (_event, filePath) => restoreLocal(filePath))
  ipcMain.handle("reload-portal", () => {
    reloadPortal()
    return true
  })
  ipcMain.handle("set-settings-open", (_event, open) => {
    setSettingsOpen(open)
    return { ok: true, open: settingsOpen }
  })
}

app.whenReady().then(() => {
  ensureBackupDir(store.get("backupDir"))
  wireIpc()
  buildAppMenu()
  tray = new Tray(trayIcon())
  updateTray()
  tray.on("double-click", () => createWindow())
  createWindow()
  schedule()
  setStatus(
    normalizePortalUrl(store.get("portalUrl"))
      ? "Hazır — portal masaüstünde"
      : "Ayarlar’dan portal adresini girin",
  )

  if (!normalizePortalUrl(store.get("portalUrl"))) {
    setSettingsOpen(true)
  }

  if (store.get("autoBackup") && store.get("agentToken") && normalizePortalUrl(store.get("portalUrl"))) {
    setTimeout(() => {
      void runBackup("başlangıç")
    }, 8000)
  }
})

app.on("before-quit", () => {
  app.isQuitting = true
})

app.on("window-all-closed", (event) => {
  event.preventDefault()
})
