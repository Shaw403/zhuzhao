var S = Object.defineProperty;
var T = (u, i, e) =>
  i in u
    ? S(u, i, { enumerable: !0, configurable: !0, writable: !0, value: e })
    : (u[i] = e);
var l = (u, i, e) => T(u, typeof i != "symbol" ? i + "" : i, e);
class b {
  constructor(i) {
    l(this, "isInitialized", !1);
    this.containerSelector = i;
  }
  onShow() {
    this.isInitialized || (this.init(), (this.isInitialized = !0));
  }
  onHide() {}
  get container() {
    return document.querySelector(this.containerSelector);
  }
}
class C extends b {
  constructor() {
    super(".scanner-page");
    l(this, "lastRenderTime", 0);
    l(this, "renderThrottleMs", 300);
    l(this, "pendingResults", null);
    l(this, "frameResults", {});
    l(this, "currentFrameId", "0");
    l(this, "tabId", null);
    l(this, "isVisible", !1);
    l(this, "renderTimeout", null);
    l(this, "sectionContainers", new Map());
    l(this, "renderedCounts", new Map());
    l(this, "renderedFrameId", null);
  }
  init() {
    (this.setupEventDelegation(), this.initTabId());
  }
  onShow() {
    ((this.isVisible = !0),
      super.onShow(),
      this.updateFrameNavigation(),
      this.pendingResults && this.render());
  }
  onHide() {
    ((this.isVisible = !1),
      super.onHide(),
      this.renderTimeout &&
        (clearTimeout(this.renderTimeout), (this.renderTimeout = null)));
    const e = document.querySelector(".frame-nav-bar");
    (e && (e.style.display = "none"),
      this.container.classList.remove("with-frame-nav"));
  }
  async initTabId() {
    const e = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    this.tabId = e[0]?.id || null;
  }
  setupEventDelegation() {
    const e = this.container.querySelector(".container");
    if (!e) return;
    (e.addEventListener("click", (s) => {
      const n = s.target,
        a = n.closest(".copy-btn");
      if (a) {
        this.handleSectionCopy(a);
        return;
      }
      const r = n.closest(".copy-url-btn");
      if (r) {
        this.handleSectionUrlCopy(r);
        return;
      }
      const o = n.closest(".item");
      if (o) {
        this.handleItemClick(o, s);
        return;
      }
    }),
      e.addEventListener("contextmenu", (s) => {
        const n = s.target.closest(".item");
        n &&
          (s.preventDefault(),
          this.copyToClipboard(n.textContent.trim(), s.clientX, s.clientY));
      }));
    const t = document.querySelector(".frame-nav-left");
    t &&
      t.addEventListener("click", (s) => {
        const n = s.target.closest(".frame-nav-tab");
        n && n.dataset.frameId && this.switchFrame(n.dataset.frameId);
      });
  }
  updateScannerResults(e) {
    ((this.frameResults[e.frameId] = {
      results: e.results,
      isInIframe: e.isInIframe,
      frameUrl: e.frameUrl || "",
    }),
      e.frameId === "0" &&
        e.results.progress &&
        e.results.progress.length > 0 &&
        this.updateProgress(e.results.progress[0][1]),
      this.frameResults["0"] &&
        (this.updateFrameNavigation(),
        e.frameId === this.currentFrameId &&
          this.updateResults(e.results, e.isInIframe)));
  }
  updateProgress(e) {
    const t = document.querySelector(".progress-tab");
    t && (t.textContent = `${e}%`);
  }
  updateFrameNavigation() {
    const e = document.querySelector(".frame-nav-bar"),
      t = document.querySelector(".frame-nav-left"),
      s = Object.keys(this.frameResults).length;
    if (!this.isVisible || s <= 1) {
      ((e.style.display = "none"),
        this.container.classList.remove("with-frame-nav"));
      return;
    }
    ((e.style.display = "flex"),
      this.container.classList.add("with-frame-nav"),
      Object.keys(this.frameResults)
        .sort((a, r) => (a === "0" ? -1 : r === "0" ? 1 : a.localeCompare(r)))
        .forEach((a, r) => {
          if (document.querySelector(`.frame-nav-tab[data-frame-id="${a}"]`))
            return;
          const o = this.frameResults[a],
            h = new URL(o.frameUrl),
            p = h.hostname + (h.port ? ":" + h.port : ""),
            c = document.createElement("button");
          ((c.className = "frame-nav-tab"),
            (c.dataset.frameId = a),
            a === "0"
              ? (c.classList.add("main_frame"), (c.textContent = p || "主页面"))
              : (c.textContent = p || `frame ${r}`),
            (c.title = c.textContent || ""),
            t.appendChild(c));
        }),
      this.updateFrameButtonStatus());
  }
  updateFrameButtonStatus() {
    document.querySelectorAll(".frame-nav-tab").forEach((e) => {
      e.classList.toggle("active", e.dataset.frameId === this.currentFrameId);
    });
  }
  switchFrame(e) {
    this.frameResults[e] &&
      ((this.currentFrameId = e),
      this.updateFrameButtonStatus(),
      this.resetIncrementalStates(),
      this.renderTimeout &&
        (clearTimeout(this.renderTimeout), (this.renderTimeout = null)),
      (this.pendingResults = {
        results: this.frameResults[e].results,
        isInIframe: this.frameResults[e].isInIframe,
      }),
      this.render(),
      (this.lastRenderTime = Date.now()));
  }
  resetIncrementalStates() {
    (this.sectionContainers.clear(),
      this.renderedCounts.clear(),
      (this.renderedFrameId = null));
    const e = this.container.querySelector(".container");
    e && (e.innerHTML = "");
  }
  updateResults(e, t) {
    if (
      ((this.pendingResults = { results: e, isInIframe: t }),
      this.renderTimeout)
    )
      return;
    const s = Date.now(),
      n = s - this.lastRenderTime;
    n > this.renderThrottleMs
      ? (this.render(), (this.lastRenderTime = s))
      : (this.renderTimeout = window.setTimeout(() => {
          (this.render(),
            (this.lastRenderTime = Date.now()),
            (this.renderTimeout = null));
        }, this.renderThrottleMs - n));
  }
  render() {
    if (!this.pendingResults) return;
    const { results: e, isInIframe: t } = this.pendingResults,
      s = this.container.querySelector(".container");
    window.__xuetongScannerResults = e;
    if (!s) return;
    this.renderedFrameId !== this.currentFrameId &&
      (this.resetIncrementalStates(),
      (this.renderedFrameId = this.currentFrameId));
    const n = [
      { id: "domain-list", data: e.domains, title: "域名" },
      { id: "route-list", data: e.routes, title: "页面路由" },
      {
        id: "absolute-api-list",
        data: e.absoluteApis,
        title: "API接口(绝对路径)",
        hasUrlCopy: !0,
      },
      {
        id: "api-list",
        data: e.apis,
        title: "API接口(相对路径)",
        hasUrlCopy: !0,
      },
      { id: "module-list", data: e.moduleFiles, title: "模块路径" },
      { id: "doc-list", data: e.docFiles, title: "文档文件" },
      { id: "credentials-list", data: e.credentials, title: "用户名密码" },
      { id: "cookie-list", data: e.cookies, title: "Cookie" },
      { id: "id-key-list", data: e.idKeys, title: "ID密钥" },
      { id: "phone-list", data: e.phones, title: "手机号码" },
      { id: "email-list", data: e.emails, title: "邮箱" },
      { id: "idcard-list", data: e.idcards, title: "身份证号" },
      { id: "ip-list", data: e.ips, title: "IP地址" },
      { id: "company-list", data: e.companies, title: "公司机构" },
      { id: "jwt-list", data: e.jwts, title: "JWT Token" },
      { id: "windows-path-list", data: e.windowsPaths, title: "Windows路径" },
      { id: "iframe-list", data: e.iframes, title: "Iframe" },
      { id: "image-list", data: e.imageFiles, title: "音频图片" },
      { id: "github-list", data: e.githubUrls, title: "GitHub链接" },
      { id: "vue-list", data: e.vueFiles, title: "Vue文件" },
      { id: "js-list", data: e.jsFiles, title: "JS文件" },
      { id: "third-party-list", data: e.thirdPartyLibs, title: "JS库" },
      { id: "url-list", data: e.urls, title: "URL" },
    ];
    let a = !1;
    if (
      (n.forEach(({ id: r, data: o, title: h, hasUrlCopy: p }) => {
        if (!o || o.length === 0) return;
        a = !0;
        let c = this.sectionContainers.get(r);
        const m = this.renderedCounts.get(r) || 0;
        if (!c) {
          const d = document.createElement("div");
          ((d.className = "section"),
            (d.dataset.sectionId = r),
            (d.innerHTML = `
          <div class="section-header">
            <div class="title-wrapper">
              <span class="title">${h}</span>
              <span class="count">(${o.length})</span>
            </div>
            <div class="button-group">
              <button class="copy-btn" title="复制全部">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                复制全部
              </button>
              ${
                p
                  ? `
                <button class="copy-url-btn" title="复制URL">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                  复制URL
                </button>
              `
                  : ""
              }
            </div>
          </div>
          <div class="section-content">
            <div class="content-wrapper ${r}"></div>
          </div>
        `));
          const v = n.findIndex((y) => y.id === r),
            f = Array.from(s.querySelectorAll(".section"));
          let g = !1;
          for (const y of f) {
            const I = y.dataset.sectionId;
            if (n.findIndex((w) => w.id === I) > v) {
              (s.insertBefore(d, y), (g = !0));
              break;
            }
          }
          (g || s.appendChild(d),
            (c = d.querySelector(".content-wrapper")),
            this.sectionContainers.set(r, c));
        }
        if (o.length > m) {
          const v = o
            .slice(m)
            .map(
              (
                g,
              ) => `<div class="item" title="来源: ${g[1]}" data-source="${g[1]}" data-type="${r}" data-isiniframe="${t ? "true" : "false"}">
            ${g[0]}
          </div>`,
            )
            .join("");
          c.insertAdjacentHTML("beforeend", v);
          const f = c.closest(".section")?.querySelector(".count");
          (f && (f.textContent = `(${o.length})`),
            this.renderedCounts.set(r, o.length));
        }
      }),
      !a && this.sectionContainers.size === 0)
    )
      s.innerHTML = '<div class="no-results">未发现敏感信息</div>';
    else {
      const r = s.querySelector(".no-results");
      r && r.remove();
    }
  }
  handleItemClick(e, t) {
    const s = e.dataset.source,
      n = e.dataset.type,
      a = e.dataset.isiniframe === "true";
    !s ||
      !this.tabId ||
      (t.ctrlKey || t.metaKey
        ? (t.preventDefault(),
          n === "route-list"
            ? a
              ? chrome.tabs.sendMessage(this.tabId, {
                  type: "UPDATE_ROUTE",
                  route: s,
                })
              : (chrome.tabs.update(this.tabId, { url: s }),
                chrome.tabs.update(this.tabId, { url: s }))
            : (chrome.tabs.create({ url: s }),
              this.showTooltip("已在新标签页打开", t.clientX, t.clientY)))
        : this.copyToClipboard(e.textContent.trim(), t.clientX, t.clientY));
  }
  async copyToClipboard(e, t, s) {
    try {
      (await navigator.clipboard.writeText(e),
        this.showTooltip("复制成功", t, s));
    } catch {
      this.showTooltip("复制失败", t, s);
    }
  }
  showTooltip(e, t, s) {
    const n = document.createElement("div");
    ((n.className = "copy-tooltip"),
      (n.textContent = e),
      (n.style.left = `${t}px`),
      (n.style.top = `${s}px`),
      document.body.appendChild(n),
      setTimeout(() => n.remove(), 1500));
  }
  handleSectionCopy(e) {
    const t = e.closest(".section"),
      n = Array.from(t.querySelectorAll(".item"))
        .map((r) => r.textContent.trim())
        .filter(Boolean).join(`
`),
      a = e.getBoundingClientRect();
    this.copyToClipboard(n, a.left, a.top);
  }
  async handleSectionUrlCopy(e) {
    const t = e.closest(".section"),
      s = Array.from(t.querySelectorAll(".item")),
      n = t.querySelector(".content-wrapper").className.split(" ")[1],
      r = (await chrome.tabs.query({ active: !0, currentWindow: !0 }))[0];
    if (!r?.url) return;
    const o = new URL(r.url).origin,
      h = new URL(r.url),
      p = s
        .map((m) => {
          const d = m.textContent.trim();
          if (n === "absolute-api-list") return o + d;
          if (n === "api-list")
            try {
              return new URL(d, h.href).href;
            } catch {
              const f = h.pathname.substring(0, h.pathname.lastIndexOf("/"));
              return o + f + "/" + d;
            }
          return d;
        })
        .filter(Boolean).join(`
`),
      c = e.getBoundingClientRect();
    this.copyToClipboard(p, c.left, c.top);
  }
}
class L extends b {
  constructor() {
    super(".config-page");
    l(this, "fingerFileHandle", null);
  }
  init() {
    (this.loadConfig(),
      this.setupEventListeners(),
      this.restoreFingerFileHandle(),
      this.syncFingerprintForm(),
      this.syncKeywordRemoveButtons(),
      this.syncProbeRemoveButtons());
  }
  loadConfig() {
    chrome.storage.local.get(
      [
        "dynamicScan",
        "deepScan",
        "customWhitelist",
        "threatbookApiKey",
        "virustotalApiKey",
        "threatIntelPlatforms",
      ],
      (i) => {
        const e = document.getElementById("dynamicScan"),
          t = document.getElementById("deepScan"),
          s = document.getElementById("whitelistInput"),
          n = document.getElementById("threatbookApiKey"),
          a = document.getElementById("virustotalApiKey"),
          r = document.getElementById("configPlatformThreatbook"),
          o = document.getElementById("configPlatformVirustotal"),
          h = Array.isArray(i.threatIntelPlatforms)
            ? i.threatIntelPlatforms
            : ["threatbook"];
        (e && (e.checked = i.dynamicScan === !0),
          t && (t.checked = i.deepScan === !0),
          s && i.customWhitelist && (s.value = i.customWhitelist.join("\n")),
          n && i.threatbookApiKey && (n.value = i.threatbookApiKey),
          a && i.virustotalApiKey && (a.value = i.virustotalApiKey),
          r && (r.checked = h.includes("threatbook")),
          o && (o.checked = h.includes("virustotal")));
      },
    );
  }
  setupEventListeners() {
    const i = document.getElementById("saveWhitelist");
    i && i.addEventListener("click", () => this.saveWhitelist());
    const e = document.getElementById("dynamicScan");
    e && e.addEventListener("change", (t) => this.handleDynamicScan(t));
    const s = document.getElementById("deepScan");
    s && s.addEventListener("change", (t) => this.handleDeepScan(t));
    const n = document.getElementById("saveThreatIntelConfig");
    n && n.addEventListener("click", () => this.saveThreatIntelConfig());
    const a = document.getElementById("chooseFingerJson");
    a && a.addEventListener("click", () => this.chooseFingerJsonFile());
    const r = document.getElementById("addFpRule");
    r && r.addEventListener("click", () => this.saveFingerprintToFile());
    const o = document.getElementById("addFpKeyword");
    o && o.addEventListener("click", () => this.addKeywordField());
    const h = document.getElementById("addFpProbe");
    h && h.addEventListener("click", () => this.addProbeField());
    const p = document.getElementById("fpMethodSelect");
    p && p.addEventListener("change", () => this.syncFingerprintForm());
    const c = document.getElementById("fpKeywordList");
    c &&
      c.addEventListener("click", (m) => {
        const d = m.target.closest(".fp-keyword-remove");
        d && this.removeKeywordField(d);
      });
    const g = document.getElementById("fpProbeList");
    g &&
      g.addEventListener("click", (m) => {
        const d = m.target.closest(".fp-probe-remove");
        d && this.removeProbeField(d);
      });
  }
  saveWhitelist() {
    const i = document.getElementById("whitelistInput");
    if (!i) return;
    const e = i.value
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t && t.length > 0);
    chrome.storage.local.set({ customWhitelist: e }, () => {
      this.showSaveTooltip("保存成功");
    });
  }
  showSaveTooltip(i) {
    const e = document.getElementById("saveWhitelist");
    if (!e) return;
    const t = e.getBoundingClientRect(),
      s = document.createElement("div");
    ((s.className = "copy-tooltip"),
      (s.textContent = i),
      (s.style.left = `${t.left + t.width / 2}px`),
      (s.style.top = `${t.top - 30}px`),
      document.body.appendChild(s),
      setTimeout(() => s.remove(), 1500));
  }
  saveThreatIntelConfig() {
    const i = document.getElementById("threatbookApiKey"),
      e = document.getElementById("threatIntelConfigStatus"),
      t = document.getElementById("virustotalApiKey"),
      s = document.getElementById("configPlatformThreatbook"),
      n = document.getElementById("configPlatformVirustotal");
    if (!i) return;
    const a = i.value.trim(),
      r = t?.value.trim() || "",
      o = [];
    (s?.checked && o.push("threatbook"),
      n?.checked && o.push("virustotal"));
    chrome.storage.local.set(
      {
        threatbookApiKey: a,
        virustotalApiKey: r,
        threatIntelPlatforms: o.length ? o : ["threatbook"],
      },
      () => {
      e &&
        ((e.textContent = "威胁情报配置已保存"),
        (e.style.color = "#2b8a3e"));
      },
    );
  }
  showFingerprintStatus(i, e = "info") {
    const t = document.getElementById("fpSaveStatus");
    t &&
      ((t.textContent = i),
      (t.style.color =
        e === "error" ? "#e03131" : e === "success" ? "#2b8a3e" : "#495057"));
  }
  updateFingerJsonPath(i, e = !1) {
    const t = document.getElementById("fingerJsonPath");
    t &&
      ((t.textContent = i || "未绑定 finger.json 文件"),
      (t.style.color = e ? "#2b8a3e" : "#495057"));
  }
  addKeywordField(i = "") {
    const e = document.getElementById("fpKeywordList");
    if (!e) return;
    const t = document.createElement("div");
    ((t.className = "fp-keyword-item"),
      (t.innerHTML = `<input type="text" class="fp-input fp-keyword-input" placeholder="${this.getKeywordPlaceholder()}" value="${i.replace(/"/g, "&quot;")}"><button type="button" class="fp-keyword-remove">-</button>`),
      e.appendChild(t),
      this.syncKeywordRemoveButtons(),
      this.syncFingerprintForm());
  }
  removeKeywordField(i) {
    const e = document.getElementById("fpKeywordList");
    if (!e) return;
    const t = e.querySelectorAll(".fp-keyword-item");
    t.length <= 1
      ? (e.querySelector(".fp-keyword-input") &&
          (e.querySelector(".fp-keyword-input").value = ""),
        this.syncKeywordRemoveButtons())
      : (i.closest(".fp-keyword-item")?.remove(),
        this.syncKeywordRemoveButtons());
  }
  syncKeywordRemoveButtons() {
    const i = Array.from(document.querySelectorAll(".fp-keyword-remove"));
    i.forEach((e) => {
      ((e.disabled = i.length === 1),
        (e.style.opacity = i.length === 1 ? ".5" : "1"),
        (e.title = i.length === 1 ? "至少保留一个输入框" : "删除"));
    });
  }
  addProbeField(i = "") {
    const e = document.getElementById("fpProbeList");
    if (!e) return;
    const t = document.createElement("div");
    ((t.className = "fp-keyword-item"),
      (t.innerHTML = `<input type="text" class="fp-input fp-probe-input" placeholder="探测路径，如：/admin/login" value="${i.replace(/"/g, "&quot;")}"><button type="button" class="fp-probe-remove">-</button>`),
      e.appendChild(t),
      this.syncProbeRemoveButtons());
  }
  removeProbeField(i) {
    const e = document.getElementById("fpProbeList");
    if (!e) return;
    const t = e.querySelectorAll(".fp-keyword-item");
    t.length <= 1
      ? (e.querySelector(".fp-probe-input") &&
          (e.querySelector(".fp-probe-input").value = ""),
        this.syncProbeRemoveButtons())
      : (i.closest(".fp-keyword-item")?.remove(),
        this.syncProbeRemoveButtons());
  }
  syncProbeRemoveButtons() {
    const i = Array.from(document.querySelectorAll(".fp-probe-remove"));
    i.forEach((e) => {
      ((e.disabled = i.length === 1),
        (e.style.opacity = i.length === 1 ? ".5" : "1"),
        (e.title = i.length === 1 ? "至少保留一个探测路径" : "删除"));
    });
  }
  getKeywordPlaceholder() {
    const i = document.getElementById("fpMethodSelect")?.value;
    return i === "faviconhash"
      ? "输入 favicon hash"
      : i === "active_keyword"
        ? "输入响应关键词"
        : "输入关键词";
  }
  syncFingerprintForm() {
    const i = document.getElementById("fpMethodSelect"),
      e = document.getElementById("fpLocationSelect"),
      t = document.getElementById("addFpKeyword"),
      s = document.getElementById("addFpProbe"),
      a = document.getElementById("fpProbeSection"),
      r = document.querySelectorAll(".fp-keyword-input");
    if (!i || !e) return;
    const o = i.value,
      h = o === "keyword",
      p = o === "active_keyword";
    ((e.disabled = !h),
      (e.value = h ? e.value || "body" : "body"),
      t && (t.textContent = o === "faviconhash" ? "添加哈希值" : "添加关键词"),
      s && (s.style.display = p ? "inline-flex" : "none"),
      a && (a.style.display = p ? "flex" : "none"),
      r.forEach((c) => {
        c.placeholder = this.getKeywordPlaceholder();
      }));
  }
  async handleDynamicScan(i) {
    const e = i.target.checked;
    chrome.storage.local.set({ dynamicScan: e });
    const t = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    t[0]?.id &&
      chrome.tabs.sendMessage(t[0].id, {
        type: "UPDATE_DYNAMIC_SCAN",
        enabled: e,
      });
  }
  async handleDeepScan(i) {
    const e = i.target.checked;
    chrome.storage.local.set({ deepScan: e });
    const t = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    t[0]?.id &&
      chrome.tabs.sendMessage(t[0].id, {
        type: "UPDATE_DEEP_SCAN",
        enabled: e,
      });
  }
  async openHandleDb() {
    return new Promise((i, e) => {
      const t = indexedDB.open("xuetong-config", 1);
      ((t.onupgradeneeded = () => {
        const s = t.result;
        s.objectStoreNames.contains("kv") || s.createObjectStore("kv");
      }),
        (t.onsuccess = () => i(t.result)),
        (t.onerror = () => e(t.error)));
    });
  }
  async saveHandleToDb(i) {
    const e = await this.openHandleDb();
    return new Promise((t, s) => {
      const a = e.transaction("kv", "readwrite");
      (a.objectStore("kv").put(i, "fingerJsonHandle"),
        (a.oncomplete = () => {
          (e.close(), t());
        }),
        (a.onerror = () => {
          (e.close(), s(a.error));
        }));
    });
  }
  async getHandleFromDb() {
    const i = await this.openHandleDb();
    return new Promise((e, t) => {
      const s = i
        .transaction("kv", "readonly")
        .objectStore("kv")
        .get("fingerJsonHandle");
      ((s.onsuccess = () => {
        (i.close(), e(s.result || null));
      }),
        (s.onerror = () => {
          (i.close(), t(s.error));
        }));
    });
  }
  async restoreFingerFileHandle() {
    try {
      const i = await this.getHandleFromDb();
      if (!i) {
        this.updateFingerJsonPath(null);
        return;
      }
      this.fingerFileHandle = i;
      const e = await i.queryPermission({ mode: "readwrite" });
      this.updateFingerJsonPath(i.name || "finger.json", e === "granted");
    } catch (i) {
      this.updateFingerJsonPath(null);
    }
  }
  async ensureWritePermission(i) {
    if (!i) return !1;
    let e = await i.queryPermission({ mode: "readwrite" });
    return e === "granted"
      ? !0
      : ((e = await i.requestPermission({ mode: "readwrite" })),
        e === "granted");
  }
  async chooseFingerJsonFile() {
    if (typeof window.showOpenFilePicker != "function") {
      this.showFingerprintStatus("当前环境不支持直接选择本地文件", "error");
      return;
    }
    try {
      const [i] = await window.showOpenFilePicker({
        multiple: !1,
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      if (!i) return;
      ((this.fingerFileHandle = i),
        await this.saveHandleToDb(i),
        this.updateFingerJsonPath(
          i.name || "finger.json",
          await this.ensureWritePermission(i),
        ),
        this.showFingerprintStatus("finger.json 已绑定", "success"));
    } catch (i) {
      i?.name !== "AbortError" &&
        this.showFingerprintStatus("选择 finger.json 失败", "error");
    }
  }
  collectFingerprintForm() {
    const i = document.getElementById("fpCmsInput")?.value.trim() || "",
      e = document.getElementById("fpMethodSelect")?.value || "keyword",
      t = document.getElementById("fpLocationSelect")?.value || "body",
      s = document.getElementById("fpTypeSelect")?.value || "其他",
      a = document.getElementById("fpImportantInput")?.checked === !0,
      r = Array.from(document.querySelectorAll(".fp-keyword-input"))
        .map((o) => o.value.trim())
        .filter(Boolean),
      n = Array.from(document.querySelectorAll(".fp-probe-input"))
        .map((o) => o.value.trim())
        .filter(Boolean);
    if (!i) throw new Error("请填写 CMS 名称");
    if (r.length === 0)
      throw new Error(
        e === "faviconhash"
          ? "请至少填写一个 favicon hash"
          : "请至少填写一个关键词",
      );
    if (e === "active_keyword" && !n.length)
      throw new Error("请至少填写一个主动探测路径");
    const o = {
        cms: i,
        method: e,
        location: e === "keyword" ? t : "body",
        keyword: r,
        isImportant: a,
        type: s,
      },
      h = (document.getElementById("fpStatusInput")?.value || "")
        .split(",")
        .map((p) => Number.parseInt(p.trim(), 10))
        .filter((p) => Number.isInteger(p));
    return (
      e === "active_keyword" && ((o.probe = n), h.length && (o.status = h)),
      o
    );
  }
  async readFingerJson(i) {
    const e = await i.getFile(),
      t = await e.text(),
      s = JSON.parse(t);
    if (!s || !Array.isArray(s.fingerprint))
      throw new Error("finger.json 格式不正确");
    return s;
  }
  async writeFingerJson(i, e) {
    const t = await i.createWritable();
    (await t.write(JSON.stringify(e, null, 2)), await t.close());
  }
  resetFingerprintForm() {
    const i = document.getElementById("fpCmsInput"),
      e = document.getElementById("fpMethodSelect"),
      t = document.getElementById("fpLocationSelect"),
      s = document.getElementById("fpTypeSelect"),
      a = document.getElementById("fpImportantInput"),
      r = document.getElementById("fpKeywordList"),
      n = document.getElementById("fpProbeList"),
      o = document.getElementById("fpStatusInput");
    (i && (i.value = ""),
      e && (e.value = "keyword"),
      t && (t.value = "body"),
      s && (s.value = "其他"),
      a && (a.checked = !1),
      o && (o.value = ""),
      r && (r.innerHTML = ""),
      n && (n.innerHTML = ""),
      this.addKeywordField(),
      this.addProbeField(),
      this.syncFingerprintForm());
  }
  async saveFingerprintToFile() {
    try {
      const i = this.collectFingerprintForm();
      let e = this.fingerFileHandle;
      if (!e) {
        (await this.chooseFingerJsonFile(), (e = this.fingerFileHandle));
      }
      if (!e) {
        this.showFingerprintStatus("请先选择 finger.json 文件", "error");
        return;
      }
      if (!(await this.ensureWritePermission(e))) {
        this.showFingerprintStatus("没有获得 finger.json 的写入权限", "error");
        return;
      }
      const t = await this.readFingerJson(e),
        s = t.fingerprint.some(
          (a) =>
            a.cms === i.cms &&
            a.method === i.method &&
            a.location === i.location &&
            JSON.stringify(a.keyword || []) === JSON.stringify(i.keyword) &&
            JSON.stringify(a.probe || []) === JSON.stringify(i.probe || []),
        );
      if (s) {
        this.showFingerprintStatus("相同规则已存在，无需重复添加", "info");
        return;
      }
      (t.fingerprint.push(i),
        await this.writeFingerJson(e, t),
        chrome.runtime.sendMessage(
          { type: "RELOAD_FINGERPRINTS", from: "popup", to: "background" },
          () => {
            chrome.runtime.lastError;
          },
        ),
        this.resetFingerprintForm(),
        this.updateFingerJsonPath(e.name || "finger.json", !0),
        this.showFingerprintStatus("指纹已写入 finger.json", "success"));
    } catch (i) {
      this.showFingerprintStatus(i?.message || "保存指纹失败", "error");
    }
  }
}
class E extends b {
  constructor() {
    super(".fingerprint-page");
  }
  init() {
    (this.fetchFingerprints(), this.setupActiveScan());
  }
  setupActiveScan() {
    const e = document.getElementById("triggerActiveScan"),
      t = document.getElementById("activeScanStatus");
    e &&
      e.addEventListener("click", async () => {
        ((e.disabled = !0),
          e.classList.add("scanning"),
          (e.textContent = "探测中..."),
          t && (t.textContent = "正在发送探测请求..."));
        const n = (
          await chrome.tabs.query({ active: !0, currentWindow: !0 })
        )[0];
        chrome.runtime.sendMessage(
          {
            type: "TRIGGER_ACTIVE_SCAN",
            tabId: n?.id,
            url: n?.url,
            from: "popup",
            to: "background",
          },
          (s) => {
            ((e.disabled = !1),
              e.classList.remove("scanning"),
              (e.textContent = "主动探测"));
            const a = s?.results || [];
            if (s?.error) {
              t && (t.textContent = "探测失败: " + s.error);
              return;
            }
            if (a.length === 0) {
              t && (t.textContent = "未发现新的主动指纹");
              return;
            }
            t && (t.textContent = `发现 ${a.length} 个主动指纹`);
            const n = this.container.querySelector(".fingerprint-section");
            n &&
              a.forEach((r) => {
                this.addFingerprint(n, {
                  type: r.type,
                  name: r.name,
                  description: r.description,
                  value: r.name,
                  matchMode: r.matchMode || "active",
                  probeUrl: r.probeUrl || "",
                  status: r.status || null,
                });
              });
          },
        );
      });
  }
  async fetchFingerprints() {
    const e = (await chrome.tabs.query({ active: !0, currentWindow: !0 }))[0]
      ?.id;
    e &&
      chrome.runtime.sendMessage(
        { type: "GET_FINGERPRINTS", tabId: e, from: "popup", to: "background" },
        (t) => {
          t && this.updateServerFingerprints(t);
        },
      );
  }
  updateServerFingerprints(i) {
    const e = this.container.querySelector(".fingerprint-section");
    if (!e) return;
    e.innerHTML = "";
    let t = !1;
    for (const s in i)
      if (i[s] && i[s].length > 0) {
        t = !0;
        break;
      }
    if (!t) {
      e.innerHTML = '<div class="notice">暂未识别到指纹</div>';
      return;
    }
    for (const [s, n] of Object.entries(i))
      if (!(n.length === 0 || s === "nameMap"))
        for (const a of n)
          this.addFingerprint(e, {
            type: s,
            name: a.name,
            description: a.description,
            value: a.version || a.name,
            matchMode: a.matchMode || "",
            probeUrl: a.probeUrl || "",
            status: a.status || null,
          });
  }
  addFingerprint(i, e) {
    const _esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const t = document.createElement("div"),
      s =
        e.matchMode === "active"
          ? '<span class="fingerprint-mode-tag">主动探测</span>'
          : "",
      a = e.probeUrl
        ? '<div class="fingerprint-probe-url">' + _esc(e.probeUrl) + "</div>"
        : "",
      r = e.status
        ? '<div class="fingerprint-probe-url">状态码: ' +
          _esc(e.status) +
          "</div>"
        : "";
    ((t.className = `fingerprint-group ${_esc(e.type)}-group`),
      (t.innerHTML = `
      <h3>
        <span class="tag ${_esc(e.type)}-tag">${_esc(e.type[0].toUpperCase() + e.type.slice(1))}</span>
        ${_esc(e.name)}
        <span class="fingerprint-meta">${s}</span>
      </h3>
      <div class="fingerprint-item">
        <div class="fingerprint-label">${_esc(e.description)}</div>
        <div class="fingerprint-value server-value detected">${_esc(e.value)}</div>
      </div>
      ${a}
      ${r}
    `),
      i.appendChild(t));
  }
}
class P extends b {
  constructor() {
    super(".encoder-page");
    l(this, "detectTimer", null);
  }
  onShow() {
    super.onShow();
    this.restoreState();
  }
  init() {
    const i = document.getElementById("encoderInput"),
      e = document.getElementById("encoderOutput"),
      t = document.getElementById("encoderCopy"),
      s = document.getElementById("encoderDetectAction");
    (i &&
      i.addEventListener("input", () => {
        (this.detectTimer && clearTimeout(this.detectTimer),
          (this.detectTimer = setTimeout(() => this.detectFormat(), 300)));
        this.saveState();
      }),
      t &&
        t.addEventListener("click", () => {
          (e && e.select(),
            document.execCommand("copy"),
            this.showCopyTooltip(t));
        }),
      s && s.addEventListener("click", () => this.executeDetectedAction()),
      this.container?.querySelectorAll(".encoder-btn").forEach((a) => {
        a.addEventListener("click", (r) => {
          const o = r.currentTarget.dataset.action;
          o && this.execute(o);
        });
      }),
      ["cryptoKey", "cryptoIv", "cryptoMode", "cryptoPadding"].forEach((id) => {
        const el = document.getElementById(id);
        el && el.addEventListener("change", () => this.saveState());
      }),
      this.restoreState());
  }
  getInput() {
    return document.getElementById("encoderInput")?.value || "";
  }
  setOutput(i) {
    const e = document.getElementById("encoderOutput");
    e && (e.value = i);
    this.saveState();
  }
  saveState() {
    try {
      chrome.storage.local.set({
        encoderInput: document.getElementById("encoderInput")?.value || "",
        encoderOutput: document.getElementById("encoderOutput")?.value || "",
        cryptoKey: document.getElementById("cryptoKey")?.value || "",
        cryptoIv: document.getElementById("cryptoIv")?.value || "",
        cryptoMode:
          document.getElementById("cryptoMode")?.value || "aes-128-cbc",
        cryptoPadding:
          document.getElementById("cryptoPadding")?.value || "pkcs7",
      });
    } catch {}
  }
  restoreState() {
    chrome.storage.local.get(
      [
        "encoderInput",
        "encoderOutput",
        "cryptoKey",
        "cryptoIv",
        "cryptoMode",
        "cryptoPadding",
      ],
      (i) => {
        const ei = document.getElementById("encoderInput"),
          eo = document.getElementById("encoderOutput"),
          ek = document.getElementById("cryptoKey"),
          ev = document.getElementById("cryptoIv"),
          em = document.getElementById("cryptoMode"),
          ep = document.getElementById("cryptoPadding");
        if (ei && i.encoderInput != null) ei.value = i.encoderInput;
        if (eo && i.encoderOutput != null) eo.value = i.encoderOutput;
        if (ek && i.cryptoKey != null) ek.value = i.cryptoKey;
        if (ev && i.cryptoIv != null) ev.value = i.cryptoIv;
        if (em && i.cryptoMode != null) em.value = i.cryptoMode;
        if (ep && i.cryptoPadding != null) ep.value = i.cryptoPadding;
      },
    );
  }
  showCopyTooltip(i) {
    const e = i.getBoundingClientRect(),
      t = document.createElement("div");
    ((t.className = "copy-tooltip"),
      (t.textContent = "已复制"),
      (t.style.left = `${e.left + e.width / 2}px`),
      (t.style.top = `${e.top - 30}px`),
      document.body.appendChild(t),
      setTimeout(() => t.remove(), 1e3));
  }
  detectFormat() {
    const i = this.getInput().trim(),
      e = document.getElementById("encoderDetect"),
      t = document.getElementById("encoderDetectText"),
      s = document.getElementById("encoderDetectAction");
    if (!i || !e || !t || !s) {
      (e && (e.style.display = "none"), this.clearRecommended());
      return;
    }
    let a = null;
    if (/^eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*$/.test(i)) {
      a = { action: "jwt-decode", label: "JWT Token", btnText: "立即解析" };
    } else if (/%[0-9A-Fa-f]{2}/.test(i)) {
      a = { action: "url-decode", label: "URL 编码", btnText: "立即解码" };
    } else if (/\\u[0-9A-Fa-f]{4}/.test(i)) {
      a = {
        action: "unicode-decode",
        label: "Unicode 编码 (\\uXXXX)",
        btnText: "立即解码",
      };
    } else if (/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(i)) {
      a = {
        action: "html-decode",
        label: "HTML 实体编码",
        btnText: "立即解码",
      };
    } else if (/^[0-9A-Fa-f]{4,}$/.test(i) && i.length % 2 === 0) {
      a = {
        action: "hex-decode",
        label: "Hex 十六进制编码",
        btnText: "立即解码",
      };
    } else if (/^[A-Za-z0-9+/=]{20,}$/.test(i) && i.length % 4 === 0) {
      a = {
        action: "base64-decode",
        label: "Base64 编码",
        btnText: "立即解码",
      };
    }
    if (a) {
      ((e.style.display = "flex"),
        (t.textContent = `检测到: ${a.label}`),
        (s.textContent = a.btnText),
        (s.dataset.detectedAction = a.action),
        this.highlightButton(a.action));
    } else {
      ((e.style.display = "none"), this.clearRecommended());
    }
  }
  highlightButton(i) {
    this.clearRecommended();
    const e = this.container?.querySelector(`.encoder-btn[data-action="${i}"]`);
    e && e.classList.add("recommended");
  }
  clearRecommended() {
    this.container
      ?.querySelectorAll(".encoder-btn.recommended")
      .forEach((i) => i.classList.remove("recommended"));
  }
  executeDetectedAction() {
    const i = document.getElementById("encoderDetectAction")?.dataset
      .detectedAction;
    i && this.execute(i);
  }
  execute(i) {
    const e = this.getInput();
    if (!e) {
      this.setOutput("");
      return;
    }
    try {
      switch (i) {
        case "base64-encode":
          this.setOutput(this.b64Encode(e));
          break;
        case "base64-decode":
          this.setOutput(this.b64Decode(e));
          break;
        case "url-encode":
          this.setOutput(encodeURIComponent(e));
          break;
        case "url-decode":
          this.setOutput(decodeURIComponent(e));
          break;
        case "double-url-encode":
          this.setOutput(encodeURIComponent(encodeURIComponent(e)));
          break;
        case "double-url-decode":
          try {
            this.setOutput(decodeURIComponent(decodeURIComponent(e)));
          } catch {
            this.setOutput(decodeURIComponent(e));
          }
          break;
        case "unicode-encode":
          this.setOutput(this.unicodeEncode(e));
          break;
        case "unicode-decode":
          this.setOutput(this.unicodeDecode(e));
          break;
        case "html-encode":
          this.setOutput(this.htmlEncode(e));
          break;
        case "html-decode":
          this.setOutput(this.htmlDecode(e));
          break;
        case "hex-encode":
          this.setOutput(this.hexEncode(e));
          break;
        case "hex-decode":
          this.setOutput(this.hexDecode(e));
          break;
        case "js-encode":
          this.setOutput(this.jsEscape(e));
          break;
        case "js-decode":
          this.setOutput(this.jsUnescape(e));
          break;
        case "md5":
          this.setOutput(this.md5(e));
          break;
        case "sha1":
          this.shaHash(e, "SHA-1").then((t) => this.setOutput(t));
          break;
        case "sha256":
          this.shaHash(e, "SHA-256").then((t) => this.setOutput(t));
          break;
        case "jwt-decode":
          this.setOutput(this.jwtDecode(e));
          break;
        case "aes-encrypt":
          this.symmetricEncrypt(e).then((t) => this.setOutput(t));
          break;
        case "aes-decrypt":
          this.symmetricDecrypt(e).then((t) => this.setOutput(t));
          break;
        case "hmac":
          this.hmacHash(e)
            .then((t) => this.setOutput(t))
            .catch((t) => this.setOutput("错误: " + t.message));
          break;
        case "sm3":
          this.setOutput(this.sm3(e));
          break;
      }
    } catch (t) {
      this.setOutput("错误: " + t.message);
    }
  }
  b64Encode(i) {
    const e = new TextEncoder().encode(i);
    let t = "";
    for (let s = 0; s < e.length; s++) t += String.fromCharCode(e[s]);
    return btoa(t);
  }
  b64Decode(i) {
    let n = String(i)
      .trim()
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/\s+/g, "");
    if (n.length % 4 === 1) throw new Error("Base64 字符串长度不合法");
    n = n.padEnd(n.length + ((4 - (n.length % 4)) % 4), "=");
    const e = atob(n),
      t = new Uint8Array(e.length);
    for (let s = 0; s < e.length; s++) t[s] = e.charCodeAt(s);
    return new TextDecoder("utf-8", { fatal: !0 }).decode(t);
  }
  unicodeEncode(i) {
    return Array.from(i)
      .map((e) => {
        const t = e.codePointAt(0);
        if (t <= 127) return e;
        if (t <= 65535) return "\\u" + t.toString(16).padStart(4, "0");
        const s = t - 65536,
          a = 55296 + (s >> 10),
          r = 56320 + (s & 1023);
        return (
          "\\u" +
          a.toString(16).padStart(4, "0") +
          "\\u" +
          r.toString(16).padStart(4, "0")
        );
      })
      .join("");
  }
  unicodeDecode(i) {
    return i
      .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (e, t) =>
        String.fromCodePoint(parseInt(t, 16)),
      )
      .replace(/\\u([0-9a-fA-F]{4})/g, (e, t) =>
        String.fromCharCode(parseInt(t, 16)),
      );
  }
  htmlEncode(i) {
    const e = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return i.replace(/[&<>"']/g, (t) => e[t]);
  }
  htmlDecode(i) {
    const e = i
      .replace(/&#(\d+);/g, (t, s) => String.fromCodePoint(parseInt(s, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (t, s) =>
        String.fromCodePoint(parseInt(s, 16)),
      );
    const t = document.createElement("textarea");
    t.innerHTML = e;
    return t.value;
  }
  hexEncode(i) {
    return Array.from(new TextEncoder().encode(i))
      .map((e) => e.toString(16).padStart(2, "0"))
      .join("");
  }
  hexDecode(i) {
    const e = i.replace(/[\s:]/g, "");
    if (e.length % 2 !== 0) throw new Error("Hex 字符串长度必须为偶数");
    if (!/^[0-9a-fA-F]*$/.test(e)) throw new Error("Hex 字符串包含非法字符");
    const t = new Uint8Array(e.length / 2);
    for (let s = 0; s < e.length; s += 2)
      t[s / 2] = parseInt(e.substr(s, 2), 16);
    return new TextDecoder("utf-8", { fatal: !0 }).decode(t);
  }
  jsEscape(i) {
    return i.replace(/[\x00-\x1f\x7f-\uffff'"\\\/\n\r\t\b\f<>&]/g, (e) => {
      const t = e.charCodeAt(0);
      switch (e) {
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\t":
          return "\\t";
        case "\b":
          return "\\b";
        case "\f":
          return "\\f";
        case "'":
          return "\\'";
        case '"':
          return '\\"';
        case "\\":
          return "\\\\";
        case "/":
          return "\\/";
        case "<":
          return "\\x3c";
        case ">":
          return "\\x3e";
        default:
          return t < 16
            ? "\\x0" + t.toString(16)
            : t < 32
              ? "\\x" + t.toString(16)
              : t < 256
                ? "\\x" + t.toString(16)
                : "\\u" + t.toString(16).padStart(4, "0");
      }
    });
  }
  jsUnescape(i) {
    return i.replace(
      /\\x([0-9a-fA-F]{2})|\\u([0-9a-fA-F]{4})|\\n|\\r|\\t|\\b|\\f|\\'|\\"|\\\\|\\\//g,
      (e) => {
        switch (e) {
          case "\\n":
            return "\n";
          case "\\r":
            return "\r";
          case "\\t":
            return "\t";
          case "\\b":
            return "\b";
          case "\\f":
            return "\f";
          case "\\'":
            return "'";
          case '\\"':
            return '"';
          case "\\\\":
            return "\\";
          case "\\/":
            return "/";
          default:
            if (e.startsWith("\\x"))
              return String.fromCharCode(parseInt(e.slice(2), 16));
            if (e.startsWith("\\u"))
              return String.fromCharCode(parseInt(e.slice(2), 16));
            return e;
        }
      },
    );
  }
  md5(str) {
    const bytes = new TextEncoder().encode(str);
    str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    function safe_add(x, y) {
      var lsw = (x & 65535) + (y & 65535);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 65535);
    }
    function bit_rol(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5_cmn(q, a, b, x, s, t) {
      return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
      return md5_cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
      return md5_cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
      return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
      return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function core_md5(x, len) {
      x[len >> 5] |= 128 << (len % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;
      var a = 1732584193,
        b = -271733879,
        c = -1732584194,
        d = 271733878;
      for (var i = 0; i < x.length; i += 16) {
        var olda = a,
          oldb = b,
          oldc = c,
          oldd = d;
        a = md5_ff(a, b, c, d, x[i], 7, -680876936);
        d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5_gg(b, c, d, a, x[i], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5_hh(d, a, b, c, x[i], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5_ii(a, b, c, d, x[i], 6, -198630844);
        d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
      }
      return [a, b, c, d];
    }
    function str2binl(str) {
      var output = [];
      var mask = (1 << 8) - 1;
      for (var i = 0; i < str.length * 8; i += 8) {
        output[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
      }
      return output;
    }
    function binl2hex(binarray) {
      var hex_tab = "0123456789abcdef";
      var str = "";
      for (var i = 0; i < binarray.length * 4; i++) {
        str +=
          hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 15) +
          hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 15);
      }
      return str;
    }
    return binl2hex(core_md5(str2binl(str), str.length * 8));
  }
  async shaHash(i, e) {
    const s = new TextEncoder().encode(i),
      a = await crypto.subtle.digest(e, s);
    return Array.from(new Uint8Array(a))
      .map((r) => r.toString(16).padStart(2, "0"))
      .join("");
  }
  jwtDecode(i) {
    const e = i.split(".");
    if (e.length !== 3) throw new Error("无效的 JWT 格式");
    try {
      const t = JSON.parse(this.b64Decode(e[0])),
        s = JSON.parse(this.b64Decode(e[1])),
        a = { header: t, payload: s, signature: e[2] };
      return JSON.stringify(a, null, 2);
    } catch (t) {
      throw new Error("JWT 解析失败: " + t.message);
    }
  }
  _toBytes(str) {
    if (!str) return new Uint8Array(0);
    return new TextEncoder().encode(str);
  }
  _toKeyBytes(str, len) {
    const raw = new TextEncoder().encode(str);
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = raw[i % raw.length];
    return out;
  }
  _toIvBytes(str, len) {
    if (!str) return new Uint8Array(len);
    const raw = new TextEncoder().encode(str);
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = raw[i % raw.length];
    return out;
  }
  _parseCipher(str) {
    const s = str.trim();
    if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length >= 4 && s.length % 4 === 0)
      try {
        return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
      } catch {}
    const hex = s.replace(/[\s:]/g, "");
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i++)
        out[i] = parseInt(hex.substr(i * 2, 2), 16);
      return out;
    }
    throw new Error("无法解析密文，请输入Base64或Hex格式");
  }
  _pkcs7Pad(data) {
    const n = 16 - (data.length % 16);
    const out = new Uint8Array(data.length + n);
    out.set(data);
    for (let i = data.length; i < out.length; i++) out[i] = n;
    return out;
  }
  _pkcs7Unpad(data) {
    if (!data.length) return data;
    const n = data[data.length - 1];
    if (n < 1 || n > 16) return data;
    for (let i = data.length - n; i < data.length; i++)
      if (data[i] !== n) return data;
    return data.subarray(0, data.length - n);
  }
  _zeroUnpad(data) {
    let e = data.length;
    while (e > 0 && data[e - 1] === 0) e--;
    return data.subarray(0, e);
  }
  _zeroPad(data) {
    const n = (16 - (data.length % 16)) % 16;
    if (!n) return data;
    const out = new Uint8Array(data.length + n);
    out.set(data);
    return out;
  }
  async symmetricEncrypt(plain) {
    const ks = document.getElementById("cryptoKey")?.value;
    const is = document.getElementById("cryptoIv")?.value;
    const md = document.getElementById("cryptoMode")?.value || "aes-128-cbc";
    const pd = document.getElementById("cryptoPadding")?.value || "pkcs7";
    if (!ks) throw new Error("请输入密钥");
    const ecb = md.includes("ecb");
    if (ecb)
      throw new Error("当前浏览器加密接口不支持 AES-ECB，请选择 CBC 或 GCM");
    const gcm = md.includes("gcm");
    const kl = md.includes("256") ? 32 : md.includes("192") ? 24 : 16;
    const il = gcm ? 12 : 16;
    const key = await crypto.subtle.importKey(
      "raw",
      this._toKeyBytes(ks, kl),
      gcm ? "AES-GCM" : "AES-CBC",
      false,
      ["encrypt"],
    );
    let pt = new TextEncoder().encode(plain);
    if (!gcm && pd === "pkcs7") pt = this._pkcs7Pad(pt);
    else if (!gcm && pd === "zero") pt = this._zeroPad(pt);
    else if (!gcm && pt.length % 16 !== 0)
      throw new Error("无填充模式下明文长度必须是 16 字节的倍数");
    let iv = this._toIvBytes(is, il);
    const params = gcm ? { name: "AES-GCM", iv } : { name: "AES-CBC", iv };
    const ct = await crypto.subtle.encrypt(params, key, pt);
    return btoa(String.fromCharCode(...new Uint8Array(ct)));
  }
  async symmetricDecrypt(cipher) {
    const ks = document.getElementById("cryptoKey")?.value;
    const is = document.getElementById("cryptoIv")?.value;
    const md = document.getElementById("cryptoMode")?.value || "aes-128-cbc";
    const pd = document.getElementById("cryptoPadding")?.value || "pkcs7";
    if (!ks) throw new Error("请输入密钥");
    const ecb = md.includes("ecb");
    if (ecb)
      throw new Error("当前浏览器加密接口不支持 AES-ECB，请选择 CBC 或 GCM");
    const gcm = md.includes("gcm");
    const kl = md.includes("256") ? 32 : md.includes("192") ? 24 : 16;
    const il = gcm ? 12 : 16;
    const key = await crypto.subtle.importKey(
      "raw",
      this._toKeyBytes(ks, kl),
      gcm ? "AES-GCM" : "AES-CBC",
      false,
      ["decrypt"],
    );
    const ct = this._parseCipher(cipher);
    let iv = this._toIvBytes(is, il);
    const params = gcm ? { name: "AES-GCM", iv } : { name: "AES-CBC", iv };
    const pt = await crypto.subtle.decrypt(params, key, ct);
    const raw = new Uint8Array(pt);
    const out = gcm
      ? raw
      : pd === "pkcs7"
        ? this._pkcs7Unpad(raw)
        : pd === "zero"
          ? this._zeroUnpad(raw)
          : raw;
    return new TextDecoder().decode(out);
  }
  async hmacHash(text) {
    const ks = document.getElementById("cryptoKey")?.value || "";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(ks),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(text),
    );
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  sm3(msg) {
    function rotl(x, n) {
      return ((x << n) | (x >>> (32 - n))) >>> 0;
    }
    function ff(x, y, z, j) {
      return j < 16 ? (x ^ y ^ z) >>> 0 : ((x & y) | (x & z) | (y & z)) >>> 0;
    }
    function gg(x, y, z, j) {
      return j < 16 ? (x ^ y ^ z) >>> 0 : ((x & y) | ((~x >>> 0) & z)) >>> 0;
    }
    function p0(x) {
      return (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;
    }
    function p1(x) {
      return (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0;
    }
    const T = new Uint32Array(64);
    for (let i = 0; i < 16; i++) T[i] = 0x79cc4519;
    for (let i = 16; i < 64; i++) T[i] = 0x7a879d8a;
    const bytes = new TextEncoder().encode(msg);
    const len = bytes.length;
    const bitLen = len * 8;
    const totalLen = (len + 9 + 63) & ~63;
    const padded = new Uint8Array(totalLen);
    padded.set(bytes);
    padded[len] = 0x80;
    padded[totalLen - 4] = (bitLen >>> 24) & 0xff;
    padded[totalLen - 3] = (bitLen >>> 16) & 0xff;
    padded[totalLen - 2] = (bitLen >>> 8) & 0xff;
    padded[totalLen - 1] = bitLen & 0xff;
    let V = new Uint32Array([
      0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa,
      0xe38dee4d, 0xb0fb0e4e,
    ]);
    for (let off = 0; off < totalLen; off += 64) {
      const W = new Uint32Array(68);
      const W1 = new Uint32Array(64);
      for (let i = 0; i < 16; i++)
        W[i] =
          ((padded[off + i * 4] << 24) |
            (padded[off + i * 4 + 1] << 16) |
            (padded[off + i * 4 + 2] << 8) |
            padded[off + i * 4 + 3]) >>>
          0;
      for (let i = 16; i < 68; i++)
        W[i] =
          (p1(W[i - 16] ^ W[i - 9] ^ rotl(W[i - 3], 15)) ^
            rotl(W[i - 13], 7) ^
            W[i - 6]) >>>
          0;
      for (let i = 0; i < 64; i++) W1[i] = (W[i] ^ W[i + 4]) >>> 0;
      let [a, b, c, d, e, f, g, h] = V;
      for (let j = 0; j < 64; j++) {
        const ss1 = rotl((rotl(a, 12) + e + rotl(T[j], j % 32)) >>> 0, 7);
        const ss2 = (ss1 ^ rotl(a, 12)) >>> 0;
        const tt1 = (ff(a, b, c, j) + d + ss2 + W1[j]) >>> 0;
        const tt2 = (gg(e, f, g, j) + h + ss1 + W[j]) >>> 0;
        d = c;
        c = rotl(b, 9);
        b = a;
        a = tt1;
        h = g;
        g = rotl(f, 19);
        f = e;
        e = p0(tt2);
      }
      V[0] ^= a;
      V[1] ^= b;
      V[2] ^= c;
      V[3] ^= d;
      V[4] ^= e;
      V[5] ^= f;
      V[6] ^= g;
      V[7] ^= h;
    }
    return Array.from(V)
      .map((v) => v.toString(16).padStart(8, "0"))
      .join("");
  }
}
class W extends b {
  constructor() {
    super(".weakpass-page");
    l(this, "weakPassFileHandle", null);
    l(this, "weakPassEntries", []);
    l(this, "weakPassLoaded", !1);
    l(this, "defaults", {
      commonSuffixes: [
        "123456",
        "12345",
        "1234567",
        "12345678",
        "123456789",
        "1234567890",
        "111111",
        "000000",
        "666666",
        "888888",
        "999999",
        "520520",
        "521521",
        "1314520",
        "112233",
        "123123",
        "123321",
        "654321",
        "admin",
        "admin123",
        "password",
        "passwd",
        "pwd",
        "root",
        "qwe123",
        "qwer1234",
        "abc123",
        "abc123456",
        "a123456",
        "aa123456",
        "1qaz2wsx",
        "qazwsx",
        "zaq12wsx",
        "!@#123",
        "Admin@123",
        "admin@123",
        "admin@123456",
        "Admin@123456",
        "P@ssw0rd",
        "Passw0rd",
        "Password@123",
        "Welcome@123",
        "Changeme@123",
        "Test@123",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
        "2026",
        "spring",
        "summer",
        "autumn",
        "winter",
        "Spring@123",
        "Summer@123",
        "Autumn@123",
        "Winter@123",
        "123.com",
        "qq.com",
        "163.com",
        "126.com",
        "123",
        "1234",
        "123456!",
        "88888888",
        "00000000",
        "abc@123",
        "root@123",
        "test123",
      ],
      noSepSuffixes: [
        "123",
        "1234",
        "12345",
        "123456",
        "1234567",
        "12345678",
        "111111",
        "000000",
        "666666",
        "888888",
        "999999",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
        "2026",
        "pwd",
        "pass",
        "password",
        "admin",
        "root",
        "test",
        "qwe",
        "abc",
        "520",
      ],
      accountPrefixes: [
        "admin",
        "administrator",
        "root",
        "sa",
        "test",
        "user",
        "guest",
        "sys",
        "system",
        "manager",
      ],
      enterpriseSuffixes: [
        "@123.com",
        "@qq.com",
        "@163.com",
        "@126.com",
        "@admin",
        "#123",
        "#123456",
        "_123",
        "_123456",
        "-123",
        "-123456",
        "pwd",
        "pass",
        "admin",
        "123!",
        "@2025",
      ],
    });
  }
  init() {
    this.loadDefaults();
    this.restoreState();
    this.restoreWeakPassFileHandle();
    this.loadWeakPassLibrary();
    this.bindEvents();
    // 初始化暴力破解模块
    if (window.__xuetongBruteForce) {
      window.__xuetongBruteForce.init();
    }
  }
  bindEvents() {
    const ids = [
      "weakDomain",
      "weakSeeds",
      "weakYearStart",
      "weakYearEnd",
      "weakCommonSuffixes",
      "weakNoSepSuffixes",
      "weakAccountPrefixes",
      "weakEnterpriseSuffixes",
      "weakPassQuery",
      "weakPassVendor",
      "weakPassUser",
      "weakPassPassword",
      "optYearLower",
      "optYearCapital",
      "optSuffix",
      "optMultiSep",
      "optNoSep",
      "optAccountPrefix",
      "optReverse",
      "optEnterprise",
      "optUppercase",
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      el && el.addEventListener("input", () => this.saveState());
      el && el.addEventListener("change", () => this.saveState());
    });
    document
      .getElementById("weakGenerate")
      ?.addEventListener("click", () => this.generate());
    document
      .getElementById("weakCopy")
      ?.addEventListener("click", () => this.copyOutput());
    document
      .getElementById("weakClear")
      ?.addEventListener("click", () => this.clearOutput());
    document
      .getElementById("chooseWeakPassFile")
      ?.addEventListener("click", () => this.chooseWeakPassFile());
    document
      .getElementById("weakPassSearch")
      ?.addEventListener("click", () => this.searchWeakPassLibrary());
    document
      .getElementById("weakPassQuery")
      ?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.searchWeakPassLibrary();
      });
    document
      .getElementById("weakPassAdd")
      ?.addEventListener("click", () => this.addWeakPassEntry());
  }
  loadDefaults() {
    this.setListIfEmpty("weakCommonSuffixes", this.defaults.commonSuffixes);
    this.setListIfEmpty("weakNoSepSuffixes", this.defaults.noSepSuffixes);
    this.setListIfEmpty("weakAccountPrefixes", this.defaults.accountPrefixes);
    this.setListIfEmpty(
      "weakEnterpriseSuffixes",
      this.defaults.enterpriseSuffixes,
    );
  }
  setListIfEmpty(id, values) {
    const el = document.getElementById(id);
    if (el && !el.value.trim()) el.value = values.join("\n");
  }
  restoreState() {
    chrome.storage.local.get(
      [
        "weakDomain",
        "weakSeeds",
        "weakYearStart",
        "weakYearEnd",
        "weakCommonSuffixes",
        "weakNoSepSuffixes",
        "weakAccountPrefixes",
        "weakEnterpriseSuffixes",
        "weakPassQuery",
        "weakPassVendor",
        "weakPassUser",
        "weakPassPassword",
        "weakOptions",
        "weakOutput",
      ],
      (state) => {
        this.setValue("weakDomain", state.weakDomain);
        this.setValue("weakSeeds", state.weakSeeds);
        this.setValue("weakYearStart", state.weakYearStart);
        this.setValue("weakYearEnd", state.weakYearEnd);
        this.setValue("weakCommonSuffixes", state.weakCommonSuffixes);
        this.setValue("weakNoSepSuffixes", state.weakNoSepSuffixes);
        this.setValue("weakAccountPrefixes", state.weakAccountPrefixes);
        this.setValue("weakEnterpriseSuffixes", state.weakEnterpriseSuffixes);
        this.setValue("weakPassQuery", state.weakPassQuery);
        this.setValue("weakPassVendor", state.weakPassVendor);
        this.setValue("weakPassUser", state.weakPassUser);
        this.setValue("weakPassPassword", state.weakPassPassword);
        this.setValue("weakOutput", state.weakOutput);
        if (state.weakOptions) {
          Object.entries(state.weakOptions).forEach(([id, checked]) => {
            const el = document.getElementById(id);
            if (el) el.checked = checked;
          });
        }
        this.updateCount();
      },
    );
  }
  saveState() {
    try {
      chrome.storage.local.set({
        weakDomain: this.value("weakDomain"),
        weakSeeds: this.value("weakSeeds"),
        weakYearStart: this.value("weakYearStart"),
        weakYearEnd: this.value("weakYearEnd"),
        weakCommonSuffixes: this.value("weakCommonSuffixes"),
        weakNoSepSuffixes: this.value("weakNoSepSuffixes"),
        weakAccountPrefixes: this.value("weakAccountPrefixes"),
        weakEnterpriseSuffixes: this.value("weakEnterpriseSuffixes"),
        weakPassQuery: this.value("weakPassQuery"),
        weakPassVendor: this.value("weakPassVendor"),
        weakPassUser: this.value("weakPassUser"),
        weakPassPassword: this.value("weakPassPassword"),
        weakOptions: this.optionState(),
        weakOutput: this.value("weakOutput"),
      });
    } catch {}
  }
  optionState() {
    const ids = [
      "optYearLower",
      "optYearCapital",
      "optSuffix",
      "optMultiSep",
      "optNoSep",
      "optAccountPrefix",
      "optReverse",
      "optEnterprise",
      "optUppercase",
    ];
    return ids.reduce((acc, id) => {
      acc[id] = document.getElementById(id)?.checked === !0;
      return acc;
    }, {});
  }
  value(id) {
    return document.getElementById(id)?.value || "";
  }
  setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.value = value;
  }
  checked(id) {
    return document.getElementById(id)?.checked === !0;
  }
  list(id) {
    return this.value(id)
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  yearRange() {
    let start = Number.parseInt(this.value("weakYearStart"), 10),
      end = Number.parseInt(this.value("weakYearEnd"), 10);
    if (!Number.isInteger(start)) start = 2010;
    if (!Number.isInteger(end)) end = 2026;
    if (start > end) [start, end] = [end, start];
    start = Math.max(1900, Math.min(2100, start));
    end = Math.max(1900, Math.min(2100, end));
    const years = [];
    for (let y = start; y <= end; y++) years.push(String(y));
    return years;
  }
  extractDomainSeed(input) {
    const raw = input.trim();
    if (!raw) return "";
    let host = raw;
    try {
      host = new URL(raw.includes("://") ? raw : "https://" + raw).hostname;
    } catch {
      host = raw.split("/")[0];
    }
    const parts = host
      .toLowerCase()
      .replace(/^www\./, "")
      .split(".")
      .filter(Boolean);
    if (!parts.length) return "";
    const secondLevelTlds = new Set(["com", "net", "org", "gov", "edu", "co"]);
    if (
      parts.length >= 3 &&
      parts.at(-1) === "cn" &&
      secondLevelTlds.has(parts.at(-2))
    )
      return parts.at(-3);
    return parts.length >= 2 ? parts.at(-2) : parts[0];
  }
  seeds() {
    const values = new Set();
    const domainSeed = this.extractDomainSeed(this.value("weakDomain"));
    if (domainSeed) values.add(domainSeed);
    this.value("weakSeeds")
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach((v) => values.add(v));
    return Array.from(values);
  }
  forms(seed, includeUpper = !1) {
    const lower = seed.toLowerCase();
    const capital = lower ? lower[0].toUpperCase() + lower.slice(1) : lower;
    const list = [lower, capital];
    if (includeUpper) list.push(seed.toUpperCase());
    return Array.from(new Set(list));
  }
  add(out, value) {
    if (value) out.add(value);
  }
  generate() {
    const output = new Set(),
      seeds = this.seeds(),
      years = this.yearRange(),
      commonSuffixes = this.list("weakCommonSuffixes"),
      noSepSuffixes = this.list("weakNoSepSuffixes"),
      accountPrefixes = this.list("weakAccountPrefixes"),
      enterpriseSuffixes = this.list("weakEnterpriseSuffixes"),
      withUpper = this.checked("optUppercase");
    seeds.forEach((seed) => {
      const lower = seed.toLowerCase(),
        capital = lower ? lower[0].toUpperCase() + lower.slice(1) : lower,
        upper = seed.toUpperCase(),
        variants = this.forms(seed, withUpper);
      if (this.checked("optYearLower"))
        years.forEach((year) => {
          this.add(output, `${lower}@${year}`);
          if (withUpper) this.add(output, `${upper}@${year}`);
        });
      if (this.checked("optYearCapital"))
        years.forEach((year) => {
          this.add(output, `${capital}@${year}`);
          if (withUpper) this.add(output, `${upper}@${year}`);
        });
      if (this.checked("optSuffix"))
        commonSuffixes.forEach((suffix) => {
          variants.forEach((data) => this.add(output, `${data}@${suffix}`));
        });
      if (this.checked("optMultiSep"))
        years.forEach((year) => {
          ["#", "_", "-", "."].forEach((sep) => {
            variants.forEach((data) =>
              this.add(output, `${data}${sep}${year}`),
            );
          });
        });
      if (this.checked("optNoSep"))
        noSepSuffixes.forEach((suffix) => {
          variants.forEach((data) => this.add(output, `${data}${suffix}`));
        });
      if (this.checked("optAccountPrefix"))
        accountPrefixes.forEach((account) => {
          variants.forEach((data) => this.add(output, `${account}@${data}`));
        });
      if (this.checked("optReverse")) {
        years.forEach((year) => {
          variants.forEach((data) => this.add(output, `${year}@${data}`));
        });
        commonSuffixes.forEach((suffix) => {
          variants.forEach((data) => this.add(output, `${suffix}@${data}`));
        });
      }
      if (this.checked("optEnterprise"))
        enterpriseSuffixes.forEach((suffix) => {
          variants.forEach((data) => this.add(output, `${data}${suffix}`));
        });
    });
    const result = Array.from(output);
    this.setValue("weakOutput", result.join("\n"));
    this.updateCount(result.length);
    this.saveState();
  }
  updateCount(count = null) {
    const el = document.getElementById("weakCount");
    if (!el) return;
    const n =
      count == null
        ? this.value("weakOutput").split(/\r?\n/).filter(Boolean).length
        : count;
    el.textContent = `${n} 条`;
  }
  async copyOutput() {
    const output = this.value("weakOutput");
    try {
      await navigator.clipboard.writeText(output);
      this.showTooltip("复制成功");
    } catch {
      const el = document.getElementById("weakOutput");
      el && el.select();
      document.execCommand("copy");
      this.showTooltip("复制成功");
    }
  }
  clearOutput() {
    this.setValue("weakOutput", "");
    this.updateCount(0);
    this.saveState();
  }
  showTooltip(text) {
    const tip = document.createElement("div");
    tip.className = "copy-tooltip";
    tip.textContent = text;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1e3);
  }
  async openHandleDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("xuetong-config", 1);
      ((request.onupgradeneeded = () => {
        const db = request.result;
        db.objectStoreNames.contains("kv") || db.createObjectStore("kv");
      }),
        (request.onsuccess = () => resolve(request.result)),
        (request.onerror = () => reject(request.error)));
    });
  }
  async saveWeakPassHandleToDb(handle) {
    const db = await this.openHandleDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      (tx.objectStore("kv").put(handle, "weakPassYamlHandle"),
        (tx.oncomplete = () => {
          (db.close(), resolve());
        }),
        (tx.onerror = () => {
          (db.close(), reject(tx.error));
        }));
    });
  }
  async getWeakPassHandleFromDb() {
    const db = await this.openHandleDb();
    return new Promise((resolve, reject) => {
      const request = db
        .transaction("kv", "readonly")
        .objectStore("kv")
        .get("weakPassYamlHandle");
      ((request.onsuccess = () => {
        (db.close(), resolve(request.result || null));
      }),
        (request.onerror = () => {
          (db.close(), reject(request.error));
        }));
    });
  }
  async restoreWeakPassFileHandle() {
    try {
      const handle = await this.getWeakPassHandleFromDb();
      if (!handle) {
        this.updateWeakPassPath("使用插件内置 WeakPass.yaml");
        return;
      }
      this.weakPassFileHandle = handle;
      const permission = await handle.queryPermission({ mode: "readwrite" });
      this.updateWeakPassPath(
        `${handle.name || "WeakPass.yaml"}${permission === "granted" ? "（可写）" : "（待授权）"}`,
        permission === "granted",
      );
      await this.loadWeakPassLibrary();
    } catch {
      this.updateWeakPassPath("使用插件内置 WeakPass.yaml");
    }
  }
  async ensureWeakPassWritePermission(handle) {
    if (!handle) return !1;
    let permission = await handle.queryPermission({ mode: "readwrite" });
    return permission === "granted"
      ? !0
      : ((permission = await handle.requestPermission({ mode: "readwrite" })),
        permission === "granted");
  }
  updateWeakPassPath(text, writable = !1) {
    const el = document.getElementById("weakPassPath");
    if (!el) return;
    el.textContent = text || "使用插件内置 WeakPass.yaml";
    el.style.color = writable ? "#2b8a3e" : "#8494a7";
  }
  showWeakPassStatus(text, type = "info") {
    const el = document.getElementById("weakPassStatus");
    if (!el) return;
    el.textContent = text;
    el.style.color =
      type === "error" ? "#e03131" : type === "success" ? "#2b8a3e" : "#8494a7";
  }
  async chooseWeakPassFile() {
    if (typeof window.showOpenFilePicker != "function") {
      this.showWeakPassStatus("当前环境不支持直接选择本地文件", "error");
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: !1,
        types: [
          {
            description: "YAML/Text Files",
            accept: {
              "text/yaml": [".yaml", ".yml"],
              "text/plain": [".txt"],
            },
          },
        ],
      });
      if (!handle) return;
      this.weakPassFileHandle = handle;
      await this.saveWeakPassHandleToDb(handle);
      const writable = await this.ensureWeakPassWritePermission(handle);
      this.updateWeakPassPath(
        `${handle.name || "WeakPass.yaml"}${writable ? "（可写）" : "（只读）"}`,
        writable,
      );
      await this.loadWeakPassLibrary();
      this.showWeakPassStatus("WeakPass.yaml 已绑定", "success");
    } catch (error) {
      error?.name !== "AbortError" &&
        this.showWeakPassStatus("选择 WeakPass.yaml 失败", "error");
    }
  }
  async readWeakPassText() {
    if (this.weakPassFileHandle) {
      const file = await this.weakPassFileHandle.getFile();
      return await file.text();
    }
    const response = await fetch(chrome.runtime.getURL("WeakPass.yaml"));
    if (!response.ok) throw new Error("读取内置 WeakPass.yaml 失败");
    return await response.text();
  }
  parseWeakPassText(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes("`"))
      .map((line) => {
        const parts = line.split("`");
        return {
          vendor: (parts[0] || "").trim(),
          username: (parts[1] || "").trim(),
          password: parts.slice(2).join("`").trim(),
          raw: line,
        };
      })
      .filter((item) => item.vendor && (item.username || item.password));
  }
  async loadWeakPassLibrary() {
    try {
      const text = await this.readWeakPassText();
      this.weakPassEntries = this.parseWeakPassText(text);
      this.weakPassLoaded = !0;
      this.showWeakPassStatus(`已加载 ${this.weakPassEntries.length} 条默认口令`);
    } catch (error) {
      this.weakPassLoaded = !1;
      this.showWeakPassStatus(error?.message || "默认口令库加载失败", "error");
    }
  }
  async searchWeakPassLibrary() {
    if (!this.weakPassLoaded) await this.loadWeakPassLibrary();
    const query = this.value("weakPassQuery").trim().toLowerCase(),
      box = document.getElementById("weakPassResults");
    if (!box) return;
    if (!query) {
      box.textContent = "输入关键词后查询默认口令";
      this.showWeakPassStatus(`已加载 ${this.weakPassEntries.length} 条默认口令`);
      return;
    }
    const keywords = query.split(/\s+/).filter(Boolean),
      results = this.weakPassEntries
        .filter((item) => {
          const haystack =
            `${item.vendor} ${item.username} ${item.password}`.toLowerCase();
          return keywords.every((keyword) => haystack.includes(keyword));
        })
        .slice(0, 80);
    box.innerHTML = "";
    if (!results.length) {
      box.textContent = "未找到匹配项";
      this.showWeakPassStatus("查询完成：0 条");
      return;
    }
    results.forEach((item) => box.appendChild(this.renderWeakPassItem(item)));
    this.showWeakPassStatus(`查询完成：显示 ${results.length} 条`);
    this.saveState();
  }
  renderWeakPassItem(item) {
    const wrapper = document.createElement("div"),
      title = document.createElement("div"),
      meta = document.createElement("div"),
      user = document.createElement("span"),
      pass = document.createElement("span");
    wrapper.className = "weakpass-library-item";
    title.textContent = item.vendor;
    meta.className = "weakpass-library-meta";
    user.textContent = `账号: ${item.username || "<blank>"}`;
    pass.textContent = `密码: ${item.password || "<blank>"}`;
    meta.append(user, pass);
    wrapper.append(title, meta);
    wrapper.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          `${item.vendor}\n${item.username}\n${item.password}`,
        );
        this.showWeakPassStatus("已复制该条默认口令", "success");
      } catch {
        this.showWeakPassStatus("复制失败", "error");
      }
    });
    return wrapper;
  }
  normalizeWeakPassField(value) {
    const trimmed = value.trim();
    return trimmed || "<blank>";
  }
  collectWeakPassEntry() {
    const vendor = this.value("weakPassVendor").trim(),
      username = this.normalizeWeakPassField(this.value("weakPassUser")),
      password = this.normalizeWeakPassField(this.value("weakPassPassword"));
    if (!vendor) throw new Error("请填写厂商或产品");
    if (vendor.includes("`") || username.includes("`") || password.includes("`"))
      throw new Error("字段中不能包含反引号");
    return { vendor, username, password, raw: `${vendor}\`${username}\`${password}` };
  }
  async writeWeakPassText(text) {
    const writable = await this.weakPassFileHandle.createWritable();
    (await writable.write(text), await writable.close());
  }
  async addWeakPassEntry() {
    try {
      const entry = this.collectWeakPassEntry();
      if (!this.weakPassFileHandle) {
        await this.chooseWeakPassFile();
      }
      if (!this.weakPassFileHandle) {
        this.showWeakPassStatus("请先绑定 WeakPass.yaml 文件", "error");
        return;
      }
      if (!(await this.ensureWeakPassWritePermission(this.weakPassFileHandle))) {
        this.showWeakPassStatus("没有获得 WeakPass.yaml 的写入权限", "error");
        return;
      }
      const text = await this.readWeakPassText(),
        entries = this.parseWeakPassText(text),
        exists = entries.some(
          (item) =>
            item.vendor === entry.vendor &&
            item.username === entry.username &&
            item.password === entry.password,
        );
      if (exists) {
        this.showWeakPassStatus("相同默认口令已存在，无需重复添加", "info");
        return;
      }
      const nextText = `${text.replace(/\s*$/, "")}\n${entry.raw}\n`;
      await this.writeWeakPassText(nextText);
      this.weakPassEntries = [...entries, entry];
      this.weakPassLoaded = !0;
      this.setValue("weakPassVendor", "");
      this.setValue("weakPassUser", "");
      this.setValue("weakPassPassword", "");
      await this.searchWeakPassLibrary();
      this.showWeakPassStatus("已保存到 WeakPass.yaml", "success");
      this.saveState();
    } catch (error) {
      this.showWeakPassStatus(error?.message || "保存默认口令失败", "error");
    }
  }
}
class R extends b {
  constructor() {
    super(".threatintel-page");
  }
  onShow() {
    super.onShow();
    this.restoreState();
  }
  init() {
    (this.restoreState(), this.setupEventListeners());
  }
  restoreState() {
    chrome.storage.local.get(
      ["threatIntelLastResource", "threatIntelRealtime", "threatIntelPlatforms"],
      (i) => {
        const e = document.getElementById("tiResource"),
          t = document.getElementById("tiRealtimeVerdict"),
          s = Array.isArray(i.threatIntelPlatforms)
            ? i.threatIntelPlatforms
            : ["threatbook"],
          n = document.getElementById("tiPlatformThreatbook"),
          a = document.getElementById("tiPlatformVirustotal"),
          ic = document.getElementById("tiPlatformIcp"),
          ipg = document.getElementById("tiPlatformIpgeo");
        (e && i.threatIntelLastResource && (e.value = i.threatIntelLastResource, this.updateBatchInfo()),
          t && (t.checked = i.threatIntelRealtime === !0),
          n && (n.checked = s.includes("threatbook")),
          a && (a.checked = s.includes("virustotal")),
          ic && (ic.checked = s.includes("icp")),
          ipg && (ipg.checked = s.includes("ipgeo")));
      },
    );
  }
  setupEventListeners() {
    const i = document.getElementById("tiQuery"),
      e = document.getElementById("tiResource"),
      t = document.getElementById("tiRealtimeVerdict"),
      s = document.getElementById("tiPlatformThreatbook"),
      n = document.getElementById("tiPlatformVirustotal"),
      icp = document.getElementById("tiPlatformIcp"),
      ipg = document.getElementById("tiPlatformIpgeo"),
      cc = document.getElementById("tiClearCache"),
      ci = document.getElementById("tiClearInput");
    (i && i.addEventListener("click", () => this.query()),
      e &&
        (e.addEventListener("keydown", (s) => {
          s.key === "Enter" && s.ctrlKey && (s.preventDefault(), this.query());
        }),
        e.addEventListener("input", () => this.updateBatchInfo())),
      t &&
        t.addEventListener("change", () => {
          chrome.storage.local.set({ threatIntelRealtime: t.checked });
        }),
      [s, n, icp, ipg].forEach((a) => {
        a &&
          a.addEventListener("change", () => {
            chrome.storage.local.set({
              threatIntelPlatforms: this.getSelectedPlatforms(),
            });
          });
      }),
      cc && cc.addEventListener("click", () => {
        this.clearThreatIntelCache();
        const res = document.getElementById("tiResults");
        if (res) res.innerHTML = "输入 IP / 域名 / 文件哈希后查询第三方威胁情报";
      }),
      ci && ci.addEventListener("click", () => {
        e && ((e.value = ""), this.updateBatchInfo());
      }));
  }
  getSelectedPlatforms() {
    const i = [];
    return (
      document.getElementById("tiPlatformThreatbook")?.checked &&
        i.push("threatbook"),
      document.getElementById("tiPlatformVirustotal")?.checked &&
        i.push("virustotal"),
      document.getElementById("tiPlatformIcp")?.checked &&
        i.push("icp"),
      document.getElementById("tiPlatformIpgeo")?.checked &&
        i.push("ipgeo"),
      i
    );
  }
  updateBatchInfo() {
    const e = document.getElementById("tiResource"),
      bi = document.getElementById("tiBatchInfo"),
      bc = document.getElementById("tiBatchCount"),
      bt = document.getElementById("tiBatchType");
    if (!e || !bi) return;
    const raw = String(e.value || "").trim();
    if (!raw) { bi.style.display = "none"; return; }
    const items = raw.split(/[\s,，;；]+/).map((t) => t.trim()).filter(Boolean),
      unique = [...new Set(items)],
      types = unique.map((v) => this.detectResourceType(v)),
      counts = { ip: 0, domain: 0, hash: 0, unknown: 0 };
    types.forEach((t) => counts[t]++);
    const parts = [];
    counts.ip && parts.push(`${counts.ip} 个IP`);
    counts.domain && parts.push(`${counts.domain} 个域名`);
    counts.hash && parts.push(`${counts.hash} 个哈希`);
    counts.unknown && parts.push(`${counts.unknown} 个未知`);
    bc && (bc.textContent = unique.length);
    bt && (bt.textContent = parts.join(" / "));
    bi.style.display = "flex";
    counts.unknown > 0 ? bi.classList.add("ti-batch-warn") : bi.classList.remove("ti-batch-warn");
  }
  normalizeResource(i) {
    const e = String(i || "")
      .split(/[\s,，;；]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    return [...new Set(e)].slice(0, 100).join(",");
  }
  getCacheKey(i, e, t) {
    return `ti_cache_${i}_${e}_${t ? "rt" : "normal"}`;
  }
  getCachedResult(i, e, t) {
    try {
      const s = this.getCacheKey(i, e, t),
        n = localStorage.getItem(s);
      if (!n) return null;
      const a = JSON.parse(n);
      if (!a || !a.ts || Date.now() - a.ts > 36e5) return localStorage.removeItem(s), null;
      return a;
    } catch { return null; }
  }
  setCacheResult(i, e, t, s) {
    try {
      const n = this.getCacheKey(i, e, t);
      localStorage.setItem(n, JSON.stringify({ ts: Date.now(), platform: e, result: s }));
    } catch {}
  }
  clearThreatIntelCache() {
    const i = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.startsWith("ti_cache_") && i.push(t);
    }
    i.forEach((e) => localStorage.removeItem(e));
    this.setStatus("缓存已清除", "success");
  }
  getResourceItems(i) {
    return i.split(",").map((e) => ({
      value: e,
      type: this.detectResourceType(e),
    }));
  }
  detectResourceType(i) {
    const e = String(i || "").trim();
    if (
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(e) ||
      (/^[0-9a-fA-F:]{2,39}$/.test(e) && e.includes(":"))
    )
      return "ip";
    if (/^[a-fA-F0-9]{32}$/.test(e) || /^[a-fA-F0-9]{40}$/.test(e) || /^[a-fA-F0-9]{64}$/.test(e))
      return "hash";
    if (
      /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}\.?$/.test(e) &&
      !/^https?:\/\//i.test(e)
    )
      return "domain";
    return "unknown";
  }
  async query() {
    const i = document.getElementById("tiResource"),
      e = document.getElementById("tiRealtimeVerdict"),
      t = document.getElementById("tiQuery"),
      s = this.normalizeResource(i?.value || "");
    if (!s) {
      this.setStatus("请输入要查询的 IP / 域名 / 文件哈希", "error");
      return;
    }
    if (!this.isValidResourceList(s)) {
      this.setStatus("仅支持 IPv4 / IPv6 / 域名 / MD5 / SHA1 / SHA256，最多 100 个", "error");
      return;
    }
    const n = this.getSelectedPlatforms();
    if (!n.length) {
      this.setStatus("请至少勾选一个威胁情报平台", "error");
      return;
    }
    const rt = e?.checked === !0;
    t && ((t.disabled = !0), (t.textContent = "查询中"));
    chrome.storage.local.set({
      threatIntelLastResource: s,
      threatIntelRealtime: rt,
      threatIntelPlatforms: n,
    });
    const totalItems = s.split(",").length,
      totalTasks = totalItems * n.length;
    this._batchDone = 0;
    this._batchTotal = totalTasks;
    this._batchErrors = 0;
    this.showProgress(0, totalTasks);
    const cached = [], uncached = [];
    for (const p of n) {
      const c = this.getCachedResult(s, p, rt);
      if (c) {
        cached.push({ platform: p, success: !0, data: c.result, fromCache: !0 });
        this._batchDone += totalItems;
      } else uncached.push(p);
    }
    if (cached.length && !uncached.length) {
      this.showProgress(totalTasks, totalTasks);
      this.setStatus(`命中缓存，共 ${cached.length} 个平台 (${totalItems} 条)`, "success");
      this.renderPlatformResults(cached, totalItems);
      t && ((t.disabled = !1), (t.textContent = "查询"));
      return;
    }
    uncached.length &&
      this.setStatus(cached.length ? `缓存 ${cached.length} 个，查询 ${this.platformLabel(uncached)}... (${totalItems} 条)` : `正在查询 ${this.platformLabel(uncached)}... (${totalItems} 条)`, "info");
    this.queryPlatforms(uncached, s, rt)
      .then((a) => {
        for (const r of a) r.success && this.setCacheResult(s, r.platform, rt, r.data);
        this.showProgress(totalTasks, totalTasks);
        this.renderPlatformResults([...cached, ...a], totalItems);
      })
      .catch((a) => this.showError(a?.message || "查询失败"))
      .finally(() => {
        t && ((t.disabled = !1), (t.textContent = "查询"));
      });
  }
  showProgress(done, total) {
    let bar = document.getElementById("tiProgressBar");
    const res = document.getElementById("tiResults");
    if (!bar && res) {
      const wrap = document.createElement("div");
      wrap.className = "ti-progress-bar";
      wrap.id = "tiProgressBar";
      wrap.innerHTML = '<div class="ti-progress-bar-inner"></div>';
      res.parentNode.insertBefore(wrap, res);
      bar = wrap;
    }
    if (bar) {
      const inner = bar.querySelector(".ti-progress-bar-inner");
      if (inner) inner.style.width = (total > 0 ? (done / total * 100) : 0) + "%";
      bar.style.display = done >= total ? "none" : "block";
    }
  }
  reportItemDone(success) {
    this._batchDone++;
    if (!success) this._batchErrors++;
    this.showProgress(this._batchDone, this._batchTotal);
    this.setStatus(`查询中... ${this._batchDone}/${this._batchTotal}` + (this._batchErrors ? ` (${this._batchErrors} 个失败)` : ""), "info");
  }
  queryPlatforms(i, e, t) {
    return Promise.all(
      i.map((s) => {
        const n = this.getResourceItems(e),
          a = s === "threatbook" ? n.filter((r) => r.type === "ip").map((r) => r.value).join(",") : e;
        if (!a)
          return Promise.resolve({
            platform: s,
            success: !1,
            error: "微步当前仅支持 IP 查询",
          });
        if (s === "icp") {
          const domains = n.filter((r) => r.type === "domain").map((r) => r.value);
          if (!domains.length)
            return Promise.resolve({
              platform: "icp",
              success: !1,
              error: "备案查询仅支持域名，请输入域名后重试",
            });
          return Promise.all(
            domains.map((d) =>
              this.sendQuery({
                type: "ICP_QUERY",
                platform: "icp",
                resource: d,
                from: "popup",
                to: "background",
              }).then((r) => (this.reportItemDone(r.success), r))
            ),
          ).then((results) => {
            const successes = results.filter((r) => r.success),
              failures = results.filter((r) => !r.success);
            return {
              platform: "icp",
              success: successes.length > 0,
              data: successes.map((r) => r.data),
              error: failures.map((r) => r.error).join("; ") || "",
            };
          });
        }
        if (s === "ipgeo") {
          const ips = n.filter((r) => r.type === "ip").map((r) => r.value);
          if (!ips.length)
            return Promise.resolve({
              platform: "ipgeo",
              success: !1,
              error: "IP归属查询仅支持 IP 地址",
            });
          return Promise.all(
            ips.map((d) =>
              this.sendQuery({
                type: "IP_GEO_QUERY",
                platform: "ipgeo",
                resource: d,
                from: "popup",
                to: "background",
              }).then((r) => (this.reportItemDone(r.success), r))
            ),
          ).then((results) => {
            const successes = results.filter((r) => r.success),
              failures = results.filter((r) => !r.success);
            return {
              platform: "ipgeo",
              success: successes.length > 0,
              data: successes.map((r) => r.data),
              error: failures.map((r) => r.error).join("; ") || "",
            };
          });
        }
        return this.sendQuery({
          type:
            s === "virustotal"
              ? "VIRUSTOTAL_IP_REPUTATION"
              : "THREATBOOK_IP_REPUTATION",
          platform: s,
          resource: a,
          realtimeVerdict: t,
          from: "popup",
          to: "background",
        });
      }),
    );
  }
  sendQuery(i) {
    return new Promise((e) => {
      chrome.runtime.sendMessage(i, (t) => {
        e({
          platform: i.platform,
          success: !chrome.runtime.lastError && t?.success === !0,
          error: chrome.runtime.lastError?.message || t?.error || "",
          data: t?.data,
        });
      });
    });
  }
  platformLabel(i) {
    return i
      .map((e) => (e === "virustotal" ? "VirusTotal" : e === "icp" ? "备案查询" : e === "ipgeo" ? "IP归属" : "微步"))
      .join(" / ");
  }
  isValidResourceList(i) {
    const e = i.split(",");
    if (e.length > 100) return !1;
    return e.every((t) => this.detectResourceType(t) !== "unknown");
  }
  setStatus(i, e = "info") {
    const t = document.getElementById("tiStatus");
    t &&
      ((t.textContent = i),
      (t.style.color =
        e === "error" ? "#e03131" : e === "success" ? "#2b8a3e" : "#8494a7"));
  }
  showError(i) {
    const e = document.getElementById("tiResults");
    (this.setStatus(i, "error"),
      e && (e.innerHTML = `<div class="error">${this.escape(i)}</div>`));
  }
  renderPlatformResults(i, totalItems) {
    const e = document.getElementById("tiResults"),
      t = i.filter((s) => s.success);
    if (!e) return;
    if (!i.length) {
      e.innerHTML = '<div class="no-results">未选择查询平台</div>';
      this.setStatus("未选择查询平台", "error");
      return;
    }
    const merged = this.mergeResultsByResource(i),
      failed = i.filter((n) => !n.success),
      itemStr = totalItems > 1 ? ` (${totalItems} 条)` : "",
      batchTag = totalItems > 1 ? `<div class="ti-batch-info">批量查询 · ${totalItems} 条目标 · ${t.length} 个平台成功</div>` : "";
    e.innerHTML = batchTag + merged.map((r) => this.renderMergedCard(r)).join("");
    this.setStatus(
      failed.length
        ? `查询完成，${t.length} 个平台成功，${failed.length} 个平台失败${itemStr}`
        : `查询完成，${merged.length} 条结果${itemStr}`,
      failed.length && !t.length ? "error" : "success",
    );
  }
  mergeResultsByResource(platformResults) {
    const map = new Map();
    for (const pr of platformResults) {
      if (!pr.success || !pr.data) continue;
      const plat = pr.platform;
      if (plat === "threatbook") {
        const entries = pr.data?.data || pr.data?.ips || {};
        for (const [ip, info] of Object.entries(entries)) {
          const key = ip.toLowerCase();
          if (!map.has(key)) map.set(key, { resource: ip, type: "ip", sources: {} });
          map.get(key).sources.threatbook = info;
        }
      } else if (plat === "virustotal") {
        const items = Array.isArray(pr.data?.data) ? pr.data.data : [];
        for (const item of items) {
          const key = (item.value || "").toLowerCase();
          if (!key) continue;
          if (!map.has(key)) map.set(key, { resource: item.value, type: item.type || "unknown", sources: {} });
          map.get(key).sources.virustotal = item;
        }
      } else if (plat === "ipgeo") {
        const items = Array.isArray(pr.data) ? pr.data : [pr.data];
        for (const item of items) {
          const d = item?.data || item;
          const key = (d?.ip || "").toLowerCase();
          if (!key) continue;
          if (!map.has(key)) map.set(key, { resource: d.ip, type: "ip", sources: {} });
          map.get(key).sources.ipgeo = d;
        }
      } else if (plat === "icp") {
        const items = Array.isArray(pr.data) ? pr.data : [pr.data];
        for (const item of items) {
          const key = (item?.domain || "").toLowerCase();
          if (!key) continue;
          if (!map.has(key)) map.set(key, { resource: item.domain, type: "domain", sources: {} });
          map.get(key).sources.icp = item;
        }
      }
    }
    return Array.from(map.values());
  }
  renderMergedCard(merged) {
    const { resource, sources } = merged,
      tb = sources.threatbook,
      vt = sources.virustotal,
      ipg = sources.ipgeo,
      icp = sources.icp;

    // 判定总体威胁等级
    let severity = "normal", verdict = "正常";
    if (tb) {
      const mal = tb?.is_malicious === true;
      const sev = tb?.severity || "info";
      if (mal) { severity = "malicious"; verdict = "恶意"; }
      else if (sev && sev !== "info") { severity = "warning"; verdict = "风险"; }
    }
    if (vt) {
      const stats = vt?.attributes?.last_analysis_stats || {};
      const m = Number(stats.malicious || 0), s = Number(stats.suspicious || 0);
      if (m > 0) { severity = "malicious"; verdict = "恶意"; }
      else if (s > 0 && severity !== "malicious") { severity = "warning"; verdict = "可疑"; }
    }

    const sevClass = severity === "malicious" ? "malicious" : severity === "warning" ? "warning" : "";
    const grids = [], allTags = [], links = [];

    // ThreatBook 数据
    if (tb) {
      const loc = tb?.basic?.location || {},
        geo = [loc.country, loc.province, loc.city].filter(Boolean).join(" / ") || "-",
        asn = tb?.asn ? `${tb.asn.number || "-"} ${tb.asn.info || ""}`.trim() : "-";
      grids.push(
        this.field("威胁等级", tb?.severity || "-"),
        this.field("可信度", tb?.confidence_level || "-"),
        this.field("运营商", tb?.basic?.carrier || "-"),
        this.field("ASN", asn),
        this.field("场景", tb?.scene || "-"),
        this.field("蜜罐命中", tb?.evaluation?.honeypot_hit === true ? "是" : tb?.evaluation?.honeypot_hit === false ? "否" : "-"),
      );
      if (Array.isArray(tb?.judgments)) allTags.push(...tb.judgments);
      if (Array.isArray(tb?.tags_classes)) allTags.push(...tb.tags_classes.flatMap(t => t?.tags || []));
      if (tb?.permalink) links.push({ label: "微步", url: tb.permalink });
    }

    // VirusTotal 数据
    if (vt) {
      const attrs = vt?.attributes || {},
        stats = attrs?.last_analysis_stats || {},
        m = Number(stats.malicious || 0), s = Number(stats.suspicious || 0),
        cc = {CN:"中国",US:"美国",RU:"俄罗斯",JP:"日本",KR:"韩国",DE:"德国",GB:"英国",FR:"法国",CA:"加拿大",AU:"澳大利亚",IN:"印度",BR:"巴西",NL:"荷兰",SE:"瑞典",SG:"新加坡",HK:"中国香港",TW:"中国台湾"};
      grids.push(
        this.field("VT恶意/可疑", `${m} / ${s}`),
        this.field("VT无害", stats.harmless ?? "-"),
        this.field("VT国家", cc[attrs?.country] || attrs?.country || "-"),
        this.field("VT归属", attrs?.as_owner || "-"),
      );
      if (Array.isArray(attrs?.tags)) allTags.push(...attrs.tags);
      const selfLink = vt?.links?.self;
      if (selfLink) links.push({ label: "VirusTotal", url: this.toVirusTotalGuiUrl(selfLink, vt?.type) });
    }

    // IP归属数据
    if (ipg) {
      const loc = ipg?.location || [ipg?.country, ipg?.province, ipg?.city, ipg?.districts].filter(Boolean).join(" / ") || "-";
      grids.push(
        this.field("归属地", loc),
        this.field("运营商", ipg?.isp || "-"),
        this.field("网络类型", ipg?.net || "-"),
        this.field("所属单位", ipg?.idc || "-"),
      );
    }

    // 备案数据
    if (icp) {
      grids.push(
        this.field("备案号", icp?.icp || "-"),
        this.field("主办单位", icp?.unit || "-"),
        this.field("单位性质", icp?.type || "-"),
      );
    }

    // 来源标签
    const srcLabels = [];
    tb && srcLabels.push("微步");
    vt && srcLabels.push("VT");
    ipg && srcLabels.push("IP归属");
    icp && srcLabels.push("备案");

    // 去重标签
    const uniqueTags = [...new Set(allTags.map(t => String(t)))];

    return `<div class="ti-card ${sevClass}">
      <div class="ti-card-head">
        <div class="ti-ip">${this.escape(resource)}</div>
        <div style="display:flex;gap:4px;align-items:center;">
          <span class="ti-verdict">${this.escape(verdict)}</span>
          ${srcLabels.map(l => `<span class="ti-tag">${this.escape(l)}</span>`).join("")}
        </div>
      </div>
      <div class="ti-grid">
        ${grids.join("")}
      </div>
      ${uniqueTags.length ? `<div class="ti-tags">${uniqueTags.map(t => `<span class="ti-tag">${this.escape(t)}</span>`).join("")}</div>` : ""}
      ${links.length ? `<div class="ti-links">${links.map(l => `<a class="ti-link" href="${this.escape(l.url)}" target="_blank" rel="noreferrer">${this.escape(l.label)}</a>`).join(" · ")}</div>` : ""}
    </div>`;
  }
  renderProviderGroup(i) {
    const e = i.platform === "virustotal" ? "VirusTotal" : i.platform === "icp" ? "备案查询" : i.platform === "ipgeo" ? "IP归属" : "微步",
      t = i.success ? "完成" : i.error || "失败",
      c = i.fromCache ? '<span class="ti-cache-badge">缓存</span>' : "";
    return `<div class="ti-provider-group">
      <div class="ti-provider-title">
        <span>${this.escape(e)}${c}</span>
        <span class="ti-provider-status">${this.escape(t)}</span>
      </div>
      ${
        i.success
          ? i.platform === "virustotal"
            ? this.renderVirusTotalResults(i.data)
            : i.platform === "icp"
              ? this.renderICPResults(i.data)
              : i.platform === "ipgeo"
                ? this.renderIPGeoResults(i.data)
                : this.renderThreatBookResults(i.data)
          : `<div class="error">${this.escape(i.error || "查询失败")}</div>`
      }
    </div>`;
  }
  renderICPResults(i) {
    const e = Array.isArray(i) ? i : [];
    return e.length
      ? e.map((n) => this.renderICPCard(n)).join("")
      : '<div class="no-results">未返回备案数据</div>';
  }
  renderICPCard(i) {
    const e = i?.domain || "-",
      t = i?.icp || "-",
      s = i?.unit || "-",
      n = i?.type || "-",
      a = i?.time || "-",
      r = i?.td || "-";
    return `<div class="ti-card provider-icp">
      <div class="ti-card-head">
        <div class="ti-ip">${this.escape(e)}</div>
        <div class="ti-verdict">备案信息</div>
      </div>
      <div class="ti-grid">
        ${this.field("备案号", t)}
        ${this.field("主办单位", s)}
        ${this.field("单位性质", n)}
        ${this.field("备案域名数", r)}
        ${this.field("审核时间", a)}
      </div>
    </div>`;
  }
  renderIPGeoResults(i) {
    const e = Array.isArray(i) ? i : [];
    return e.length
      ? e.map((n) => this.renderIPGeoCard(n)).join("")
      : '<div class="no-results">未返回IP归属数据</div>';
  }
  renderIPGeoCard(i) {
    const d = i?.data || i,
      e = d?.ip || "-",
      t = d?.location || [d?.country, d?.province, d?.city, d?.districts].filter(Boolean).join(" / ") || "-",
      s = d?.isp || "-",
      n = d?.net || "-",
      a = d?.idc || "-",
      r = d?.protocol || "-",
      o = d?.dec || "-",
      h = d?.zipcode || "-",
      p = d?.areacode || "-",
      c = d?.countryCode || "-",
      m = d?.time || "-";
    return `<div class="ti-card provider-ipgeo">
      <div class="ti-card-head">
        <div class="ti-ip">${this.escape(e)}</div>
        <div class="ti-verdict">IP归属</div>
      </div>
      <div class="ti-grid">
        ${this.field("归属地", t)}
        ${this.field("运营商", s)}
        ${this.field("网络类型", n)}
        ${this.field("所属单位", a || "-")}
        ${this.field("IP类型", r)}
        ${this.field("国家编码", c)}
        ${this.field("十进制", o)}
        ${this.field("邮编", h)}
        ${this.field("区号", p)}
        ${this.field("查询时间", m)}
      </div>
    </div>`;
  }
  renderThreatBookResults(i) {
    const e = i?.data || i?.ips || {},
      t = Object.entries(e);
    return t.length
      ? t.map(([s, n]) => this.renderThreatBookCard(s, n)).join("")
      : '<div class="no-results">未返回情报数据</div>';
  }
  renderVirusTotalResults(i) {
    const e = Array.isArray(i?.data) ? i.data : [],
      t = Array.isArray(i?.errors) ? i.errors : [],
      s = e.length
        ? e.map((n) => this.renderVirusTotalCard(n.value, n.type, n.attributes || {}, n.links || {})).join("")
        : '<div class="no-results">未返回情报数据</div>',
      a = t.length
        ? `<div class="error">${this.escape("部分资源查询失败: " + t.join("; "))}</div>`
        : "";
    return s + a;
  }
  renderThreatBookCard(i, e) {
    const t = e?.is_malicious === !0,
      s = e?.severity || "info",
      n = t ? "malicious" : s && s !== "info" ? "warning" : "",
      a = t ? "恶意" : s && s !== "info" ? "风险" : "正常",
      r = e?.basic?.location || {},
      o = [r.country, r.province, r.city].filter(Boolean).join(" / ") || "-",
      h = e?.asn ? `${e.asn.number || "-"} ${e.asn.info || ""}`.trim() : "-",
      p = Array.isArray(e?.judgments) ? e.judgments : [],
      c = Array.isArray(e?.tags_classes)
        ? e.tags_classes.flatMap((m) => m?.tags || [])
        : [];
    return `<div class="ti-card ${n}">
      <div class="ti-card-head">
        <div class="ti-ip">${this.escape(i)}</div>
        <div class="ti-verdict">${this.escape(a)}</div>
      </div>
      <div class="ti-grid">
        ${this.field("严重级别", s || "-")}
        ${this.field("可信度", e?.confidence_level || "-")}
        ${this.field("地理位置", o)}
        ${this.field("运营商", e?.basic?.carrier || "-")}
        ${this.field("ASN", h)}
        ${this.field("场景", e?.scene || "-")}
        ${this.field("更新时间", e?.update_time || "-")}
        ${this.field("蜜罐命中", e?.evaluation?.honeypot_hit === !0 ? "是" : e?.evaluation?.honeypot_hit === !1 ? "否" : "-")}
      </div>
      ${p.length ? `<div class="ti-tags">${p.map((m) => `<span class="ti-tag">${this.escape(m)}</span>`).join("")}</div>` : ""}
      ${c.length ? `<div class="ti-tags">${c.map((m) => `<span class="ti-tag">${this.escape(m)}</span>`).join("")}</div>` : ""}
      ${e?.permalink ? `<a class="ti-link" href="${this.escape(e.permalink)}" target="_blank" rel="noreferrer">打开微步详情</a>` : ""}
    </div>`;
  }
  renderVirusTotalCard(i, e, t, s) {
    const cc = {CN:"中国",US:"美国",RU:"俄罗斯",JP:"日本",KR:"韩国",DE:"德国",GB:"英国",FR:"法国",CA:"加拿大",AU:"澳大利亚",IN:"印度",BR:"巴西",NL:"荷兰",SE:"瑞典",SG:"新加坡",HK:"中国香港",TW:"中国台湾",UA:"乌克兰",IL:"以色列",IR:"伊朗",VN:"越南",TH:"泰国",ID:"印度尼西亚",MY:"马来西亚",PH:"菲律宾",PK:"巴基斯坦",BD:"孟加拉国",TR:"土耳其",SA:"沙特阿拉伯",AE:"阿联酋",EG:"埃及",ZA:"南非",NG:"尼日利亚",KE:"肯尼亚",MX:"墨西哥",AR:"阿根廷",CL:"智利",CO:"哥伦比亚",PL:"波兰",CZ:"捷克",AT:"奥地利",CH:"瑞士",IT:"意大利",ES:"西班牙",PT:"葡萄牙",NO:"挪威",FI:"芬兰",DK:"丹麦",IE:"爱尔兰",RO:"罗马尼亚",HU:"匈牙利",GR:"希腊",BG:"保加利亚",NZ:"新西兰",KH:"柬埔寨",MM:"缅甸",LK:"斯里兰卡",NP:"尼泊尔",MN:"蒙古",KZ:"哈萨克斯坦",UZ:"乌兹别克斯坦",GE:"格鲁吉亚",AM:"亚美尼亚",AZ:"阿塞拜疆"},
      rir={ARIN:"美洲互联网注册机构",RIPE:"欧洲互联网注册机构",APNIC:"亚太互联网注册机构",LACNIC:"拉丁美洲及加勒比互联网注册机构",AFRINIC:"非洲互联网注册机构"},
      tags={malware:"恶意软件",botnet:"僵尸网络",c2:"C2命令控制",phishing:"钓鱼",spam:"垃圾邮件",tor:"Tor节点",proxy:"代理",vpn:"VPN",scanner:"扫描器",bruteforce:"暴力破解",exploit:"漏洞利用",ransomware:"勒索软件",backdoor:"后门",trojan:"木马",worm:"蠕虫",rootkit:"Rootkit",keylogger:"键盘记录器",cryptominer:"挖矿程序",apt:"APT攻击",ddos:"DDoS攻击",stealer:"信息窃取",loader:"加载器",downloader:"下载器",dropper:"释放器",adware:"广告软件",pup:"潜在有害程序",suspicious:"可疑",malicious:"恶意",clean:"干净",undetected:"未检测",harmless:"无害",timeout:"超时",blacklist:"黑名单",whitelist:"白名单",check:"检查",download:"下载",submit:"提交",file:"文件",network:"网络",behavior:"行为",signatur:"签名",heuristic:"启发式",machine_learning:"机器学习",yara:"YARA规则",sigma:"Sigma规则",ioc:"威胁指标",threat_intel:"威胁情报",domain:"域名",ip:"IP地址",url:"URL",hash:"哈希",certificate:"证书",ssl:"SSL/TLS",dns:"DNS",http:"HTTP",ftp:"FTP",smtp:"SMTP",ssh:"SSH",rdp:"RDP",smb:"SMB",mysql:"MySQL",postgresql:"PostgreSQL",mongodb:"MongoDB",redis:"Redis",windows:"Windows",linux:"Linux",android:"Android",ios:"iOS",macos:"MacOS",packer:"加壳",obfuscation:"混淆",encrypted:"加密",encoded:"编码",compressed:"压缩",signed:"已签名",unsigned:"未签名",multipartite:"多组件感染",infostealer:"信息窃取",banker:"银行木马",rat:"远程控制木马",ransom:"勒索",miner:"挖矿",crypter:"加密器",clipper:"剪贴板劫持",sniffer:"嗅探器",rootkit:"内核级后门",bootkit:"引导区恶意软件",fileless:"无文件攻击",living_off_land:"白利用攻击",zero_day:"零日漏洞",supply_chain:"供应链攻击"};
    const n = t?.last_analysis_stats || {},
      a = Number(n.malicious || 0),
      r = Number(n.suspicious || 0),
      o = a > 0 ? "malicious" : r > 0 ? "warning" : "",
      h = a > 0 ? "恶意" : r > 0 ? "可疑" : "正常",
      p = s?.self || "",
      c = e === "domain" ? "域名" : e === "hash" ? "文件哈希" : "IP",
      m = e === "domain"
        ? [t?.categories && Object.values(t.categories).filter(Boolean).slice(0, 3).map((y) => {const lc = String(y).toLowerCase(); return tags[lc] || (lc.includes("malware") ? "恶意软件" : lc.includes("phishing") ? "钓鱼" : lc.includes("spam") ? "垃圾邮件" : lc.includes("adult") ? "成人内容" : lc.includes("gambl") ? "赌博" : lc.includes("drugs") ? "毒品" : lc.includes("hacking") ? "黑客" : lc.includes("fraud") ? "欺诈" : y)}).join(" / "), t?.reputation != null ? "信誉 " + t.reputation : ""].filter(Boolean).join("；") || "-"
        : e === "hash"
          ? [t?.meaningful_name, t?.type_description].filter(Boolean).join(" / ") || "-"
          : [cc[t?.country] || t?.country, rir[t?.regional_internet_registry] || t?.regional_internet_registry].filter(Boolean).join(" / ") || "-",
      d = e === "hash" ? t?.sha256 || i : e === "domain" ? t?.registrar || "-" : t?.as_owner || "-",
      v = e === "hash" ? t?.size || "-" : e === "domain" ? t?.last_dns_records_date || t?.last_modification_date || "-" : t?.asn || "-",
      f = e === "hash" ? "文件大小" : e === "domain" ? "DNS/更新时间" : "ASN",
      g = e === "hash" ? "SHA256" : e === "domain" ? "注册商" : "归属";
    return `<div class="ti-card provider-virustotal ${o}">
      <div class="ti-card-head">
        <div class="ti-ip">${this.escape(i)}</div>
        <div class="ti-verdict">${this.escape(h)}</div>
      </div>
      <div class="ti-grid">
        ${this.field("类型", c)}
        ${this.field("恶意/可疑", `${a} / ${r}`)}
        ${this.field("无害", n.harmless ?? "-")}
        ${this.field("未检测", n.undetected ?? "-")}
        ${this.field(e === "hash" ? "名称/类型" : e === "domain" ? "分类/信誉" : "国家/区域", m)}
        ${this.field(g, d)}
        ${this.field(f, e === "domain" && Number.isFinite(Number(v)) ? this.formatUnixTime(v) : v)}
        ${this.field("最近分析", t?.last_analysis_date ? this.formatUnixTime(t.last_analysis_date) : "-")}
      </div>
      ${Array.isArray(t?.tags) && t.tags.length ? `<div class="ti-tags">${t.tags.map((y) => `<span class="ti-tag">${this.escape(tags[y] || tags[y.toLowerCase()] || y)}</span>`).join("")}</div>` : ""}
      ${p ? `<a class="ti-link" href="${this.escape(this.toVirusTotalGuiUrl(p, e))}" target="_blank" rel="noreferrer">打开 VirusTotal 详情</a>` : ""}
    </div>`;
  }
  toVirusTotalGuiUrl(i, e) {
    const t = {
      ip: "ip-address",
      domain: "domain",
      hash: "file",
    }[e] || "ip-address";
    return String(i)
      .replace("https://www.virustotal.com/api/v3/ip_addresses/", "https://www.virustotal.com/gui/ip-address/")
      .replace("https://www.virustotal.com/api/v3/domains/", "https://www.virustotal.com/gui/domain/")
      .replace("https://www.virustotal.com/api/v3/files/", "https://www.virustotal.com/gui/file/")
      .replace("/api/v3/" + t + "s/", "/gui/" + t + "/");
  }
  formatUnixTime(i) {
    const e = Number(i);
    return Number.isFinite(e) ? new Date(e * 1000).toLocaleString() : "-";
  }
  field(i, e) {
    return `<div class="ti-field"><div class="ti-label">${this.escape(i)}</div><div class="ti-value">${this.escape(e)}</div></div>`;
  }
  escape(i) {
    return String(i ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
class x {
  constructor() {
    l(this, "pages", {});
    l(this, "currentPage", null);
    l(this, "tabId", null);
    ((this.pages = {
      scanner: new C(),
      config: new L(),
      fingerprint: new E(),
      threatintel: new R(),
      encoder: new P(),
      weakpass: new W(),
    }),
      this.init());
  }
  async init() {
    const i = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    ((this.tabId = i[0]?.id || null),
      this.setupNavigation(),
      this.setupMessageListener(),
      this.initDefaultPage());
  }
  setupNavigation() {
    document.body.addEventListener("click", (i) => {
      const e = i.target.closest(".nav-tab");
      e && e.dataset.page && this.switchPage(e.dataset.page);
    });
  }
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((i) => {
      i.type === "SCAN_UPDATE" &&
        i.tabId === this.tabId &&
        this.pages.scanner.updateScannerResults(i);
    });
  }
  initDefaultPage() {
    const e =
      document.querySelector(".nav-tab.active")?.dataset.page || "scanner";
    (this.switchPage(e), this.tabId && this.checkWhitelistAndRequestResults());
  }
  async checkWhitelistAndRequestResults() {
    const e = (await chrome.tabs.query({ active: !0, currentWindow: !0 }))[0];
    if (!e?.url || !e.id) return;
    const t = new URL(e.url).hostname.toLowerCase();
    chrome.storage.local.get(["customWhitelist"], (s) => {
      const a = (s.customWhitelist || []).some(
          (o) => t === o || t.endsWith(`.${o}`),
        ),
        r = document.querySelector(".scanner-page .container");
      a
        ? (r &&
            (r.innerHTML =
              '<div class="whitelisted">当前域名在白名单中，已跳过扫描</div>'),
          this.updateProgress(100))
        : (r && (r.innerHTML = '<div class="loading">正在扫描...</div>'),
          chrome.tabs.sendMessage(e.id, {
            type: "GET_RESULTS",
            tabId: e.id,
            from: "popup",
          }));
    });
  }
  updateProgress(i) {
    const e = document.querySelector(".progress-tab");
    e && (e.textContent = `${i}%`);
  }
  switchPage(i) {
    const e = this.pages[i];
    e &&
      (this.currentPage && this.currentPage.onHide(),
      document.querySelectorAll(".nav-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.page === i);
      }),
      document.querySelectorAll(".page").forEach((t) => {
        t.style.display = t.classList.contains(`${i}-page`) ? "block" : "none";
      }),
      (this.currentPage = e),
      this.currentPage.onShow());
  }
}
document.addEventListener("DOMContentLoaded", () => {
  window.__xuetongPM = new x();
});
