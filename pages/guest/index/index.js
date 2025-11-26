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
    app.call({
      path: '/api/owners',
      method: 'GET',
      }).then((res) => {
        if (res.success) {
          this.setData({
            owners: res.data || []
          })
        }
      },
      }).catch(() => {
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

