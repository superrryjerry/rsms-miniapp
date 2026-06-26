const app = getApp();
const leadTypes = [
  { value: '', label: '全部' },
  { value: 'warranty_end', label: '质保结束' },
  { value: 'contract_time', label: '合同时间' },
  { value: 'contract_mileage', label: '合同里程' },
  { value: 'contract_count', label: '合同次数' }
];
Page({
  data: { list: [], page: 1, total: 0, loading: false, noMore: false, leadTypes, currentType: '', typeIndex: 0 },
  onLoad() { this.loadData(); },
  onPullDownRefresh() { this.setData({ page: 1, list: [], noMore: false }); this.loadData(); },
  onReachBottom() { if (!this.data.noMore) { this.setData({ page: this.data.page + 1 }); this.loadData(); } },
  onTypeChange(e) {
    const idx = e.detail.value;
    this.setData({ typeIndex: idx, currentType: leadTypes[idx].value, page: 1, list: [], noMore: false });
    this.loadData();
  },
  async loadData() {
    this.setData({ loading: true });
    const params = { page: this.data.page, size: 20 };
    if (this.data.currentType) params.lead_type = this.data.currentType;
    const res = await app.request({ url: '/leads/list', data: params });
    if (res.code === 0) {
      const newList = this.data.page === 1 ? res.data.list : [...this.data.list, ...res.data.list];
      this.setData({ list: newList, total: res.data.total, noMore: newList.length >= res.data.total });
    }
    this.setData({ loading: false });
    wx.stopPullDownRefresh();
  },
  async markRead(e) {
    const id = e.currentTarget.dataset.id;
    await app.request({ url: '/leads/' + id + '/read', method: 'POST' });
    this.setData({ page: 1, list: [], noMore: false }); this.loadData();
  },
  async markHandled(e) {
    const id = e.currentTarget.dataset.id;
    await app.request({ url: '/leads/' + id + '/handle', method: 'POST' });
    this.setData({ page: 1, list: [], noMore: false }); this.loadData();
  },
  goVehicle(e) { wx.navigateTo({ url: '/pages/vehicle/detail?vin=' + e.currentTarget.dataset.vin }); }
});
