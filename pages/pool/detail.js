const app = getApp();
Page({
  data: { vehicle: null },
  onLoad(opts) { this.vin = opts.vin; this.loadDetail(); },
  async loadDetail() {
    const res = await app.request({ url: '/pool/list', data: { keyword: this.vin, page: 1, size: 1 } });
    if (res.code === 0 && res.data.list.length > 0) {
      this.setData({ vehicle: res.data.list[0] });
    }
  }
});
