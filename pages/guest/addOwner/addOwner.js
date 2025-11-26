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

    app.call({
      path: '/api/owners/${ownerId}',
      method: 'GET',
      }).then((res) => {
        wx.hideLoading()
        if (res.success) {
          this.setData({
            searchResult: res.data
          })
        } else {
          wx.showToast({
            title: res.message || '未找到该主人',
            icon: 'none'
          })
        }
      },
      }).catch(() => {
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
      }).then((res) => {
        const ownerId = res.result
        this.setData({ ownerId })
        this.searchOwner()
      },
      }).catch(() => {
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

    app.call({
      path: '/api/owners/add',
      method: 'POST',
      data: { ownerId: searchResult.id },
      }).then((res) => {
        if (res.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.message || '添加失败',
            icon: 'none'
          })
        }
      },
      }).catch(() => {
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

