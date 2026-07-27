const app = getApp();
Page({
  data: { vehicle: null, contracts: [], workOrders: [], permission: 'readonly', activeTab: 'info', showApplyModal: false, showTransferModal: false, showChangeCustomerModal: false, dealers: [], applyReason: '', transferTarget: '', transferReason: '', newCustomerName: '', changeCustomerReason: '' },
  onLoad(opts) { this.vin = opts.vin; this.loadDetail(); },
  onShow() { this.loadDetail(); },
  async loadDetail() {
      const res = await app.request({ url: '/vehicles/detail/' + this.vin });
      if (res.code === 0) {
        // 格式化年总收入，因为 WXML 不支持 .toFixed()
        if (res.data.annual_income != null) {
          res.data.annual_income_display = res.data.annual_income.toFixed(2) + ' 元';
        } else {
          res.data.annual_income_display = '-';
        }
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
    const res = await app.request({ url: '/vehicles/dealer-list' });
    if (res.code === 0) {
      this.setData({ dealers: res.data.filter(d => d.dealer_code !== this.data.vehicle.service_dealer), showTransferModal: true });
    } else {
      wx.showToast({ title: res.msg || '获取经销商列表失败', icon: 'none' });
    }
  },
  hideTransfer() { this.setData({ showTransferModal: false, transferTarget: '', transferReason: '' }); },
  onTransferTarget(e) {
    const idx = e.detail.value;
    const dealer = this.data.dealers[idx];
    this.setData({ transferTarget: dealer ? dealer.dealer_code : '', transferTargetName: dealer ? dealer.dealer_name : '' });
  },
  onTransferReason(e) { this.setData({ transferReason: e.detail.value }); },
  async submitTransfer() {
    if (!this.data.transferTarget) return wx.showToast({ title: '请选择目标经销商', icon: 'none' });
    const res = await app.request({ url: '/vehicles/transfer', method: 'POST', data: { vin: this.vin, target_dealer: this.data.transferTarget, reason: this.data.transferReason } });
    wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
    this.hideTransfer();
  },
  // 更改客户名称
  showChangeCustomer() { this.setData({ showChangeCustomerModal: true }); },
  hideChangeCustomer() { this.setData({ showChangeCustomerModal: false, newCustomerName: '', changeCustomerReason: '' }); },
  onNewCustomerInput(e) { this.setData({ newCustomerName: e.detail.value }); },
  onChangeCustomerReason(e) { this.setData({ changeCustomerReason: e.detail.value }); },
  async submitChangeCustomer() {
    if (!this.data.newCustomerName.trim()) return wx.showToast({ title: '请输入新客户名称', icon: 'none' });
    const res = await app.request({ url: '/vehicles/change-customer', method: 'POST', data: { vin: this.vin, new_customer_name: this.data.newCustomerName.trim(), reason: this.data.changeCustomerReason } });
    wx.showToast({ title: res.msg, icon: res.code === 0 ? 'success' : 'none' });
    if (res.code === 0) { this.hideChangeCustomer(); this.loadDetail(); }
  }
});
