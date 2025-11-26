// pages/owner/index/index.js
Page({
  data: {},

  onLoad() {},

  goToTimeSlots() {
    wx.navigateTo({
      url: '/pages/owner/timeSlots/timeSlots'
    })
  },

  goToSchedule() {
    wx.navigateTo({
      url: '/pages/owner/schedule/schedule'
    })
  },

  goToRequests() {
    wx.navigateTo({
      url: '/pages/owner/requests/requests'
    })
  }
})

