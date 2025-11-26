// pages/index/index.js
Page({
  data: {},

  onLoad() {},

  goToScheduleTable() {
    wx.navigateTo({
      url: '/pages/scheduleTable/scheduleTable'
    })
  },

  goToFriends() {
    wx.navigateTo({
      url: '/pages/friends/friends'
    })
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  }
})
