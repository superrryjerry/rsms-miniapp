Page({
  data: {
    vin: '',
    vehicle: null,
    contracts: [],
    workOrders: [],
    serviceHistory: [],
    loading: true
  },

  onLoad(options) {
    this.setData({ vin: options.vin });
    this.loadDetail();
  },

  async loadDetail() {
    const app = getApp();
    try {
      const res = await app.request({ url: '/pool/detail/' + this.data.vin });
      if (res.code === 0) {
        this.setData({
          vehicle: res.data,
          contracts: res.data.contracts || [],
          workOrders: res.data.workOrders || [],
          serviceHistory: res.data.serviceHistory || [],
          loading: false
        });
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (e) {
      wx.showToast({ title: '网络错误', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onClaim() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    wx.showModal({
      title: '确认认领',
      content: '确定要认领这辆车作为您的服务车辆吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '认领中...' });
          try {
            const result = await app.request({
              url: '/pool/claim',
              method: 'POST',
              data: {
                vin: this.data.vin,
                service_dealer: userInfo.dealer_code
              }
            });
            wx.hideLoading();
            if (result.code === 0) {
              wx.showToast({ title: '认领成功', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            } else {
              wx.showToast({ title: result.msg || '认领失败', icon: 'none' });
            }
          } catch (e) {
            wx.hideLoading();
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  }
});
