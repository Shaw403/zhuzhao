// Popup Script - 雪瞳安全插件
// 主要功能：用户界面交互、结果显示

// 导入工具模块
const { UIManager } = require('./ui');
const { MessageBridge } = require('./bridge');

// 初始化UI管理器
const uiManager = new UIManager();

// 初始化消息桥接
const messageBridge = new MessageBridge();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  uiManager.init();
  messageBridge.connect();
});

console.log('[Popup] 雪瞳安全插件弹出窗口已加载');
