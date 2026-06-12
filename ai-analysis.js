// ai-analysis.js - 信息搜集AI安全分析
console.log("[AI] ai-analysis.js loaded");
(function () {
  "use strict";
  console.log("[AI] IIFE executing");

  // Normalize endpoint URL: auto-handle whether user includes /v1 or not
  function buildApiUrl(endpoint, path) {
    let ep = endpoint.trim().replace(/\/+$/, "");
    if (/\/v1\/?$/.test(ep)) {
      ep = ep.replace(/\/v1\/?$/, "");
    }
    return `${ep}/v1/${path}`;
  }

  const CATEGORY_LABELS = {
    domains: "域名",
    routes: "页面路由",
    absoluteApis: "API接口(绝对路径)",
    apis: "API接口(相对路径)",
    moduleFiles: "模块路径",
    docFiles: "文档文件",
    credentials: "用户名密码",
    cookies: "Cookie",
    idKeys: "ID密钥",
    phones: "手机号码",
    emails: "邮箱",
    idcards: "身份证号",
    ips: "IP地址",
    companies: "公司机构",
    jwts: "JWT Token",
    windowsPaths: "Windows路径",
    githubUrls: "GitHub链接",
    jsFiles: "JS文件",
    thirdPartyLibs: "JS库",
    urls: "URL",
  };

  const SYSTEM_PROMPT = `你是一名资深Web安全工程师和渗透测试专家。用户会提供从目标网站收集到的信息（域名、API接口、JS文件、凭据、IP地址等），你需要从以下四个维度进行专业分析：

## 1. 安全风险识别
- 从收集的凭据、密钥、Token中识别信息泄露风险
- 从API端点判断是否存在未授权访问、越权风险
- 从JS文件路径和模块名推断可能存在的框架漏洞
- 识别敏感路径（管理后台、调试接口、Swagger文档等）

## 2. 攻击面分析
- 梳理外部可达的域名和IP资产
- 分析API接口的攻击面（参数注入、IDOR等）
- 从JS库版本推断已知CVE漏洞
- 识别潜在的SSRF、CORS配置不当等攻击向量

## 3. 信息整理归纳
- 按功能模块对API进行分类
- 关联域名、IP、API之间的映射关系
- 提炼关键业务逻辑和数据流
- 标注高价值目标（管理接口、认证接口、数据接口）

## 4. 渗透测试建议
- 针对发现的每个风险点给出具体的测试方法
- 推荐使用的工具和Payload
- 按优先级排列测试顺序
- 给出自动化测试脚本建议（如Fuzzing词典选择）

请使用Markdown格式输出，用emoji标注风险等级：🔴高危 🟡中危 🟢低危 🔵信息。输出要具体、可操作，避免泛泛而谈。`;

  class AIAnalysis {
    constructor() {
      this.isStreaming = false;
      this.abortController = null;
      this.savedResult = null;
      this._restoring = false;
    }

    init() {
      const existing = document.getElementById("aiAnalysisPanel");
      if (existing) {
        console.log("[AI] Panel already exists, skip init");
        return;
      }
      const scannerPage = document.querySelector(".scanner-page");
      if (!scannerPage) return;

      console.log("[AI] Creating panel, scanner children before:", scannerPage.children.length);
      this._createPanel(scannerPage);
      console.log("[AI] Panel created, scanner children after:", scannerPage.children.length);
      this._watchPanel(scannerPage);
    }

    _createPanel(scannerPage) {
      const panel = document.createElement("div");
      panel.id = "aiAnalysisPanel";
      panel.className = "ai-panel";
      panel.innerHTML = `
        <div class="ai-toolbar">
          <button id="aiAnalyzeBtn" class="ai-btn ai-btn-primary">AI 安全分析</button>
          <button id="aiStopBtn" class="ai-btn ai-btn-danger" style="display:none">停止</button>
          <span id="aiStatus" class="ai-status"></span>
        </div>
        <div id="aiResult" class="ai-result" style="display:none"></div>
      `;
      scannerPage.appendChild(panel);

      // Restore cached results
      if (this.savedResult) {
        const resultEl = document.getElementById("aiResult");
        resultEl.innerHTML = this.savedResult;
        resultEl.style.display = "block";
        console.log("[AI] Restored saved result, length:", this.savedResult.length);
      }

      document.getElementById("aiAnalyzeBtn").addEventListener("click", () => this.startAnalysis());
      document.getElementById("aiStopBtn").addEventListener("click", () => this.stopAnalysis());
    }

    _watchPanel(scannerPage) {
      // Watch for panel removal and auto-restore
      const mo = new MutationObserver((mutations) => {
        if (this._restoring) return;
        if (document.getElementById("aiAnalysisPanel")) return;
        // Debug: log what removed the panel
        for (const m of mutations) {
          for (const node of m.removedNodes) {
            if (node.id === "aiAnalysisPanel") {
              console.log("[AI] Panel removed directly");
            }
          }
        }
        console.log("[AI] Panel lost, remaining children:", Array.from(scannerPage.children).map(c => c.className || c.id));
        this._restoring = true;
        this._createPanel(scannerPage);
        this._restoring = false;
      });
      mo.observe(scannerPage, { childList: true });
    }

    async startAnalysis() {
      const results = window.__xuetongScannerResults;
      if (!results) {
        this.showToast("暂无扫描结果，请等待扫描完成");
        return;
      }

      // Load AI config
      const config = await this.loadConfig();
      if (!config.endpoint || !config.apiKey) {
        this.showToast("请先在配置页填写AI API地址和Key");
        return;
      }

      const prompt = this.buildPrompt(results);
      if (!prompt) {
        this.showToast("收集到的信息太少，无法进行分析");
        return;
      }

      this.isStreaming = true;
      this.abortController = new AbortController();

      const $ = (id) => document.getElementById(id);
      $("aiAnalyzeBtn").style.display = "none";
      $("aiStopBtn").style.display = "";
      $("aiStatus").textContent = "正在分析...";
      $("aiResult").style.display = "block";
      $("aiResult").innerHTML = '<div class="ai-loading"><span class="ai-spinner"></span> AI正在分析中...</div>';

      try {
        await this.callAPI(config, prompt, $("aiResult"));
      } catch (e) {
        if (e.name !== "AbortError") {
          $("aiResult").innerHTML = `<div class="ai-error">分析失败: ${this.escHtml(e.message)}</div>`;
        }
      } finally {
        this.isStreaming = false;
        $("aiAnalyzeBtn").style.display = "";
        $("aiStopBtn").style.display = "none";
        $("aiStatus").textContent = "";
      }
    }

    stopAnalysis() {
      this.isStreaming = false;
      this.abortController?.abort();
    }

    buildPrompt(results) {
      const sections = [];
      for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
        const data = results[key];
        if (data && Array.isArray(data) && data.length > 0) {
          const items = data.slice(0, 200).map((item) => {
            if (typeof item === "string") return item;
            if (item?.name) return item.name;
            if (item?.url) return item.url;
            return String(item);
          });
          sections.push(`### ${label} (${items.length}条)\n${items.join("\n")}`);
        }
      }
      if (sections.length === 0) return null;
      return `以下是目标网站的信息收集结果，请进行安全分析：\n\n${sections.join("\n\n")}`;
    }

    async loadConfig() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["aiEndpoint", "aiApiKey", "aiModel"], (data) => {
          resolve({
            endpoint: (data.aiEndpoint || "").trim().replace(/\/+$/, ""),
            apiKey: (data.aiApiKey || "").trim(),
            model: (data.aiModel || "").trim() || "gpt-4o-mini",
          });
        });
      });
    }

    async callAPI(config, prompt, resultEl) {
      const resp = await fetch(buildApiUrl(config.endpoint, "chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          stream: true,
          max_tokens: 4096,
          temperature: 0.3,
        }),
        signal: this.abortController.signal,
      });

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        throw new Error(`API请求失败: HTTP ${resp.status} ${errBody.slice(0, 200)}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              const html = this.renderMarkdown(fullText);
              resultEl.innerHTML = html;
              this.savedResult = html;
              resultEl.scrollTop = resultEl.scrollHeight;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (fullText) {
        resultEl.innerHTML = this.renderMarkdown(fullText);
        this.savedResult = resultEl.innerHTML;
      }
    }

    renderMarkdown(text) {
      let html = this.escHtml(text);

      // headers
      html = html.replace(/^#### (.+)$/gm, '<h5 class="ai-h5">$1</h5>');
      html = html.replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>');
      html = html.replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>');

      // bold and italic
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

      // inline code
      html = html.replace(/`([^`]+)`/g, '<code class="ai-code">$1</code>');

      // code blocks
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="ai-code-block"><code>$2</code></pre>');

      // unordered lists
      html = html.replace(/^[-*] (.+)$/gm, '<li class="ai-li">$1</li>');
      html = html.replace(/(<li class="ai-li">.*<\/li>\n?)+/g, (match) => `<ul class="ai-ul">${match}</ul>`);

      // ordered lists
      html = html.replace(/^\d+\. (.+)$/gm, '<li class="ai-li">$1</li>');

      // horizontal rule
      html = html.replace(/^---$/gm, '<hr class="ai-hr" />');

      // paragraphs (double newline)
      html = html.replace(/\n\n/g, '</p><p class="ai-p">');
      // single newline to <br>
      html = html.replace(/\n/g, "<br>");

      // wrap in paragraph
      html = `<p class="ai-p">${html}</p>`;

      return html;
    }

    escHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }

    showToast(msg) {
      let toast = document.querySelector(".urltools-toast") || document.querySelector(".ai-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "ai-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("urltools-toast-show");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.remove("urltools-toast-show"), 2000);
    }
  }

  const aiAnalysis = new AIAnalysis();

  function tryInit() {
    const scannerPage = document.querySelector(".scanner-page");
    console.log("[AI] tryInit called, scannerPage found:", !!scannerPage);
    if (scannerPage) {
      aiAnalysis.init();
    } else {
      setTimeout(tryInit, 200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("[AI] DOMContentLoaded fired, scheduling tryInit");
      setTimeout(tryInit, 300);
    });
  } else {
    console.log("[AI] DOM already ready, scheduling tryInit");
    setTimeout(tryInit, 300);
  }

  // Also re-init when scanner page becomes visible (tab switch)
  const observer = new MutationObserver(() => {
    const scannerPage = document.querySelector(".scanner-page");
    if (scannerPage && scannerPage.style.display !== "none") {
      aiAnalysis.init();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["style"] });

  // Config page: load and save AI settings
  function initConfig() {
    const endpoint = document.getElementById("aiEndpoint");
    const apiKey = document.getElementById("aiApiKey");
    const model = document.getElementById("aiModel");
    const modelSelect = document.getElementById("aiModelSelect");
    const saveBtn = document.getElementById("saveAiConfig");
    const verifyBtn = document.getElementById("aiVerifyBtn");
    const fetchModelsBtn = document.getElementById("aiFetchModels");
    const status = document.getElementById("aiConfigStatus");
    if (!endpoint || !saveBtn) {
      setTimeout(initConfig, 300);
      return;
    }

    // Load saved values
    chrome.storage.local.get(["aiEndpoint", "aiApiKey", "aiModel"], (data) => {
      if (data.aiEndpoint) endpoint.value = data.aiEndpoint;
      if (data.aiApiKey) apiKey.value = data.aiApiKey;
      if (data.aiModel) model.value = data.aiModel;
    });

    // Save config
    saveBtn.addEventListener("click", () => {
      chrome.storage.local.set(
        {
          aiEndpoint: endpoint.value.trim(),
          aiApiKey: apiKey.value.trim(),
          aiModel: model.value.trim(),
        },
        () => {
          status.textContent = "AI配置已保存";
          status.className = "fp-save-status";
          setTimeout(() => (status.textContent = ""), 2000);
        }
      );
    });

    // Verify API connection
    verifyBtn.addEventListener("click", async () => {
      const ep = endpoint.value.trim().replace(/\/+$/, "");
      const key = apiKey.value.trim();
      if (!ep || !key) {
        status.textContent = "请填写API地址和Key";
        status.className = "fp-save-status ai-status-error";
        return;
      }
      verifyBtn.disabled = true;
      verifyBtn.textContent = "验证中...";
      status.textContent = "";
      try {
        const resp = await fetch(buildApiUrl(ep, "models"), {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          status.textContent = "连接成功 (HTTP " + resp.status + ")";
          status.className = "fp-save-status ai-status-success";
        } else {
          const body = await resp.text().catch(() => "");
          status.textContent = "连接失败: HTTP " + resp.status + (body ? " - " + body.slice(0, 80) : "");
          status.className = "fp-save-status ai-status-error";
        }
      } catch (e) {
        status.textContent = "连接失败: " + (e.message || "网络错误");
        status.className = "fp-save-status ai-status-error";
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = "验证连接";
      }
    });

    // Fetch model list
    fetchModelsBtn.addEventListener("click", async () => {
      const ep = endpoint.value.trim().replace(/\/+$/, "");
      const key = apiKey.value.trim();
      if (!ep || !key) {
        status.textContent = "请填写API地址和Key";
        status.className = "fp-save-status ai-status-error";
        return;
      }
      fetchModelsBtn.disabled = true;
      fetchModelsBtn.textContent = "拉取中...";
      modelSelect.innerHTML = '<option value="">加载中...</option>';
      try {
        const resp = await fetch(buildApiUrl(ep, "models"), {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) {
          throw new Error("HTTP " + resp.status);
        }
        const data = await resp.json();
        const models = (data.data || data.models || [])
          .map((m) => m.id || m.name || m)
          .filter(Boolean)
          .sort();
        modelSelect.innerHTML = '<option value="">-- 选择模型 --</option>';
        for (const m of models) {
          const opt = document.createElement("option");
          opt.value = m;
          opt.textContent = m;
          modelSelect.appendChild(opt);
        }
        status.textContent = `拉取成功，共 ${models.length} 个模型`;
        status.className = "fp-save-status ai-status-success";
      } catch (e) {
        modelSelect.innerHTML = '<option value="">拉取失败</option>';
        status.textContent = "拉取失败: " + (e.message || "请求错误");
        status.className = "fp-save-status ai-status-error";
      } finally {
        fetchModelsBtn.disabled = false;
        fetchModelsBtn.textContent = "拉取模型";
      }
    });

    // Select model from dropdown -> fill input
    modelSelect.addEventListener("change", () => {
      if (modelSelect.value) {
        model.value = modelSelect.value;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initConfig, 300));
  } else {
    setTimeout(initConfig, 300);
  }
})();
