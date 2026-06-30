const app = getApp();
Page({
  data: { phone: '', password: '' },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }); },
  async onLogin() {
    const { phone, password } = this.data;
    if (!phone || !password) return wx.showToast({ title: '请输入账号和密码', icon: 'none' });
    wx.showLoading({ title: '登录中...' });
    try {
      const res = await app.request({ url: '/auth/login', method: 'POST', data: { phone, password, source: 'miniapp' } });
      wx.hideLoading();
      if (res.code === 0) {
        app.globalData.token = res.data.token;
        app.globalData.userInfo = res.data.user;
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        wx.showToast({ title: res.msg || '登录失败', icon: 'none' });
      }
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
  }
});
