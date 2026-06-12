// DOM观察器模块
class DOMObserver {
  constructor() {
    this.observer = null;
    this.scanTimeout = null;
    this.DEBOUNCE_DELAY = 1000;
  }

  start() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    const target = document.body || document.documentElement;
    if (target) {
      this.observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href'],
      });
      console.log('[Observer] DOM观察器已启动');
    }
  }

  handleMutations(mutations) {
    // 检查是否有新的iframe或重要DOM变化
    let hasImportantChanges = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IFRAME' || node.querySelector('iframe')) {
              hasImportantChanges = true;
              break;
            }
          }
        }
      }
      if (hasImportantChanges) break;
    }

    if (hasImportantChanges) {
      this.debounceScan();
    }
  }

  debounceScan() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    this.scanTimeout = setTimeout(() => {
      console.log('[Observer] DOM变化触发重新扫描');
      // 触发重新扫描
    }, this.DEBOUNCE_DELAY);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('[Observer] DOM观察器已停止');
    }
  }
}

module.exports = { DOMObserver };
