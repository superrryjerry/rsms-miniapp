const app = getApp();
Page({
  data: { activity: null },
  onLoad(opts) { this.activityId = opts.id; this.loadDetail(); },
  async loadDetail() {
    const res = await app.request({ url: '/activities/list', data: { page: 1, size: 100 } });
    if (res.code === 0) {
      const item = res.data.list.find(a => a.id == this.activityId);
      if (item) {
        item.photos = JSON.parse(item.photos || '[]');
        this.setData({ activity: item });
      }
    }
  },
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.activity.photos });
  },
  goEdit() {
    wx.navigateTo({ url: '/pages/activity/create?id=' + this.activityId });
  },
  onDelete() {
    const name = this.data.activity.customer_name;
    wx.showModal({
      title: '确认删除',
      content: `确认删除「${name}」的销售活动记录？此操作不可撤销。`,
      success: async (res) => {
        if (res.confirm) {
          const res = await app.request({ url: '/activities/' + this.activityId, method: 'DELETE' });
          wx.showToast({ title: res.msg || '删除成功', icon: res.code === 0 ? 'success' : 'none' });
          if (res.code === 0) setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});
