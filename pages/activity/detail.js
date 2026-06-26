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
  }
});
