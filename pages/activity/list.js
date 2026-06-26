const app = getApp();
Page({
  data: { list: [], page: 1, total: 0, loading: false, noMore: false },
  onShow() { this.setData({ page: 1, list: [], noMore: false }); this.loadData(); },
  onReachBottom() { if (!this.data.noMore) { this.setData({ page: this.data.page + 1 }); this.loadData(); } },
  async loadData() {
    this.setData({ loading: true });
    const res = await app.request({ url: '/activities/list', data: { page: this.data.page, size: 20 } });
    if (res.code === 0) {
      const newList = this.data.page === 1 ? res.data.list : [...this.data.list, ...res.data.list];
      this.setData({ list: newList, total: res.data.total, noMore: newList.length >= res.data.total });
    }
    this.setData({ loading: false });
  },
  goCreate() { wx.navigateTo({ url: '/pages/activity/create' }); },
  goDetail(e) { wx.navigateTo({ url: '/pages/activity/detail?id=' + e.currentTarget.dataset.id }); }
});
