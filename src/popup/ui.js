// UI管理器模块
class UIManager {
  constructor() {
    this.currentPage = 'scanner';
    this.pages = new Map();
  }

  init() {
    console.log('[UI] 初始化UI管理器');
    this.setupNavigation();
    this.showPage('scanner');
  }

  setupNavigation() {
    // 设置导航事件
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        if (page) {
          this.showPage(page);
        }
      });
    });
  }

  showPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });

    // 显示目标页面
    const targetPage = document.querySelector(`.${pageName}-page`);
    if (targetPage) {
      targetPage.style.display = 'block';
      this.currentPage = pageName;
    }
  }

  updateResults(results) {
    // 更新扫描结果
    console.log('[UI] 更新结果:', results);
  }
}

module.exports = { UIManager };
