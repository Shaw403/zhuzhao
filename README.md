# 烛照 (Zhuzhao)

> 以一烛之光，照见隐秘

一款用于网页敏感信息检测、指纹识别的 Chrome 浏览器扩展，基于 [SnowEyes](https://github.com/SickleSec/SnowEyes) 项目二次开发。

## ✨ 功能特性

- 🔍 **指纹识别** - 识别目标网站使用的 CMS、框架、中间件等技术栈
- 🔑 **敏感信息检测** - 自动检测页面中的 API Key、密码、身份证号、手机号等敏感信息
- 🤖 **AI 智能分析** - 集成 AI 接口辅助安全分析
- 📊 **URL 工具集** - URL 编解码、路径分析等实用工具
- 🔐 **暴力破解辅助** - 弱口令字典与爆破辅助功能
- 📝 **验证码识别** - 集成 OCR 验证码自动识别

## 📦 安装方式

### 开发者模式安装

1. 克隆本仓库
   ```bash
   git clone https://github.com/YOUR_USERNAME/zhuzhao.git
   ```
2. 安装依赖并构建
   ```bash
   npm install
   npm run build
   ```
3. 打开 Chrome，访问 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」，选择项目的 `dist` 目录（或项目根目录）

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化自动构建）
npm run dev

# 生产构建
npm run build
```

## 📁 项目结构

```
├── background.js          # Service Worker 后台脚本
├── content.js             # Content Script 注入脚本
├── popup.html/js/css      # 弹出窗口界面
├── ai-analysis.js         # AI 分析模块
├── bruteforce.js          # 暴力破解模块
├── urltools.js            # URL 工具模块
├── captcha_server.py      # 验证码识别服务（需本地运行）
├── finger*.json           # 指纹数据库
├── WeakPass.yaml          # 弱口令字典
├── src/                   # 源码目录
│   ├── background/        # 后台模块源码
│   ├── content/           # 内容脚本源码
│   ├── popup/             # 弹窗源码
│   └── utils/             # 工具函数
└── lib/                   # 第三方库（Tesseract OCR）
```

## 🔧 验证码识别服务

验证码识别功能需要本地运行 Python 服务：

```bash
# 安装依赖
pip3 install ddddocr

# 启动服务
python3 captcha_server.py
```

服务默认监听 `http://127.0.0.1:19876`。

## 🙏 致谢

- [SnowEyes](https://github.com/SickleSec/SnowEyes) - 原始项目

## 📄 License

本项目仅供学习和授权安全测试使用。使用者应遵守当地法律法规，对使用本工具造成的任何后果自行承担责任。
