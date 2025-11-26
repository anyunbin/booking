// app.js
App({
  async onLaunch() {
    // 初始化微信云托管
    try {
      wx.cloud.init()
      console.log('微信云托管初始化成功')
    } catch (e) {
      console.error('微信云托管初始化失败:', e)
    }

    // 初始化API配置
    this.globalData = {
      userId: null,
      userInfo: null,
      token: null,
      // 云托管环境配置
      cloudEnv: 'prod-0gn9dgzia67371b0', // 替换为你的云托管环境ID
      cloudService: 'express-iayq', // 替换为你的服务名称
      // 备用：公网访问地址（如果云调用失败）
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
  },

  /**
   * 微信云托管调用方法（推荐使用）
   * 优势：不需要配置合法域名，走内网，性能更好
   * @param {Object} options - 请求配置
   * @param {string} options.path - 请求路径，如 '/auth/login'
   * @param {string} options.method - HTTP 方法，默认 'GET'
   * @param {Object} options.data - 请求数据
   * @param {Object} options.header - 请求头
   * @returns {Promise} 返回响应数据
   */
  async callCloud(options = {}) {
    const that = this
    const { path = '/', method = 'GET', data = {}, header = {} } = options

    try {
      // 确保云托管已初始化
      if (!that.cloud) {
        that.cloud = wx.cloud
      }

      const result = await that.cloud.callContainer({
        config: {
          env: that.globalData.cloudEnv
        },
        path: path,
        method: method,
        data: data,
        header: {
          'X-WX-SERVICE': that.globalData.cloudService,
          'Content-Type': 'application/json',
          ...header
        }
      })

      console.log(`云托管调用成功 [${method} ${path}]`, result)
      return result.data
    } catch (e) {
      console.error(`云托管调用失败 [${method} ${path}]:`, e)
      throw new Error(`云托管调用失败: ${e.message}`)
    }
  },

  /**
   * 备用方法：使用公网访问（如果云调用失败）
   * @param {Object} options - 请求配置
   * @returns {Promise} 返回响应数据
   */
  async callPublic(options = {}) {
    const that = this
    const { path = '/', method = 'GET', data = {}, header = {} } = options
    const url = that.globalData.apiBaseUrl + path

    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success: (res) => {
          console.log(`公网调用响应 [${method} ${path}] 状态码: ${res.statusCode}`, res.data)

          // 注意：wx.request 的 success 回调在网络请求成功时触发，
          // 无论 HTTP 状态码是什么（包括 401、500 等）
          // 所以这里直接返回响应数据，让调用者处理业务逻辑
          resolve(res.data)
        },
        fail: (err) => {
          console.error(`公网调用失败 [${method} ${path}]:`, err)
          reject(err)
        }
      })
    })
  },

  /**
   * 智能调用方法：根据环境选择调用方式
   * 开发版/预览版：优先使用云调用，失败时降级到公网
   * 体验版/正式版：直接使用公网访问（云调用在体验版可能有权限限制）
   * @param {Object} options - 请求配置
   * @returns {Promise} 返回响应数据
   */
  async call(options = {}) {
    const that = this

    // 获取当前环境信息
    const accountInfo = wx.getAccountInfoSync()
    const envVersion = accountInfo.miniProgram.envVersion // develop/trial/release

    console.log('当前环境:', envVersion)

    // 体验版和正式版使用公网访问（云调用可能有权限限制）
    if (envVersion === 'trial' || envVersion === 'release') {
      console.log('体验版/正式版：使用公网访问')
      return await that.callPublic(options)
    }

    // 开发版和预览版优先使用云调用
    try {
      console.log('开发版/预览版：优先使用云调用')
      return await that.callCloud(options)
    } catch (e) {
      console.warn('云调用失败，自动降级到公网访问:', e.message)
      try {
        // 降级到公网访问
        return await that.callPublic(options)
      } catch (err) {
        console.error('公网访问也失败了:', err)
        throw err
      }
    }
  }
})

