// RSMS 小程序入口
App({
  globalData: {
    // 环境配置：根据微信小程序环境自动切换
    // 开发环境使用服务器IP，体验版和正式版必须用HTTPS域名
    envConfig: {
      develop: 'http://47.116.124.189/api',   // 开发版(开发工具，可用HTTP)
      trial: 'https://scaniavehicle.cheeringtech.cn/api',      // 体验版(必须HTTPS)
      release: 'https://scaniavehicle.cheeringtech.cn/api'     // 正式版(必须HTTPS)
    },
    baseUrl: '',
    token: '',
    userInfo: null
  },

  onLaunch() {
    // 根据小程序运行环境选择 baseUrl
    const env = wx.getAccountInfoSync?.()?.miniProgram?.envVersion || 'develop';
    this.globalData.baseUrl = this.globalData.envConfig[env] || this.globalData.envConfig.develop;

    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    } else {
      // 没有登录信息，跳转到登录页
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  // 全局请求封装
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (this.globalData.token || '')
        },
        success: (res) => {
          if (res.data.code == 401) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            this.globalData.token = '';
            this.globalData.userInfo = null;
            wx.redirectTo({ url: '/pages/login/login' });
            return reject(new Error('未登录'));
          }
          resolve(res.data);
        },
        fail: reject
      });
    });
  },

  // 上传文件
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.globalData.baseUrl + '/activities/upload',
        filePath,
        name: 'file',
        header: { 'Authorization': 'Bearer ' + this.globalData.token },
        success: (res) => {
          try {
            resolve(JSON.parse(res.data));
          } catch (e) {
            reject(new Error('解析上传响应失败'));
          }
        },
        fail: reject
      });
    });
  }
});