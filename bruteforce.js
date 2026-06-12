// bruteforce.js - 登录暴力破解模块
(function () {
  "use strict";

  const DEFAULT_INTERVAL = 300; // 默认请求间隔(ms)
  const FETCH_TIMEOUT = 15000; // 单次请求超时(ms)

  // 常见 CSRF token 字段名
  const CSRF_FIELD_NAMES = [
    "csrf", "csrf_token", "csrf-token", "_token", "token",
    "__RequestVerificationToken", "antiforgery", "authenticity_token",
    "_csrf", "csrfmiddlewaretoken", "YII_CSRF_TOKEN", "yii_ csrf_token",
    "_csrf_token", "anticsrf", "__CSRFToken__", "csrf_value",
  ];

  // 登录失败关键词
  const FAIL_KEYWORDS = [
    "密码错误", "密码不正确", "用户名或密码", "账号或密码", "登录失败",
    "login fail", "invalid password", "invalid credentials", "authentication failed",
    "incorrect password", "wrong password", "用户名不存在", "账号不存在",
    "account not found", "user not found", "登录名或密码不正确",
    "请输入正确的密码", "密码有误", "用户名密码错误",
  ];

  // 登录成功关键词
  const SUCCESS_KEYWORDS = [
    "登录成功", "login success", "welcome", "dashboard", "欢迎",
    "控制台", "console", "管理后台", "admin panel",
  ];

  class BruteForcePage {
    constructor() {
      this.initialized = false;
      this.isRunning = false;
      this.credentials = [];
      this.results = [];
      this.formInfo = null;
      this.tabId = null;
      this.done = 0;
      this.total = 0;
      this.alive = 0;
      this.dead = 0;

      this.captchaSelector = null;
    }

    init() {
      if (this.initialized) return;
      const container = document.getElementById("bruteforceContainer");
      if (!container) return;
      this.container = container;
      this.render();
      this.bindEvents();
      this.restoreInput();
      this.checkRunning();
      this.initialized = true;
    }

    checkRunning() {
      chrome.runtime.sendMessage({ type: "GET_BRUTE_STATUS" }, (status) => {
        if (status && status.running) {
          // 爆破正在运行，恢复UI状态
          this.isRunning = true;
          this._lastResultCount = 0;
          document.getElementById("bfStart").style.display = "none";
          document.getElementById("bfStop").style.display = "";
          document.getElementById("bfProgress").style.display = "";
          document.getElementById("bfStats").style.display = "";
          document.getElementById("bfTableWrap").style.display = "";
          document.getElementById("bfDetect").disabled = true;
          document.getElementById("bfLoadDict").disabled = true;
          // 渲染已有结果
          if (status.results) {
            for (let i = 0; i < status.results.length; i++) {
              const r = status.results[i];
              this.appendResultRow(i, { username: r.username || "", password: r.password || "" }, r);
            }
            this._lastResultCount = status.results.length;
          }
          // 更新进度
          const pct = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;
          const fill = document.getElementById("bfProgressFill");
          const text = document.getElementById("bfProgressText");
          if (fill) fill.style.width = pct + "%";
          if (text) text.textContent = `${status.done}/${status.total}`;
          document.getElementById("bfStatTotal").textContent = status.done;
          document.getElementById("bfStatAlive").textContent = status.alive;
          document.getElementById("bfStatDead").textContent = status.dead;
          // 开始轮询
          this._pollInterval = setInterval(() => this.pollStatus(), 500);
        }
      });
    }

    render() {
      this.container.innerHTML = `
        <div class="bf-section">
          <div class="bf-panel">
            <div class="bf-panel-title">登录暴力破解</div>
            <div class="bf-form-info" id="bfFormInfo">
              <span class="bf-form-placeholder">点击「检测表单」自动识别当前页面的登录框</span>
            </div>
            <div id="bfApiOverride" style="display:none">
              <div class="bf-form-row" style="color:#2b8a3e;font-size:12px">✓ 前端模拟模式：填入表单 → 点击登录，自动绕过JS加密</div>
            </div>
            <div class="bf-toolbar">
              <button id="bfDetect" class="bf-btn bf-btn-primary">检测表单</button>
              <button id="bfDump" class="bf-btn bf-btn-secondary" title="查看页面所有input元素">诊断</button>
              <button id="bfStart" class="bf-btn bf-btn-success" disabled>开始爆破</button>
              <button id="bfStop" class="bf-btn bf-btn-danger" style="display:none">停止</button>
              <label class="bf-interval-label">
                间隔
                <input id="bfInterval" class="bf-interval-input" type="number" min="100" step="100" value="${DEFAULT_INTERVAL}" />ms
              </label>
            </div>
            <div style="display:flex;gap:8px">
              <label class="bf-field" style="flex:1">
                <span>用户名列表 <small style="color:#999">(每行一个)</small></span>
                <textarea id="bfUserList" class="bf-textarea" rows="3" placeholder="admin&#10;root&#10;test&#10;administrator"></textarea>
              </label>
              <label class="bf-field" style="flex:1">
                <span>密码列表 <small style="color:#999">(每行一个)</small></span>
                <textarea id="bfPassList" class="bf-textarea" rows="3" placeholder="123456&#10;admin&#10;root&#10;点击下方「加载字典」填充"></textarea>
              </label>
            </div>
            <div class="bf-toolbar" style="margin-bottom:8px">
              <button id="bfLoadUserDict" class="bf-btn bf-btn-secondary" title="导入常见用户名">导入用户名</button>
              <button id="bfLoadDict" class="bf-btn bf-btn-secondary">加载弱口令字典</button>
              <button id="bfGenerate" class="bf-btn bf-btn-primary">生成凭据组合</button>
              <span id="bfGenInfo" style="font-size:12px;color:#999;line-height:32px"></span>
            </div>
            <label class="bf-field">
              <span>凭据列表（每行：用户名\`密码）</span>
              <textarea id="bfCredInput" class="bf-textarea" placeholder="admin\`123456&#10;root\`root&#10;由「生成凭据组合」自动填充，也可手动编辑"></textarea>
            </label>
            <div id="bfProgress" class="bf-progress" style="display:none">
              <div class="bf-progress-bar"><div id="bfProgressFill" class="bf-progress-fill"></div></div>
              <span id="bfProgressText" class="bf-progress-text">0/0</span>
            </div>
            <div id="bfStats" class="bf-stats" style="display:none">
              <span class="bf-stat">尝试: <strong id="bfStatTotal">0</strong></span>
              <span class="bf-stat bf-stat-success">成功: <strong id="bfStatAlive">0</strong></span>
              <span class="bf-stat bf-stat-error">失败: <strong id="bfStatDead">0</strong></span>
            </div>
          </div>
          <div id="bfTableWrap" class="bf-table-wrap" style="display:none">
            <table class="bf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>用户名</th>
                  <th>密码</th>
                  <th>状态</th>
                  <th>响应</th>
                </tr>
              </thead>
              <tbody id="bfTbody"></tbody>
            </table>
          </div>
        </div>
      `;
    }

    bindEvents() {
      document.getElementById("bfDetect")?.addEventListener("click", () => this.detectForm());
      document.getElementById("bfDump")?.addEventListener("click", () => this.dumpInputs());
      document.getElementById("bfLoadDict")?.addEventListener("click", () => this.loadWeakPass());
      document.getElementById("bfLoadUserDict")?.addEventListener("click", () => this.loadUserDict());
      document.getElementById("bfGenerate")?.addEventListener("click", () => this.generateCreds());
      document.getElementById("bfStart")?.addEventListener("click", () => this.startBrute());
      document.getElementById("bfStop")?.addEventListener("click", () => this.stopBrute());
      document.getElementById("bfCredInput")?.addEventListener("input", () => this.saveInput());
      document.getElementById("bfUserList")?.addEventListener("input", () => this.saveInput());
      document.getElementById("bfPassList")?.addEventListener("input", () => this.saveInput());
      document.getElementById("bfInterval")?.addEventListener("change", () => this.saveInput());
    }

    // --- 表单检测 ---
    async detectForm() {
      this.showToast("正在检测登录表单...");
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          this.showToast("无法获取当前标签页");
          return;
        }
        this.tabId = tab.id;

        // 先尝试主Frame
        let resp = await this._sendToFrame(tab.id, 0);

        // 如果主Frame未找到，遍历所有子Frame
        if (!resp || !resp.found) {
          try {
            const frames = await new Promise(r => chrome.webNavigation.getAllFrames({ tabId: tab.id }, r));
            if (frames) {
              for (const frame of frames) {
                if (frame.frameId === 0) continue;
                const fr = await this._sendToFrame(tab.id, frame.frameId);
                if (fr && fr.found) { resp = fr; break; }
              }
            }
          } catch (e) { /* 子Frame探测失败，使用主Frame结果 */ }
        }

        if (!resp || !resp.found) {
          this.showFormInfo(null);
          if (resp && resp.debugInputs && resp.debugInputs.length) {
            var types = resp.debugInputs.map(function(x){return x.tagName+"[type="+(x.type||"无")+"] name="+x.name+" id="+x.id+" autocomplete="+x.autocomplete+" class="+x.className}).join("\n");
            console.warn("[xuetong:bf] 页面上找到的input元素:\n"+types);
            this.showToast("未检测到登录表单 (已找到"+resp.debugInputs.length+"个input,查看F12控制台)");
          } else {
            this.showToast("未检测到登录表单 (页面无任何input元素?)");
          }
          return;
        }

        this.formInfo = resp;
        this.showFormInfo(resp);
        this.showToast("检测到登录表单");
        document.getElementById("bfStart").disabled = false;
      } catch (e) {
        this.showToast("检测失败: " + e.message);
      }
    }

    _sendToFrame(tabId, frameId) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: "DETECT_LOGIN_FORM" }, { frameId }, (r) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(r || null);
        });
      });
    }

    // --- 页面诊断：dump所有input元素 ---
    async dumpInputs() {
      this.showToast("正在诊断页面...");
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) { this.showToast("无法获取当前标签页"); return; }
        const resp = await new Promise(r => {
          chrome.tabs.sendMessage(tab.id, { type: "DUMP_INPUTS" }, (res) => {
            if (chrome.runtime.lastError) r(null); else r(res || null);
          });
        });
        if (!resp) { this.showToast("诊断失败: content script未响应"); return; }
        console.table(resp.inputs);
        var msg = "共 "+resp.count+" 个input, password类型: "+(resp.hasPasswordType?"有":"无")+" | 详情见F12控制台";
        this.showToast(msg);
        // 同时更新 form info 区域显示诊断摘要
        var el = document.getElementById("bfFormInfo");
        if (el) {
          var types={};
          resp.inputs.forEach(function(x){var t=x.type||"无";types[t]=(types[t]||0)+1});
          var lines=Object.keys(types).map(function(t){return "<span class='bf-stat'>type=<b>"+t+"</b>: "+types[t]+"个</span>"});
          el.innerHTML='<div class="bf-form-row"><span class="bf-form-label">诊断结果:</span> 共<b>'+resp.count+'</b>个input</div>'
            +'<div class="bf-form-row">'+lines.join(" ")+'</div>'
            +'<div class="bf-form-row" style="font-size:11px;color:#999">完整信息已输出到F12控制台 (console.table)</div>';
        }
      } catch(e) { this.showToast("诊断异常: "+e.message); }
    }

    showFormInfo(info) {
      const el = document.getElementById("bfFormInfo");
      const apiOverride = document.getElementById("bfApiOverride");
      if (!el) return;
      if (!info) {
        el.innerHTML = '<span class="bf-form-placeholder">未检测到登录表单</span>';
        if (apiOverride) apiOverride.style.display = "none";
        return;
      }
      // SPA应用时显示API覆盖区域
      if (apiOverride) apiOverride.style.display = info.isApiSubmit ? "" : "none";
      el.innerHTML = `
        <div class="bf-form-row"><span class="bf-form-label">Action:</span> <code>${this.escHtml(info.action || "(当前页面)")}</code></div>
        <div class="bf-form-row"><span class="bf-form-label">Method:</span> <code>${this.escHtml((info.method || "POST").toUpperCase())}</code></div>
        <div class="bf-form-row"><span class="bf-form-label">用户名:</span> <code>${this.escHtml(info.usernameField || "?")}</code></div>
        <div class="bf-form-row"><span class="bf-form-label">密码:</span> <code>${this.escHtml(info.passwordField || "?")}</code></div>
        ${info.csrfField ? `<div class="bf-form-row"><span class="bf-form-label">CSRF:</span> <code>${this.escHtml(info.csrfField)}</code></div>` : ""}
        ${info.captchaField ? `<div class="bf-form-row"><span class="bf-form-label">验证码:</span> <code>${this.escHtml(info.captchaField)}</code> <span style="color:#2b8a3e;font-size:11px">✓ 已检测到</span></div>` : ""}
        ${info.isApiSubmit ? `<div class="bf-form-row"><span class="bf-form-label">提交方式:</span> <code>JSON API</code> <span style="color:#e67700;font-size:11px">⚠ SPA应用，请确认API端点</span></div>` : ""}
        ${info.hiddenFields?.length ? `<div class="bf-form-row"><span class="bf-form-label">隐藏字段:</span> <code>${info.hiddenFields.map(f => f.name).join(", ")}</code></div>` : ""}
      `;
    }

    // --- 加载字典 ---
    async loadWeakPass() {
      this.showToast("正在加载弱口令字典...");
      try {
        const resp = await fetch(chrome.runtime.getURL("WeakPass.yaml"));
        const text = await resp.text();
        const entries = this.parseWeakPassYaml(text);
        // 去重提取密码列表
        const passSet = new Set();
        entries.forEach(e => { if (e.password) passSet.add(e.password); });
        document.getElementById("bfPassList").value = Array.from(passSet).join("\n");
        this.saveInput();
        this.showToast(`已加载 ${passSet.size} 条密码`);
      } catch (e) {
        this.showToast("加载字典失败: " + e.message);
      }
    }

    // --- 导入常见用户名 ---
    loadUserDict() {
      const defaultUsers = [
        "admin", "root", "test", "guest", "user", "administrator",
        "sa", "mysql", "oracle", "postgres", "ftp", "www",
        "web", "system", "manager", "super", "master",
        "hfish", "tomcat", "nginx", "apache", "deploy",
        "jenkins", "gitlab", "redis", "mongo", "elastic"
      ];
      document.getElementById("bfUserList").value = defaultUsers.join("\n");
      this.showToast(`已导入 ${defaultUsers.length} 个常见用户名`);
    }

    // --- 生成凭据组合 ---
    generateCreds() {
      const userText = document.getElementById("bfUserList")?.value || "";
      const passText = document.getElementById("bfPassList")?.value || "";
      const users = userText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const passes = passText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (!users.length) { this.showToast("请先填写用户名列表"); return; }
      if (!passes.length) { this.showToast("请先填写密码列表或加载字典"); return; }
      const creds = [];
      for (const u of users) {
        for (const p of passes) {
          creds.push(`${u}\`${p}`);
        }
      }
      document.getElementById("bfCredInput").value = creds.join("\n");
      this.saveInput();
      const info = document.getElementById("bfGenInfo");
      if (info) info.textContent = `${users.length} 用户 × ${passes.length} 密码 = ${creds.length} 组合`;
      this.showToast(`已生成 ${creds.length} 组凭据`);
    }

    parseWeakPassYaml(text) {
      return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && line.includes("`"))
        .map(line => {
          const parts = line.split("`");
          return {
            vendor: (parts[0] || "").trim(),
            username: (parts[1] || "").trim(),
            password: parts.slice(2).join("`").trim(),
          };
        })
        .filter(item => item.username || item.password)
        .filter(item => item.username !== "<blank>" && item.password !== "<blank>");
    }

    // --- 凭据解析 ---
    parseCredentials(text) {
      return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && line.includes("`"))
        .map(line => {
          const idx = line.indexOf("`");
          return {
            username: line.substring(0, idx).trim(),
            password: line.substring(idx + 1).trim(),
          };
        })
        .filter(c => c.username || c.password);
    }

    // --- 爆破控制 ---
    async startBrute() {
      if (!this.formInfo) {
        this.showToast("请先检测表单");
        return;
      }

      const credText = document.getElementById("bfCredInput")?.value || "";
      this.credentials = this.parseCredentials(credText);
      if (!this.credentials.length) {
        this.showToast("请输入至少一组凭据");
        return;
      }

      this.isRunning = true;
      this._lastResultCount = 0;

      // UI 切换
      document.getElementById("bfStart").style.display = "none";
      document.getElementById("bfStop").style.display = "";
      document.getElementById("bfProgress").style.display = "";
      document.getElementById("bfStats").style.display = "";
      document.getElementById("bfTableWrap").style.display = "";
      document.getElementById("bfTbody").innerHTML = "";
      document.getElementById("bfDetect").disabled = true;
      document.getElementById("bfLoadDict").disabled = true;

      const interval = parseInt(document.getElementById("bfInterval")?.value) || DEFAULT_INTERVAL;

      // 发送到background运行（popup关闭不会停）
      chrome.runtime.sendMessage({
        type: "START_BRUTE",
        credentials: this.credentials,
        formInfo: this.formInfo,
        interval: interval
      });

      // 轮询状态
      this._pollInterval = setInterval(() => this.pollStatus(), 500);
    }

    pollStatus() {
      chrome.runtime.sendMessage({ type: "GET_BRUTE_STATUS" }, (status) => {
        if (!status) return;
        // 更新进度
        const fill = document.getElementById("bfProgressFill");
        const text = document.getElementById("bfProgressText");
        const pct = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;
        if (fill) fill.style.width = pct + "%";
        if (text) text.textContent = `${status.done}/${status.total}`;
        document.getElementById("bfStatTotal").textContent = status.done;
        document.getElementById("bfStatAlive").textContent = status.alive;
        document.getElementById("bfStatDead").textContent = status.dead;
        // 渲染新结果
        if (status.results && status.results.length > this._lastResultCount) {
          for (let i = this._lastResultCount; i < status.results.length; i++) {
            const r = status.results[i];
            this.appendResultRow(i, { username: r.username || "", password: r.password || "" }, r);
          }
          this._lastResultCount = status.results.length;
        }
        // 完成
        if (!status.running && status.done >= status.total) {
          this.stopUI();
          this.showToast(status.alive > 0 ? `🎉 爆破完成: 发现 ${status.alive} 组成功凭据` : `爆破完成: ${status.dead} 组全部失败`);
        }
      });
    }

    stopBrute() {
      chrome.runtime.sendMessage({ type: "STOP_BRUTE" });
      this.stopUI();
      this.showToast("已停止");
    }

    stopUI() {
      this.isRunning = false;
      if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
      document.getElementById("bfStart").style.display = "";
      document.getElementById("bfStop").style.display = "none";
      document.getElementById("bfDetect").disabled = false;
      document.getElementById("bfLoadDict").disabled = false;
    }

    async attemptLogin(cred, index) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: null, message: "超时" });
        }, FETCH_TIMEOUT);

        chrome.runtime.sendMessage(
          {
            type: "LOGIN_BRUTE_ATTEMPT",
            formInfo: this._activeFormInfo || this.formInfo,
            credential: cred,
            index,
          },
          (resp) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError || !resp) {
              resolve({ success: null, message: "请求失败" });
            } else {
              resolve(resp);
            }
          }
        );
      });
    }

    // --- 结果展示 ---
    appendResultRow(index, cred, result) {
      const tbody = document.getElementById("bfTbody");
      if (!tbody) return;
      const tr = document.createElement("tr");
      let statusHtml, msgHtml;
      if (result.success === true) {
        statusHtml = '<span class="bf-status bf-status-success">成功</span>';
        msgHtml = this.escHtml(result.message || "登录成功");
      } else if (result.success === false) {
        statusHtml = '<span class="bf-status bf-status-fail">失败</span>';
        msgHtml = this.escHtml(result.message || "");
      } else {
        statusHtml = '<span class="bf-status bf-status-unknown">未知</span>';
        msgHtml = this.escHtml(result.message || "");
      }
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${this.escHtml(cred.username)}</td>
        <td>${this.escHtml(cred.password)}</td>
        <td>${statusHtml}</td>
        <td>${msgHtml}</td>
      `;
      tbody.appendChild(tr);
      // 滚动到底部
      tr.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    updateProgress() {
      const pct = this.total > 0 ? Math.round((this.done / this.total) * 100) : 0;
      const fill = document.getElementById("bfProgressFill");
      const text = document.getElementById("bfProgressText");
      if (fill) fill.style.width = pct + "%";
      if (text) text.textContent = `${this.done}/${this.total}`;
      const el = (id) => document.getElementById(id);
      if (el("bfStatTotal")) el("bfStatTotal").textContent = this.done;
      if (el("bfStatAlive")) el("bfStatAlive").textContent = this.alive;
      if (el("bfStatDead")) el("bfStatDead").textContent = this.dead;
    }

    // --- 工具方法 ---
    delay(ms) {
      return new Promise(r => setTimeout(r, ms));
    }

    escHtml(s) {
      const d = document.createElement("div");
      d.textContent = s || "";
      return d.innerHTML;
    }

    showToast(msg) {
      let toast = document.querySelector(".bf-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "bf-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("bf-toast-show");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.remove("bf-toast-show"), 2000);
    }

    saveInput() {
      chrome.storage.local.set({
        bf_creds: document.getElementById("bfCredInput")?.value || "",
        bf_users: document.getElementById("bfUserList")?.value || "",
        bf_passes: document.getElementById("bfPassList")?.value || "",
        bf_interval: document.getElementById("bfInterval")?.value || DEFAULT_INTERVAL,
      });
    }

    restoreInput() {
      chrome.storage.local.get(["bf_creds", "bf_users", "bf_passes", "bf_interval"], (data) => {
        if (data.bf_creds) document.getElementById("bfCredInput").value = data.bf_creds;
        if (data.bf_users) document.getElementById("bfUserList").value = data.bf_users;
        if (data.bf_passes) document.getElementById("bfPassList").value = data.bf_passes;
        if (data.bf_interval) document.getElementById("bfInterval").value = data.bf_interval;
      });
    }

    // --- OCR 验证码识别（通过ddddocr本地服务） ---
    async recognizeCaptcha(base64) {
      // 图片预处理：灰度化 + 二值化，提高验证码识别率
      const processed = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const val = gray > 140 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
      });
      // 调用ddddocr服务识别
      const resp = await fetch("http://127.0.0.1:19876/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: processed }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      return (data.text || "").trim().replace(/[^a-zA-Z0-9]/g, "");
    }
  }

  // 暴露给 WeakPassPage 使用
  const bf = new BruteForcePage();
  window.__xuetongBruteForce = bf;

  // 监听 background 发来的验证码 OCR 请求
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "CAPTCHA_OCR" && msg.imageBase64) {
      bf.recognizeCaptcha(msg.imageBase64)
        .then((text) => sendResponse({ text }))
        .catch((e) => sendResponse({ text: "", error: e.message }));
      return true; // 异步响应
    }
  });
})();
