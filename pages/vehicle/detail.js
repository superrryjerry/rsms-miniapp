const app = getApp();
Page({
  data: { vehicle: null, contracts: [], workOrders: [], permission: 'readonly', activeTab: 'info', showApplyModal: false, showTransferModal: false, dealers: [], applyReason: '', transferTarget: '', transferReason: '' },
  onLoad(opts) { this.vin = opts.vin; this.loadDetail(); },
  onShow() { this.loadDetail(); },
  async loadDetail() {
    const res = await app.request({ url: '/vehicles/detail/' + this.vin });
    if (res.code === 0) {
      this.setData({ vehicle: res.data, contracts: res.data.contracts, workOrders: res.data.work_orders, permission: res.data.permission });
    }
  },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },
  // 丢公海池
  onDrop() {
    wx.showModal({
      title: '确认丢公海池',
      content: '该操作将把车辆退回公海池，确定继续？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          const res = await app.request({ url: '/vehicles/drop', method: 'POST', data: { vin: this.vin } });
          wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
          if (res.code === 0) setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  },
  // 申请成为服务经销商
  showApply() { this.setData({ showApplyModal: true }); },
  hideApply() { this.setData({ showApplyModal: false, applyReason: '' }); },
  onApplyInput(e) { this.setData({ applyReason: e.detail.value }); },
  async submitApply() {
    const res = await app.request({ url: '/vehicles/apply', method: 'POST', data: { vin: this.vin, reason: this.data.applyReason } });
    wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
    this.hideApply();
  },
  // 转移服务经销商
  async showTransfer() {
    const res = await app.request({ url: '/admin/dealers' });
    if (res.code === 0) this.setData({ dealers: res.data.filter(d => d.dealer_code !== this.data.vehicle.service_dealer), showTransferModal: true });
  },
  hideTransfer() { this.setData({ showTransferModal: false, transferTarget: '', transferReason: '' }); },
  onTransferTarget(e) { this.setData({ transferTarget: e.detail.value }); },
  onTransferReason(e) { this.setData({ transferReason: e.detail.value }); },
  async submitTransfer() {
    if (!this.data.transferTarget) return wx.showToast({ title: '请选择目标经销商', icon: 'none' });
    const res = await app.request({ url: '/vehicles/transfer', method: 'POST', data: { vin: this.vin, target_dealer: this.data.transferTarget, reason: this.data.transferReason } });
    wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
    this.hideTransfer();
  }
});
