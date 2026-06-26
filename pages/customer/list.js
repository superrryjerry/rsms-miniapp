const app = getApp();
Page({
  data: { list: [], page: 1, total: 0, keyword: '', loading: false, noMore: false },
  onLoad() { this.loadData(); },
  onPullDownRefresh() { this.setData({ page: 1, list: [], noMore: false }); this.loadData(); },
  onReachBottom() { if (!this.data.noMore && !this.data.loading) { this.setData({ page: this.data.page + 1 }); this.loadData(); } },
  onSearch(e) { this.setData({ keyword: e.detail.value, page: 1, list: [], noMore: false }); this.loadData(); },
  async loadData() {
    this.setData({ loading: true });
    const res = await app.request({ url: '/customers/list', data: { page: this.data.page, size: 20, keyword: this.data.keyword } });
    if (res.code === 0) {
      const newList = this.data.page === 1 ? res.data.list : [...this.data.list, ...res.data.list];
      this.setData({ list: newList, total: res.data.total, noMore: newList.length >= res.data.total });
    }
    this.setData({ loading: false });
    wx.stopPullDownRefresh();
  },
  goDetail(e) { wx.navigateTo({ url: '/pages/customer/detail?name=' + encodeURIComponent(e.currentTarget.dataset.name) }); }
});
