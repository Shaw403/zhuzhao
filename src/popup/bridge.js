// 消息桥接模块
class MessageBridge {
  constructor() {
    this.isConnected = false;
  }

  connect() {
    console.log('[Bridge] 连接消息桥接');
    this.isConnected = true;
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  handleMessage(message, sender, sendResponse) {
    console.log('[Bridge] 收到消息:', message.type);
    switch (message.type) {
      case 'SCAN_UPDATE':
        this.handleScanUpdate(message);
        break;
      case 'SCAN_COMPLETE':
        this.handleScanComplete(message);
        break;
      default:
        console.log('[Bridge] 未知消息类型:', message.type);
    }
  }

  handleScanUpdate(message) {
    // 处理扫描更新
    console.log('[Bridge] 扫描更新:', message);
  }

  handleScanComplete(message) {
    // 处理扫描完成
    console.log('[Bridge] 扫描完成:', message);
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }
}

module.exports = { MessageBridge };
