const app = getApp();
Page({
  data: {
    customer_name: '',
    city: '',
    registration_info: '',
    submitting: false
  },
  onNameInput(e) { this.setData({ customer_name: e.detail.value }); },
  onCityInput(e) { this.setData({ city: e.detail.value }); },
  onRegInput(e) { this.setData({ registration_info: e.detail.value }); },

  async onSubmit() {
    const { customer_name, city, registration_info } = this.data;
    
    if (!customer_name.trim()) {
      wx.showToast({ title: '请输入客户名称', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await app.request({
        url: '/customers/create',
        method: 'POST',
        data: {
          customer_name: customer_name.trim(),
          city: city.trim() || null,
          registration_info: registration_info.trim() || null
        }
      });

      if (res.code === 0) {
        wx.showToast({ title: '新增成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: res.msg || '新增失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '请求失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
