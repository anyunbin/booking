// pages/guest/addOwner/addOwner.js
const app = getApp()

Page({
  data: {
    method: 'id',
    ownerId: '',
    searchResult: null
  },

  onLoad() {},

  switchMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      method,
      searchResult: null,
      ownerId: ''
    })
  },

  onOwnerIdInput(e) {
    this.setData({
      ownerId: e.detail.value
    })
  },

  searchOwner() {
    const { ownerId } = this.data
    
    if (!ownerId.trim()) {
      wx.showToast({
        title: '请输入主人ID',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '搜索中...'
    })

    wx.request({
      url: `${app.globalData.apiBaseUrl}/owners/${ownerId}`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          this.setData({
            searchResult: res.data.data
          })
        } else {
          wx.showToast({
            title: res.data.message || '未找到该主人',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        // 模拟搜索结果
        this.setData({
          searchResult: {
            id: ownerId,
            name: `主人${ownerId}`
          }
        })
      }
    })
  },

  scanQRCode() {
    wx.scanCode({
      success: (res) => {
        const ownerId = res.result
        this.setData({ ownerId })
        this.searchOwner()
      },
      fail: () => {
        wx.showToast({
          title: '扫描失败',
          icon: 'none'
        })
      }
    })
  },

  addOwner() {
    const { searchResult } = this.data
    
    if (!searchResult) {
      return
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/owners/add`,
      method: 'POST',
      data: { ownerId: searchResult.id },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '添加失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        // 保存到本地存储
        const owners = wx.getStorageSync('guestOwners') || []
        if (!owners.find(o => o.id === searchResult.id)) {
          owners.push(searchResult)
          wx.setStorageSync('guestOwners', owners)
        }
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
})

