// Background Service Worker - 雪瞳安全插件
// 主要功能：指纹识别、请求拦截、消息处理

// 导入工具模块
const { FingerPrintDetector } = require('./fingerprint');
const { MessageHandler } = require('./messages');

// 初始化指纹检测器
const fingerprintDetector = new FingerPrintDetector();

// 初始化消息处理器
const messageHandler = new MessageHandler();

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] 雪瞳安全插件已安装');
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('[Background] 标签页更新:', tab.url);
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageHandler.handle(message, sender, sendResponse);
  return true; // 保持消息通道开放
});

console.log('[Background] 服务工作者已启动');
