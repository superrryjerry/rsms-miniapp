const app = getApp();
Page({
  data: { userInfo: null },
  onShow() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({ userInfo });
    if (!userInfo) wx.redirectTo({ url: '/pages/login/login' });
  },
  goRequests() { wx.navigateTo({ url: '/pages/profile/requests' }); },
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = '';
          app.globalData.userInfo = null;
          wx.redirectTo({ url: '/pages/login/login' });
        }
      }
    });
  }
});
