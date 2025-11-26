// pages/guest/index/index.js
const app = getApp()

Page({
  data: {
    owners: []
  },

  onLoad() {
    this.loadOwners()
  },

  onShow() {
    this.loadOwners()
  },

  loadOwners() {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/owners`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            owners: res.data.data || []
          })
        }
      },
      fail: () => {
        const owners = wx.getStorageSync('guestOwners') || []
        this.setData({ owners })
      }
    })
  },

  goToAddOwner() {
    wx.navigateTo({
      url: '/pages/guest/addOwner/addOwner'
    })
  },

  selectOwner(e) {
    const ownerId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/guest/schedule/schedule?ownerId=${ownerId}`
    })
  }
})

