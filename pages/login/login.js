// pages/login/login.js
const app = getApp()

Page({
  data: {
    isLogin: true, // true: 登录模式, false: 注册模式
    isSubmitting: false,
    // 登录表单
    loginUsername: '',
    loginPassword: '',
    // 注册表单
    registerUsername: '',
    registerPassword: '',
    registerPasswordConfirm: '',
    registerNickname: ''
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

  // 切换到登录
  switchToLogin() {
    this.setData({ isLogin: true })
  },

  // 切换到注册
  switchToRegister() {
    this.setData({ isLogin: false })
  },

  // 登录表单输入
  onLoginUsernameInput(e) {
    this.setData({ loginUsername: e.detail.value })
  },

  onLoginPasswordInput(e) {
    this.setData({ loginPassword: e.detail.value })
  },

  // 注册表单输入
  onRegisterUsernameInput(e) {
    this.setData({ registerUsername: e.detail.value })
  },

  onRegisterPasswordInput(e) {
    this.setData({ registerPassword: e.detail.value })
  },

  onRegisterPasswordConfirmInput(e) {
    this.setData({ registerPasswordConfirm: e.detail.value })
  },

  onRegisterNicknameInput(e) {
    this.setData({ registerNickname: e.detail.value })
  },

  // 处理登录
  async handleLogin() {
    const { loginUsername, loginPassword } = this.data

    if (!loginUsername || !loginPassword) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      console.log('开始登录请求...')
      const result = await app.call({
        path: '/api/auth/login',
        method: 'POST',
        data: {
          username: loginUsername,
          password: loginPassword
        }
      })

      console.log('登录响应:', result)

      if (result && result.success) {
        const { userInfo, token } = result.data

        // 保存用户信息和token
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('token', token)
        wx.setStorageSync('userId', userInfo.id)

        // 更新全局数据
        app.globalData.userInfo = userInfo
        app.globalData.userId = userInfo.id
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
      console.error('登录请求失败:', err)
      wx.showToast({
        title: '网络错误，请检查连接',
        icon: 'none'
      })
      this.setData({ isSubmitting: false })
    }
  },

  // 处理注册
  async handleRegister() {
    const { registerUsername, registerPassword, registerPasswordConfirm, registerNickname } = this.data

    // 验证输入
    if (!registerUsername || registerUsername.length < 3 || registerUsername.length > 20) {
      wx.showToast({
        title: '用户名长度为3-20个字符',
        icon: 'none'
      })
      return
    }

    if (!registerPassword || registerPassword.length < 6) {
      wx.showToast({
        title: '密码至少6个字符',
        icon: 'none'
      })
      return
    }

    if (registerPassword !== registerPasswordConfirm) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      console.log('开始注册请求...')
      const result = await app.call({
        path: '/api/auth/register',
        method: 'POST',
        data: {
          username: registerUsername,
          password: registerPassword,
          nickname: registerNickname || registerUsername
        }
      })

      console.log('注册响应:', result)

      if (result && result.success) {
        wx.showToast({
          title: '注册成功，请登录',
          icon: 'success'
        })

        // 切换到登录模式
        this.setData({
          isLogin: true,
          loginUsername: registerUsername,
          loginPassword: '',
          registerUsername: '',
          registerPassword: '',
          registerPasswordConfirm: '',
          registerNickname: ''
        })
      } else {
        wx.showToast({
          title: result?.message || '注册失败',
          icon: 'none'
        })
      }
      this.setData({ isSubmitting: false })
    } catch (err) {
      console.error('注册请求失败:', err)
      wx.showToast({
        title: '网络错误，请检查连接',
        icon: 'none'
      })
      this.setData({ isSubmitting: false })
    }
  }
})

