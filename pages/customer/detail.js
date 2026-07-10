const app = getApp();
Page({
  data: { customer: null, vehicles: [], contracts: [], workOrders: [], activities: [], canAddActivity: false, activeTab: 'info', totalAnnualIncome: 0 },
  onLoad(opts) { this.customerName = decodeURIComponent(opts.name); this.loadDetail(); },
  async loadDetail() {
      const res = await app.request({ url: '/customers/detail/' + encodeURIComponent(this.customerName) });
      if (res.code === 0) {
        // 格式化年总收入，因为 WXML 不支持 .toFixed()
        const totalIncome = res.data.total_annual_income || 0;
        const totalIncomeDisplay = totalIncome > 0 ? totalIncome.toFixed(2) + ' 元' : '0 元';
        this.setData({ customer: res.data, vehicles: res.data.vehicles, contracts: res.data.contracts, workOrders: res.data.work_orders, activities: res.data.activities, canAddActivity: res.data.can_add_activity, totalAnnualIncome: totalIncome, totalAnnualIncomeDisplay: totalIncomeDisplay });
      }
    },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },
  goVehicle(e) { wx.navigateTo({ url: '/pages/vehicle/detail?vin=' + e.currentTarget.dataset.vin }); },
  goAddActivity() { wx.navigateTo({ url: '/pages/activity/create?customer=' + encodeURIComponent(this.customerName) }); },
  goActivityDetail(e) { wx.navigateTo({ url: '/pages/activity/detail?id=' + e.currentTarget.dataset.id }); }
});
