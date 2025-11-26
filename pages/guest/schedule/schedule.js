// pages/guest/schedule/schedule.js
const app = getApp()

Page({
  data: {
    ownerId: '',
    ownerName: '',
    schedules: []
  },

  onLoad(options) {
    const ownerId = options.ownerId
    if (ownerId) {
      this.setData({ ownerId })
      this.loadOwnerInfo()
      this.loadSchedules()
    }
  },

  onShow() {
    this.loadSchedules()
  },

  loadOwnerInfo() {
    const { ownerId } = this.data
    wx.request({
      url: `${app.globalData.apiBaseUrl}/owners/${ownerId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            ownerName: res.data.data.name || `主人${ownerId}`
          })
        }
      },
      fail: () => {
        this.setData({
          ownerName: `主人${ownerId}`
        })
      }
    })
  },

  loadSchedules() {
    const { ownerId } = this.data
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules?ownerId=${ownerId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            schedules: this.groupSchedulesByDate(res.data.data || [])
          })
        }
      },
      fail: () => {
        // 从本地存储加载（实际应该从服务器获取）
        const allSchedules = wx.getStorageSync('schedules') || []
        const filtered = allSchedules.filter(s => s.status === 'available' || s.status === 'booked')
        this.setData({
          schedules: this.groupSchedulesByDate(filtered)
        })
      }
    })
  },

  groupSchedulesByDate(schedules) {
    const grouped = {}
    schedules.forEach(schedule => {
      const date = schedule.date
      if (!grouped[date]) {
        grouped[date] = { date, items: [] }
      }
      grouped[date].items.push(schedule)
    })
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  },

  bookSchedule(e) {
    const schedule = e.currentTarget.dataset.schedule
    
    if (schedule.status === 'booked' || schedule.status === 'pending') {
      wx.showToast({
        title: '该时间段不可预约',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/guest/book/book?scheduleId=${schedule.id}&ownerId=${this.data.ownerId}`
    })
  }
})

