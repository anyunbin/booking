// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    showEditModal: false,
    showPasswordModal: false,
    isSubmitting: false,
    // 编辑个人信息
    editNickname: '',
    editName: '',
    editPhone: '',
    editEmail: '',
    // 修改密码
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.getUserInfo()
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      // 如果本地没有，从服务器获取
      this.fetchUserInfo()
    }
  },

  // 从服务器获取用户信息
  fetchUserInfo() {
    const userId = app.getUserId()
    if (!userId) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/users/${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const userInfo = res.data.data
          this.setData({ userInfo })
          // 更新全局数据
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
      }
    })
  },

  // 编辑个人信息
  editProfile() {
    const { userInfo } = this.data
    this.setData({
      showEditModal: true,
      editNickname: userInfo.nickname || '',
      editName: userInfo.name || '',
      editPhone: userInfo.phone || '',
      editEmail: userInfo.email || ''
    })
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 编辑表单输入
  onEditNicknameInput(e) {
    this.setData({ editNickname: e.detail.value })
  },

  onEditNameInput(e) {
    this.setData({ editName: e.detail.value })
  },

  onEditPhoneInput(e) {
    this.setData({ editPhone: e.detail.value })
  },

  onEditEmailInput(e) {
    this.setData({ editEmail: e.detail.value })
  },

  // 确认修改个人信息
  confirmEditProfile() {
    if (this.data.isSubmitting) {
      return
    }

    const { editNickname, editName, editPhone, editEmail } = this.data
    const userId = app.getUserId()

    this.setData({ isSubmitting: true })

    wx.request({
      url: `${app.globalData.apiBaseUrl}/users/${userId}`,
      method: 'PATCH',
      data: {
        nickname: editNickname,
        name: editName,
        phone: editPhone,
        email: editEmail
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
          
          // 更新本地用户信息
          const userInfo = { ...this.data.userInfo, ...res.data.data }
          this.setData({ userInfo })
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
          
          this.closeEditModal()
        } else {
          wx.showToast({
            title: res.data?.message || '修改失败',
            icon: 'none'
          })
        }
        this.setData({ isSubmitting: false })
      },
      fail: (err) => {
        console.error('修改用户信息失败:', err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        this.setData({ isSubmitting: false })
      }
    })
  },

  // 修改密码
  changePassword() {
    this.setData({
      showPasswordModal: true,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  },

  // 关闭密码弹窗
  closePasswordModal() {
    this.setData({ 
      showPasswordModal: false,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  },

  // 密码表单输入
  onOldPasswordInput(e) {
    this.setData({ oldPassword: e.detail.value })
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  // 确认修改密码
  confirmChangePassword() {
    if (this.data.isSubmitting) {
      return
    }

    const { oldPassword, newPassword, confirmPassword } = this.data

    // 验证输入
    if (!oldPassword) {
      wx.showToast({
        title: '请输入当前密码',
        icon: 'none'
      })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      wx.showToast({
        title: '新密码至少6个字符',
        icon: 'none'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmitting: true })

    const userId = app.getUserId()

    wx.request({
      url: `${app.globalData.apiBaseUrl}/auth/change-password`,
      method: 'POST',
      data: {
        userId: userId,
        oldPassword: oldPassword,
        newPassword: newPassword
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({
            title: '密码修改成功',
            icon: 'success'
          })
          this.closePasswordModal()
        } else {
          wx.showToast({
            title: res.data?.message || '密码修改失败',
            icon: 'none'
          })
        }
        this.setData({ isSubmitting: false })
      },
      fail: (err) => {
        console.error('修改密码失败:', err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        this.setData({ isSubmitting: false })
      }
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  }
})

