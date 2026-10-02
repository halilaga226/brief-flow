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

function renderLocals(rows) {
  const ul = $("locals")
  ul.innerHTML = ""
  if (!rows || !rows.length) {
    const empty = document.createElement("li")
    empty.className = "empty"
    empty.textContent = "Henüz yerel yedek yok. «Şimdi yedekle» ile ilkini alın."
    ul.appendChild(empty)
    return
  }
  for (const row of rows) {
    const li = document.createElement("li")
    const meta = document.createElement("div")
    meta.className = "meta"
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
      if (
        !window.confirm(
          "Bu yedek portal üzerindeki mevcut verilerin üzerine yazılabilir. Devam?",
        )
      ) {
        return
      }
      btn.disabled = true
      const result = await window.yedekAjani.restoreLocal(row.path)
      btn.disabled = false
      if (!result.ok) {
        setStatus(`Hata: ${result.error}`)
        return
      }
      const r = result.result || {}
      setStatus(
        `Siteye yüklendi: ${r.clients ?? "?"} müvekkil, ${r.tasks ?? "?"} iş.`,
      )
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
  const cfg = await window.yedekAjani.getConfig()
  fillForm(cfg)

  window.yedekAjani.onStatus(setStatus)
  window.yedekAjani.onLocals(renderLocals)

  $("save").addEventListener("click", async () => {
    await window.yedekAjani.saveConfig(readForm())
    setStatus("Ayarlar kaydedildi")
  })

  $("pickFolder").addEventListener("click", async () => {
    const dir = await window.yedekAjani.pickFolder()
    if (dir) $("backupDir").value = dir
  })

  $("openFolder").addEventListener("click", () => window.yedekAjani.openFolder())

  $("refresh").addEventListener("click", async () => {
    renderLocals(await window.yedekAjani.listLocals())
  })

  $("backupNow").addEventListener("click", async () => {
    await window.yedekAjani.saveConfig(readForm())
    $("backupNow").disabled = true
    const result = await window.yedekAjani.runBackup()
    $("backupNow").disabled = false
    if (result.ok) {
      setStatus(`Kaydedildi: ${result.filename}`)
      renderLocals(await window.yedekAjani.listLocals())
    } else if (result.error !== "busy") {
      setStatus(`Hata: ${result.error}`)
    }
  })
}

boot()
