const app = getApp();

Page({
  data: {
    list: []
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await app.request({ url: '/dashboard/inactive-vehicles' });
      if (res.code === 0) {
        this.setData({ list: res.data });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});
