const app = getApp();
Page({
  data: {
    customer_name: '', visit_purpose: '', visit_method: 'phone', visit_location: '',
    location_lat: '', location_lng: '', visit_time: '', content: '', photos: [],
    methods: ['电话', '微信', '线下'], methodValues: ['phone', 'wechat', 'offline'], methodIndex: 0,
    isEdit: false, activityId: null
  },
  onLoad(opts) {
    if (opts.customer) this.setData({ customer_name: decodeURIComponent(opts.customer) });
    if (opts.id) { this.setData({ isEdit: true, activityId: opts.id }); this.loadActivity(opts.id); }
  },
  async loadActivity(id) {
    // 通过列表接口获取单条（简化处理）
    const res = await app.request({ url: '/activities/list', data: { page: 1, size: 100 } });
    if (res.code === 0) {
      const item = res.data.list.find(a => a.id == id);
      if (item) {
        const mi = this.data.methodValues.indexOf(item.visit_method);
        this.setData({
          customer_name: item.customer_name, visit_purpose: item.visit_purpose || '',
          visit_method: item.visit_method, methodIndex: mi >= 0 ? mi : 0,
          visit_location: item.visit_location || '', visit_time: item.visit_time || '',
          content: item.content || '', photos: JSON.parse(item.photos || '[]')
        });
      }
    }
  },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }); },
  onMethodChange(e) { this.setData({ methodIndex: e.detail.value, visit_method: this.data.methodValues[e.detail.value] }); },
  onDateChange(e) { this.setData({ visit_time: e.detail.value }); },
  getLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          visit_location: res.address || res.name || '',
          location_lat: res.latitude,
          location_lng: res.longitude
        });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('auth') > -1) {
          wx.showToast({ title: '请允许定位权限', icon: 'none' });
        } else if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
          // 用户主动取消，不提示
        } else {
          wx.showToast({ title: '定位失败，请检查权限', icon: 'none' });
        }
      }
    });
  },
  choosePhoto() {
    const remaining = 9 - this.data.photos.length;
    if (remaining <= 0) return wx.showToast({ title: '最多9张照片', icon: 'none' });
    wx.chooseImage({
      count: remaining, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });
        for (const path of res.tempFilePaths) {
          const uploadRes = await app.uploadFile(path);
          if (uploadRes.code === 0) this.setData({ photos: [...this.data.photos, uploadRes.data.url] });
        }
        wx.hideLoading();
      }
    });
  },
  removePhoto(e) {
    const idx = e.currentTarget.dataset.index;
    const photos = [...this.data.photos];
    photos.splice(idx, 1);
    this.setData({ photos });
  },
  async saveDraft() { await this.submit('draft'); },
  async saveComplete() { await this.submit('completed'); },
  async submit(status) {
    if (!this.data.customer_name) return wx.showToast({ title: '请选择客户', icon: 'none' });
    wx.showLoading({ title: '保存中...' });
    const data = { ...this.data, status };
    delete data.methods; delete data.methodValues; delete data.methodIndex; delete data.isEdit; delete data.activityId;
    const url = this.data.isEdit ? '/activities/update/' + this.data.activityId : '/activities/create';
    const res = await app.request({ url, method: 'POST', data });
    wx.hideLoading();
    wx.showToast({ title: res.msg || '保存成功', icon: res.code === 0 ? 'success' : 'none' });
    if (res.code === 0) setTimeout(() => wx.navigateBack(), 1500);
  }
});
