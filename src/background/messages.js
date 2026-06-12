// 消息处理模块
class MessageHandler {
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  registerDefaultHandlers() {
    // 注册默认消息处理器
    this.handlers.set('PING', this.handlePing.bind(this));
    this.handlers.set('GET_FINGERPRINTS', this.handleGetFingerprints.bind(this));
  }

  handle(message, sender, sendResponse) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message, sender, sendResponse);
    } else {
      console.warn('[MessageHandler] 未知消息类型:', message.type);
      sendResponse({ error: 'Unknown message type' });
    }
  }

  handlePing(message, sender, sendResponse) {
    sendResponse({ pong: true });
  }

  handleGetFingerprints(message, sender, sendResponse) {
    // 返回指纹数据
    sendResponse({ fingerprints: [] });
  }
}

module.exports = { MessageHandler };
