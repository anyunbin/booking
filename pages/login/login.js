// pages/login/login.js
const app = getApp()

Page({
  data: {
    isSubmitting: false,
    userInfo: null,
    hasUserInfo: false
  },

  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    
    if (userInfo && token) {
      // 已登录，跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }
  },

  // 微信登录
  async handleWechatLogin() {
    this.setData({ isSubmitting: true })

    try {
      // 1. 获取用户信息
      const userProfile = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善会员资料',
          success: resolve,
          fail: reject
        })
      })

      const userInfo = userProfile.userInfo

      // 2. 获取登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      const code = loginRes.code

      console.log('获取到登录凭证:', code)
      console.log('用户信息:', userInfo)

      // 3. 发送到后端进行登录
      const result = await app.call({
        path: '/api/auth/wechat-login',
        method: 'POST',
        data: {
          code: code,
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
            province: userInfo.province,
            city: userInfo.city,
            country: userInfo.country
          }
        }
      })

      console.log('登录响应:', result)

      if (result && result.success) {
        const { userInfo: backendUserInfo, token } = result.data

        // 保存用户信息和token
        wx.setStorageSync('userInfo', backendUserInfo)
        wx.setStorageSync('token', token)
        wx.setStorageSync('userId', backendUserInfo.id)

        // 更新全局数据
        app.globalData.userInfo = backendUserInfo
        app.globalData.userId = backendUserInfo.id
        app.globalData.token = token

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: result?.message || '登录失败',
          icon: 'none'
        })
        this.setData({ isSubmitting: false })
      }
    } catch (err) {
      console.error('登录失败:', err)

      // 判断是否是用户取消授权
      if (err.errMsg && err.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showToast({
          title: '您已取消授权，无法登录',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }

      this.setData({ isSubmitting: false })
    }
  }
})

