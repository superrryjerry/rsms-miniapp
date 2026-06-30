const app = getApp();

Page({
  data: {
    dealerName: '',
    dealerCode: '',
    vehicleCount: 0,
    customerCount: 0,
    inactiveVehicleCount: 0,
    inactiveCustomerCount: 0
  },

  onLoad() {
    this.loadDashboard();
  },

  onPullDownRefresh() {
    this.loadDashboard().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadDashboard() {
    try {
      const res = await app.request({ url: '/dashboard' });
      if (res.code === 0) {
        const data = res.data;
        this.setData({
          dealerName: data.dealer_name,
          dealerCode: data.dealer_code,
          vehicleCount: data.vehicle_count,
          customerCount: data.customer_count,
          inactiveVehicleCount: data.inactive_vehicle_count,
          inactiveCustomerCount: data.inactive_customer_count
        });
      }
    } catch (e) {
      console.error('加载看板数据失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goVehicles() {
    wx.switchTab({ url: '/pages/vehicle/list' });
  },

  goCustomers() {
    wx.switchTab({ url: '/pages/customer/list' });
  },

  goInactiveVehicles() {
    wx.navigateTo({ url: '/pages/dashboard/inactive-vehicles' });
  },

  goInactiveCustomers() {
    wx.navigateTo({ url: '/pages/dashboard/inactive-customers' });
  }
});
