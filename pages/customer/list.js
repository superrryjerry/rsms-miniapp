const app = getApp();
Page({
  data: {
    list: [], page: 1, total: 0, keyword: '', loading: false, noMore: false,
    tagOptions: [
      { label: '无标签', value: '' },
      { label: '🟢 核心', value: 'core' },
      { label: '🟠 焦点', value: 'focus' },
      { label: '🟡 绿洲', value: 'oasis' },
      { label: '🔴 沙漠', value: 'desert' }
    ],
    tagIndexMap: { '': 0, core: 1, focus: 2, oasis: 3, desert: 4 }
  },
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
  async onTagChange(e) {
    const idx = e.currentTarget.dataset.index;
    const customerName = e.currentTarget.dataset.name;
    const tagIdx = e.detail.value;
    const tagValue = this.data.tagOptions[tagIdx].value;
    
    try {
      const res = await app.request({
        url: '/customers/tag',
        method: 'PUT',
        data: { customer_name: customerName, tag: tagValue }
      });
      if (res.code === 0) {
        // 更新本地数据
        const key = `list[${idx}].my_tag`;
        this.setData({ [key]: tagValue || null });
        wx.showToast({ title: '标签已更新', icon: 'success' });
      }
    } catch (err) {
      wx.showToast({ title: '更新失败', icon: 'error' });
    }
  },
  goDetail(e) { wx.navigateTo({ url: '/pages/customer/detail?name=' + encodeURIComponent(e.currentTarget.dataset.name) }); },
  goAdd() { wx.navigateTo({ url: '/pages/customer/add' }); }
});
