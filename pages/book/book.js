// pages/book/book.js
const app = getApp()

Page({
  data: {
    scheduleId: '',
    friendId: '',
    schedule: {},
    note: ''
  },

  onLoad(options) {
    const { scheduleId, friendId } = options
    this.setData({
      scheduleId,
      friendId
    })
    this.loadSchedule()
  },

  loadSchedule() {
    const { scheduleId } = this.data
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules/${scheduleId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            schedule: res.data.data
          })
        }
      },
      fail: () => {
        // 从本地存储加载
        const allSchedules = wx.getStorageSync('schedules') || []
        const schedule = allSchedules.find(s => s.id == scheduleId)
        if (schedule) {
          this.setData({ schedule })
        }
      }
    })
  },

  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    })
  },

  submitBooking() {
    const { scheduleId, friendId, note, schedule } = this.data
    
    if (schedule.status !== 'available') {
      wx.showToast({
        title: '该时间段不可预约',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    const bookingData = {
      scheduleId,
      friendId,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      note: note.trim()
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests`,
      method: 'POST',
      data: bookingData,
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '预约请求已提交',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        // 保存到本地存储
        const requests = wx.getStorageSync('requests') || []
        const newRequest = {
          id: Date.now(),
          ...bookingData,
          guestName: '我',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
        requests.push(newRequest)
        wx.setStorageSync('requests', requests)
        
        // 更新日程状态
        const allSchedules = wx.getStorageSync('schedules') || []
        const index = allSchedules.findIndex(s => s.id == scheduleId)
        if (index !== -1) {
          allSchedules[index].status = 'pending'
          wx.setStorageSync('schedules', allSchedules)
        }
        
        wx.showToast({
          title: '预约请求已提交',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
})

