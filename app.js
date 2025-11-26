// app.js
App({
  onLaunch() {
    // 初始化API配置
    this.globalData = {
      userId: null,
      userInfo: null,
      token: null,
      apiBaseUrl: 'https://express-iayq-202839-6-1388611962.sh.run.tcloudbase.com/api'
    }
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    const userId = wx.getStorageSync('userId')

    if (userInfo && token && userId) {
      // 已登录，设置全局数据
      this.globalData.userInfo = userInfo
      this.globalData.token = token
      this.globalData.userId = userId
    } else {
      // 未登录，跳转到登录页
      // 延迟执行，确保页面已加载
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }, 100)
    }
  },

  // 获取用户ID
  getUserId() {
    if (!this.globalData.userId) {
      const userId = wx.getStorageSync('userId')
      if (userId) {
        this.globalData.userId = userId
      }
    }
    return this.globalData.userId
  },

  // 获取用户信息
  getUserInfo() {
    if (!this.globalData.userInfo) {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    }
    return this.globalData.userInfo
  },

  // 获取token
  getToken() {
    if (!this.globalData.token) {
      const token = wx.getStorageSync('token')
      if (token) {
        this.globalData.token = token
      }
    }
    return this.globalData.token
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    wx.removeStorageSync('userId')
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.userId = null
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }
})

