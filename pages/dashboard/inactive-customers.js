const app = getApp();

Page({
  data: {
    list: [],
    tagMap: {
      'core': '核心',
      'focus': '重点',
      'oasis': '绿洲',
      'desert': '沙漠'
    }
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await app.request({ url: '/dashboard/inactive-customers' });
      if (res.code === 0) {
        this.setData({ list: res.data });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  goDetail(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({ url: `/pages/customer/detail?name=${encodeURIComponent(name)}` });
  }
});
