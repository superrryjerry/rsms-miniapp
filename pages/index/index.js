const app = getApp();
Page({
  data: {
    userInfo: null,
    unreadLeads: 0,
    quickEntries: [
      { name: '公海池', icon: '🌊', url: '/pages/pool/list' },
      { name: '线索', icon: '🔔', url: '/pages/lead/list' },
      { name: '车辆', icon: '🚗', url: '/pages/vehicle/list' },
      { name: '客户', icon: '👤', url: '/pages/customer/list' },
      { name: '销售活动', icon: '📋', url: '/pages/activity/list' }
    ]
  },
  onShow() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({ userInfo });
    if (!userInfo) { wx.redirectTo({ url: '/pages/login/login' }); return; }
    this.loadUnreadLeads();
  },
  async loadUnreadLeads() {
    try {
      const res = await app.request({ url: '/leads/unread-count' });
      if (res.code === 0) this.setData({ unreadLeads: res.data.count });
    } catch (e) {}
  },
  goPage(e) {
    const url = e.currentTarget.dataset.url;
    // tabBar页面需要用switchTab
    const tabBarPages = ['/pages/index/index', '/pages/vehicle/list', '/pages/customer/list', '/pages/mine/mine'];
    if (tabBarPages.includes(url)) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  }
});
