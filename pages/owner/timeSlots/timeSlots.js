// pages/owner/timeSlots/timeSlots.js
const app = getApp()

Page({
  data: {
    timeSlots: [],
    startTime: '',
    endTime: ''
  },

  onLoad() {
    this.loadTimeSlots()
  },

  loadTimeSlots() {
    // 从服务器加载时间单元
    wx.request({
      url: `${app.globalData.apiBaseUrl}/time-slots`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            timeSlots: res.data.data || []
          })
        }
      },
      fail: () => {
        // 如果服务器未启动，使用本地存储
        const slots = wx.getStorageSync('timeSlots') || []
        this.setData({ timeSlots: slots })
      }
    })
  },

  onStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value
    })
  },

  onEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value
    })
  },

  addTimeSlot() {
    const { startTime, endTime, timeSlots } = this.data
    
    if (!startTime || !endTime) {
      wx.showToast({
        title: '请选择时间',
        icon: 'none'
      })
      return
    }

    if (startTime >= endTime) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      })
      return
    }

    const newSlot = {
      id: Date.now(),
      startTime,
      endTime
    }

    const updatedSlots = [...timeSlots, newSlot]
    this.setData({
      timeSlots: updatedSlots,
      startTime: '',
      endTime: ''
    })

    // 保存到服务器
    wx.request({
      url: `${app.globalData.apiBaseUrl}/time-slots`,
      method: 'POST',
      data: newSlot,
      success: () => {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
      },
      fail: () => {
        // 保存到本地存储
        wx.setStorageSync('timeSlots', updatedSlots)
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
      }
    })
  },

  deleteSlot(e) {
    const index = e.currentTarget.dataset.index
    const { timeSlots } = this.data
    const slot = timeSlots[index]
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除时间段 ${slot.startTime}-${slot.endTime} 吗？`,
      success: (res) => {
        if (res.confirm) {
          const updatedSlots = timeSlots.filter((_, i) => i !== index)
          this.setData({ timeSlots: updatedSlots })

          // 从服务器删除
          wx.request({
            url: `${app.globalData.apiBaseUrl}/time-slots/${slot.id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            },
            fail: () => {
              // 更新本地存储
              wx.setStorageSync('timeSlots', updatedSlots)
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})

