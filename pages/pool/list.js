const app = getApp();
Page({
  data: { list: [], page: 1, total: 0, keyword: '', loading: false, noMore: false },
  onLoad() { this.loadData(); },
  onPullDownRefresh() { this.setData({ page: 1, list: [], noMore: false }); this.loadData(); },
  onReachBottom() { if (!this.data.noMore) { this.setData({ page: this.data.page + 1 }); this.loadData(); } },
  onSearch(e) { this.setData({ keyword: e.detail.value, page: 1, list: [], noMore: false }); this.loadData(); },
  async loadData() {
    this.setData({ loading: true });
    const res = await app.request({ url: '/pool/list', data: { page: this.data.page, size: 20, keyword: this.data.keyword } });
    if (res.code === 0) {
      const newList = this.data.page === 1 ? res.data.list : [...this.data.list, ...res.data.list];
      this.setData({ list: newList, total: res.data.total, noMore: newList.length >= res.data.total });
    }
    this.setData({ loading: false });
    wx.stopPullDownRefresh();
  },
  goDetail(e) { wx.navigateTo({ url: '/pages/pool/detail?vin=' + e.currentTarget.dataset.vin }); },
  onClaim(e) {
    const vin = e.currentTarget.dataset.vin;
    const userInfo = app.globalData.userInfo;
    wx.showModal({
      title: '确认认领',
      content: `确认认领该车辆？服务经销商默认为 ${userInfo.dealer_code}`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          const res = await app.request({ url: '/pool/claim', method: 'POST', data: { vin, service_dealer: userInfo.dealer_code } });
          wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
          if (res.code === 0) { this.setData({ page: 1, list: [], noMore: false }); this.loadData(); }
        }
      }
    });
  }
});
