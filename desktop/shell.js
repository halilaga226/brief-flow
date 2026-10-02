const $ = (id) => document.getElementById(id)

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function setStatus(text) {
  const el = $("status")
  el.textContent = text
  el.classList.toggle("error", /^Hata/i.test(text))
}

async function setSettingsOpen(open) {
  $("settings").hidden = !open
  await window.atliApp.setSettingsOpen(open)
}

function renderLocals(rows) {
  const ul = $("locals")
  ul.innerHTML = ""
  if (!rows || !rows.length) {
    const empty = document.createElement("li")
    empty.className = "empty"
    empty.textContent = "Henüz yerel yedek yok."
    ul.appendChild(empty)
    return
  }
  for (const row of rows) {
    const li = document.createElement("li")
    const meta = document.createElement("div")
    const name = document.createElement("div")
    name.className = "name"
    name.textContent = row.name
    const sub = document.createElement("div")
    sub.className = "sub"
    sub.textContent = `${new Date(row.mtime).toLocaleString("tr-TR")} · ${formatBytes(row.size)}`
    meta.append(name, sub)

    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "danger"
    btn.textContent = "Siteye yükle"
    btn.addEventListener("click", async () => {
      if (!window.confirm("Bu yedek portal verisinin üzerine yazılabilir. Devam?")) return
      btn.disabled = true
      const result = await window.atliApp.restoreLocal(row.path)
      btn.disabled = false
      if (!result.ok) setStatus(`Hata: ${result.error}`)
      else {
        const r = result.result || {}
        setStatus(`Yüklendi: ${r.clients ?? "?"} müvekkil, ${r.tasks ?? "?"} iş`)
      }
    })

    li.append(meta, btn)
    ul.appendChild(li)
  }
}

function readForm() {
  return {
    portalUrl: $("portalUrl").value.trim(),
    agentToken: $("agentToken").value.trim(),
    backupDir: $("backupDir").value.trim(),
    intervalHours: Number($("intervalHours").value) || 6,
    keepLocal: Number($("keepLocal").value) || 30,
    autoBackup: $("autoBackup").checked,
  }
}

function fillForm(cfg) {
  $("portalUrl").value = cfg.portalUrl || ""
  $("agentToken").value = cfg.agentToken || ""
  $("backupDir").value = cfg.backupDir || ""
  $("intervalHours").value = String(cfg.intervalHours ?? 6)
  $("keepLocal").value = String(cfg.keepLocal ?? 30)
  $("autoBackup").checked = Boolean(cfg.autoBackup)
  setStatus(cfg.status || "Hazır")
  renderLocals(cfg.locals || [])
}

async function boot() {
  const cfg = await window.atliApp.getConfig()
  fillForm(cfg)
  if (cfg.needsSetup) await setSettingsOpen(true)

  window.atliApp.onStatus(setStatus)
  window.atliApp.onLocals(renderLocals)
  window.atliApp.onSettingsOpen((open) => {
    $("settings").hidden = !open
  })

  $("toggleSettings").addEventListener("click", async () => {
    const next = $("settings").hidden
    await setSettingsOpen(next)
  })
  $("closeSettings").addEventListener("click", async () => {
    await setSettingsOpen(false)
  })

  $("save").addEventListener("click", async () => {
    $("save").disabled = true
    try {
      await window.atliApp.saveConfig(readForm())
      setStatus("Ayarlar kaydedildi — portal açılıyor")
    } finally {
      $("save").disabled = false
    }
  })

  $("pickFolder").addEventListener("click", async () => {
    const dir = await window.atliApp.pickFolder()
    if (dir) $("backupDir").value = dir
  })

  $("openFolder").addEventListener("click", () => window.atliApp.openFolder())
  $("reload").addEventListener("click", () => window.atliApp.reloadPortal())

  $("backupNow").addEventListener("click", async () => {
    await window.atliApp.saveConfig(readForm())
    $("backupNow").disabled = true
    const result = await window.atliApp.runBackup()
    $("backupNow").disabled = false
    if (result.ok) {
      setStatus(`Yedek kaydedildi: ${result.filename}`)
      renderLocals(await window.atliApp.listLocals())
    } else if (result.error !== "busy") {
      setStatus(`Hata: ${result.error}`)
      await setSettingsOpen(true)
    }
  })
}

boot()
