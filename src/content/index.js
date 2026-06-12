// Content Script - 雪瞳安全插件
// 主要功能：页面内容扫描、DOM监控

// 导入工具模块
const { Scanner } = require('./scanner');
const { DOMObserver } = require('./observer');

// 初始化扫描器
const scanner = new Scanner();

// 初始化DOM观察器
const observer = new DOMObserver();

// 页面加载完成后开始扫描
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    scanner.scan();
    observer.start();
  });
} else {
  scanner.scan();
  observer.start();
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    const results = scanner.scan();
    sendResponse({ results });
  }
  return true;
});

console.log('[Content] 雪瞳安全插件已加载');
