const app = getApp();
Page({
  data: { list: [] },
  onLoad() { this.loadData(); },
  async loadData() {
    const res = await app.request({ url: '/vehicles/my-requests' });
    if (res.code === 0) this.setData({ list: res.data });
  }
});
