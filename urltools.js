// urltools.js - 批量URL存活探测 & 批量打开
(function () {
  "use strict";

  const CONCURRENCY = 3;
  const FETCH_TIMEOUT = 8000;
  const REQUEST_DELAY = 300; // 请求间隔(ms)，避免浏览器连接池过载
  const BATCH_OPEN_DELAY = 150; // 批量打开标签页间隔(ms)

  class UrlToolsPage {
    constructor() {
      this.initialized = false;
      this.isRunning = false;
      this.abortController = null;
      this.results = [];
      this.container = null;
    }

    onShow() {
      if (!this.initialized) {
        this.container = document.querySelector(".urltools-page .container");
        if (this.container) {
          this.render();
          this.bindEvents();
        }
        this.initialized = true;
      }
      // 恢复上次输入的URL
      this.restoreInput();
    }

    onHide() {
      this.stopCheck();
    }

    render() {
      this.container.innerHTML = `
        <div class="urltools-section">
          <div class="urltools-panel">
            <div class="urltools-panel-title">批量URL探测</div>
            <textarea id="urltoolsInput" class="urltools-input"
              placeholder="输入URL列表，每行一个，支持逗号/空格分隔&#10;示例：&#10;https://example.com&#10;http://192.168.1.1:8080&#10;https://target.com/login"></textarea>
            <div class="urltools-toolbar">
              <button id="urltoolsCheck" class="urltools-btn urltools-btn-primary">开始探测</button>
              <button id="urltoolsStop" class="urltools-btn urltools-btn-danger" style="display:none">停止</button>
              <button id="urltoolsSelectAll" class="urltools-btn urltools-btn-secondary">全选</button>
              <button id="urltoolsOpen" class="urltools-btn urltools-btn-success">批量打开</button>
              <button id="urltoolsRemove404" class="urltools-btn urltools-btn-warn">去除404</button>
              <button id="urltoolsCopy" class="urltools-btn urltools-btn-secondary">复制结果</button>
            </div>
            <div id="urltoolsProgress" class="urltools-progress" style="display:none">
              <div class="urltools-progress-bar"><div class="urltools-progress-fill"></div></div>
              <span id="urltoolsProgressText" class="urltools-progress-text">0/0</span>
            </div>
          </div>
          <div id="urltoolsStats" class="urltools-stats" style="display:none">
            <span class="urltools-stat">总计: <strong id="urltoolsTotal">0</strong></span>
            <span class="urltools-stat urltools-stat-success">存活: <strong id="urltoolsAlive">0</strong></span>
            <span class="urltools-stat urltools-stat-error">失败: <strong id="urltoolsDead">0</strong></span>
          </div>
          <div id="urltoolsTableWrap" class="urltools-table-wrap" style="display:none">
            <table class="urltools-table">
              <thead>
                <tr>
                  <th class="urltools-th-check"><input type="checkbox" id="urltoolsCheckAll" /></th>
                  <th class="urltools-th-status">状态</th>
                  <th class="urltools-th-time">响应大小</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody id="urltoolsTbody"></tbody>
            </table>
          </div>
        </div>
      `;
    }

    bindEvents() {
      const $ = (id) => document.getElementById(id);

      $("urltoolsCheck").addEventListener("click", () => this.startCheck());
      $("urltoolsStop").addEventListener("click", () => this.stopCheck());
      $("urltoolsSelectAll").addEventListener("click", () => this.toggleSelectAll());
      $("urltoolsOpen").addEventListener("click", () => this.batchOpen());
      $("urltoolsRemove404").addEventListener("click", () => this.remove404());
      $("urltoolsCopy").addEventListener("click", () => this.copyResults());
      $("urltoolsCheckAll").addEventListener("change", (e) => {
        document.querySelectorAll(".urltools-row-check").forEach((cb) => {
          cb.checked = e.target.checked;
        });
        this.updateStats();
      });

      // 输入框内容变化时自动保存
      $("urltoolsInput").addEventListener("input", () => this.saveInput());
    }

    parseUrls(text) {
      return text
        .split(/[\n\r,;\s]+/)
        .map((u) => u.trim())
        .filter((u) => {
          if (!u) return false;
          try {
            new URL(u);
            return true;
          } catch {
            // try adding http://
            try {
              new URL("http://" + u);
              return true;
            } catch {
              return false;
            }
          }
        })
        .map((u) => {
          try {
            new URL(u);
            return u;
          } catch {
            return "http://" + u;
          }
        })
        .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    }

    async startCheck() {
      const input = document.getElementById("urltoolsInput");
      const urls = this.parseUrls(input.value);

      if (!urls.length) {
        this.showToast("请输入至少一个有效URL");
        return;
      }

      this.isRunning = true;
      this.results = [];
      this.abortController = new AbortController();

      const $ = (id) => document.getElementById(id);
      $("urltoolsCheck").style.display = "none";
      $("urltoolsStop").style.display = "";
      $("urltoolsTableWrap").style.display = "";
      $("urltoolsStats").style.display = "";
      $("urltoolsTbody").innerHTML = "";

      // pre-fill results
      this.results = urls.map((url) => ({
        url,
        status: null,
        size: null,
        error: null,
        checking: true,
      }));
      this.renderRows();
      this.updateProgress(0, urls.length);
      $("urltoolsProgress").style.display = "";

      let done = 0;
      const total = urls.length;
      const queue = [...urls.map((url, i) => ({ url, index: i }))];

      const delay = (ms) => new Promise((r) => setTimeout(r, ms));

      const worker = async () => {
        while (queue.length > 0 && this.isRunning) {
          const task = queue.shift();
          if (!task) break;
          try {
            const result = await this.checkUrl(task.url);
            this.results[task.index] = {
              url: task.url,
              status: result.status,
              size: result.size,
              error: result.error || null,
              checking: false,
            };
          } catch (e) {
            this.results[task.index] = {
              url: task.url,
              status: 0,
              size: null,
              error: e.message || "Unknown error",
              checking: false,
            };
          }
          done++;
          this.updateRow(task.index);
          this.updateProgress(done, total);
          // 请求间隔，避免浏览器连接池过载导致误判不存活
          if (queue.length > 0 && this.isRunning) {
            await delay(REQUEST_DELAY);
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(CONCURRENCY, urls.length) },
        () => worker()
      );
      await Promise.all(workers);

      this.isRunning = false;
      $("urltoolsCheck").style.display = "";
      $("urltoolsStop").style.display = "none";
      this.updateStats();
    }

    stopCheck() {
      this.isRunning = false;
      this.abortController?.abort();
      const $ = (id) => document.getElementById(id);
      $("urltoolsCheck").style.display = "";
      $("urltoolsStop").style.display = "none";
    }

    async checkUrl(url) {
      // 直接走background，extension的host_permissions不受CORS限制，能读响应体
      return this.checkUrlViaBackground(url);
    }

    checkUrlViaBackground(url) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ status: 0, size: 0, error: "Timeout" });
        }, FETCH_TIMEOUT);
        chrome.runtime.sendMessage(
          { type: "URL_ALIVE_CHECK", url },
          (resp) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError || !resp) {
              resolve({ status: 0, size: 0, error: "Request failed" });
            } else {
              resolve({
                status: resp.status || 0,
                size: resp.size || 0,
                error: resp.error || null,
              });
            }
          }
        );
      });
    }

    renderRows() {
      const tbody = document.getElementById("urltoolsTbody");
      if (!tbody) return;
      tbody.innerHTML = this.results
        .map(
          (r, i) => `
        <tr class="urltools-row" data-index="${i}">
          <td class="urltools-td-check"><input type="checkbox" class="urltools-row-check" data-index="${i}" /></td>
          <td class="urltools-td-status">${r.checking ? '<span class="urltools-spinner"></span>' : this.formatStatus(r.status, r.error)}</td>
          <td class="urltools-td-time">${r.checking ? "-" : this.formatSize(r.size)}</td>
          <td class="urltools-td-url" title="${this.escHtml(r.url)}">${this.escHtml(r.url)}</td>
        </tr>`
        )
        .join("");

      // bind checkbox events
      tbody.querySelectorAll(".urltools-row-check").forEach((cb) => {
        cb.addEventListener("change", () => this.updateStats());
      });
    }

    updateRow(index) {
      const row = document.querySelector(`.urltools-row[data-index="${index}"]`);
      if (!row) return;
      const r = this.results[index];
      const cells = row.querySelectorAll("td");
      cells[1].innerHTML = this.formatStatus(r.status, r.error);
      cells[2].textContent = this.formatSize(r.size);
      const isAlive = r.status >= 200 && r.status < 400;
      const isDead = r.status >= 400 || r.error;
      row.classList.toggle("urltools-row-alive", isAlive);
      row.classList.toggle("urltools-row-dead", isDead);
    }

    formatStatus(status, error) {
      if (error) return `<span class="urltools-status urltools-status-error">ERR</span>`;
      if (!status) return `<span class="urltools-status urltools-status-unknown">-</span>`;
      let cls = "urltools-status-unknown";
      if (status >= 200 && status < 300) cls = "urltools-status-2xx";
      else if (status >= 300 && status < 400) cls = "urltools-status-3xx";
      else if (status >= 400 && status < 500) cls = "urltools-status-4xx";
      else if (status >= 500) cls = "urltools-status-5xx";
      return `<span class="urltools-status ${cls}">${status}</span>`;
    }

    updateProgress(done, total) {
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const fill = document.querySelector(".urltools-progress-fill");
      const text = document.getElementById("urltoolsProgressText");
      if (fill) fill.style.width = pct + "%";
      if (text) text.textContent = `${done}/${total}`;
    }

    updateStats() {
      const checks = document.querySelectorAll(".urltools-row-check");
      const total = checks.length;
      let alive = 0;
      let dead = 0;
      checks.forEach((cb) => {
        const i = parseInt(cb.dataset.index);
        const r = this.results[i];
        if (r) {
          if (r.status >= 200 && r.status < 400) alive++;
          else if (r.status >= 400 || r.error) dead++;
        }
      });
      const $ = (id) => document.getElementById(id);
      $("urltoolsTotal").textContent = total;
      $("urltoolsAlive").textContent = alive;
      $("urltoolsDead").textContent = dead;
    }

    toggleSelectAll() {
      const checks = document.querySelectorAll(".urltools-row-check");
      const allChecked = Array.from(checks).every((cb) => cb.checked);
      checks.forEach((cb) => (cb.checked = !allChecked));
      const master = document.getElementById("urltoolsCheckAll");
      if (master) master.checked = !allChecked;
      this.updateStats();
    }

    remove404() {
      const before = this.results.length;
      this.results = this.results.filter((r) => r.status !== 404);
      const removed = before - this.results.length;
      if (removed === 0) {
        this.showToast("没有404结果需要移除");
        return;
      }
      // re-index and re-render
      this.renderRows();
      this.updateStats();
      // sync textarea with remaining URLs
      const input = document.getElementById("urltoolsInput");
      if (input) input.value = this.results.map((r) => r.url).join("\n");
      this.showToast(`已移除 ${removed} 条404结果`);
    }

    async batchOpen() {
      const selected = [];
      document.querySelectorAll(".urltools-row-check:checked").forEach((cb) => {
        const i = parseInt(cb.dataset.index);
        if (this.results[i]?.url) selected.push(this.results[i].url);
      });
      if (!selected.length) {
        this.showToast("请先勾选要打开的URL");
        return;
      }
      // 分批打开标签页，避免浏览器卡死
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < selected.length; i++) {
        chrome.tabs.create({ url: selected[i], active: false });
        if (i < selected.length - 1) {
          await delay(BATCH_OPEN_DELAY);
        }
      }
      this.showToast(`已打开 ${selected.length} 个标签页`);
    }

    copyResults() {
      const lines = this.results
        .filter((r) => r.status !== null)
        .map((r) => {
          const status = r.error && r.status === 0 ? "ERR" : r.status;
          const size = this.formatSize(r.size);
          return `${status}\t${size}\t${r.url}`;
        });
      if (!lines.length) {
        this.showToast("没有可复制的结果");
        return;
      }
      const header = "状态\t响应大小\tURL";
      const text = header + "\n" + lines.join("\n");
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`已复制 ${lines.length} 条结果`);
      });
    }

    showToast(msg) {
      let toast = document.querySelector(".urltools-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "urltools-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("urltools-toast-show");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.remove("urltools-toast-show"), 2000);
    }

    formatSize(bytes) {
      if (bytes == null || bytes === 0) return "-";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    escHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }

    saveInput() {
      const input = document.getElementById("urltoolsInput");
      if (input) {
        chrome.storage.local.set({ urltools_input: input.value });
      }
    }

    restoreInput() {
      const input = document.getElementById("urltoolsInput");
      if (!input) return;
      chrome.storage.local.get("urltools_input", (data) => {
        if (data.urltools_input) {
          input.value = data.urltools_input;
        }
      });
    }
  }

  // Inject into page manager
  function inject() {
    const pm = window.__xuetongPM;
    if (!pm || !pm.pages) {
      setTimeout(inject, 50);
      return;
    }
    if (pm.pages.urltools) return; // already injected
    pm.pages.urltools = new UrlToolsPage();
  }

  // Start polling after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(inject, 100));
  } else {
    setTimeout(inject, 100);
  }
})();
