// pages/owner/schedule/schedule.js
const app = getApp()

Page({
  data: {
    schedules: [],
    showManualModal: false,
    scheduleDate: '',
    scheduleStartTime: '',
    scheduleEndTime: ''
  },

  onLoad() {
    this.loadSchedules()
  },

  onShow() {
    this.loadSchedules()
  },

  loadSchedules() {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            schedules: this.groupSchedulesByDate(res.data.data || [])
          })
        }
      },
      fail: () => {
        const schedules = wx.getStorageSync('schedules') || []
        this.setData({
          schedules: this.groupSchedulesByDate(schedules)
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

  addByVoice() {
    const recorderManager = wx.getRecorderManager()
    
    wx.showModal({
      title: '语音设置',
      content: '点击确定开始录音，说出您的日程安排',
      success: (res) => {
        if (res.confirm) {
          recorderManager.start({
            duration: 10000,
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 96000,
            format: 'mp3'
          })

          wx.showToast({
            title: '正在录音...',
            icon: 'loading',
            duration: 10000
          })

          recorderManager.onStop((res) => {
            wx.hideToast()
            // 这里应该调用语音识别API，暂时模拟处理
            wx.showModal({
              title: '语音识别',
              content: '请手动输入识别结果（实际应用中会调用语音识别API）',
              editable: true,
              placeholderText: '例如：明天下午2点到4点',
              success: (modalRes) => {
                if (modalRes.confirm && modalRes.content) {
                  this.processVoiceInput(modalRes.content)
                }
              }
            })
          })

          setTimeout(() => {
            recorderManager.stop()
          }, 5000)
        }
      }
    })
  },

  processVoiceInput(text) {
    // 简单的文本解析（实际应用中需要更复杂的NLP处理）
    wx.showToast({
      title: '正在处理语音输入...',
      icon: 'loading'
    })
    
    // 模拟解析结果
    setTimeout(() => {
      wx.hideToast()
      wx.showModal({
        title: '解析结果',
        content: '请手动确认日程信息',
        success: () => {
          this.setData({ showManualModal: true })
        }
      })
    }, 1000)
  },

  addManually() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({
      showManualModal: true,
      scheduleDate: dateStr,
      scheduleStartTime: '',
      scheduleEndTime: ''
    })
  },

  closeModal() {
    this.setData({ showManualModal: false })
  },

  stopPropagation() {},

  onDateChange(e) {
    this.setData({
      scheduleDate: e.detail.value
    })
  },

  onScheduleStartTimeChange(e) {
    this.setData({
      scheduleStartTime: e.detail.value
    })
  },

  onScheduleEndTimeChange(e) {
    this.setData({
      scheduleEndTime: e.detail.value
    })
  },

  confirmAddSchedule() {
    const { scheduleDate, scheduleStartTime, scheduleEndTime, schedules } = this.data

    if (!scheduleDate || !scheduleStartTime || !scheduleEndTime) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (scheduleStartTime >= scheduleEndTime) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      })
      return
    }

    const newSchedule = {
      id: Date.now(),
      date: scheduleDate,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      status: 'available'
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules`,
      method: 'POST',
      data: newSchedule,
      success: () => {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        this.setData({ showManualModal: false })
        this.loadSchedules()
      },
      fail: () => {
        const allSchedules = wx.getStorageSync('schedules') || []
        allSchedules.push(newSchedule)
        wx.setStorageSync('schedules', allSchedules)
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        this.setData({ showManualModal: false })
        this.loadSchedules()
      }
    })
  },

  deleteSchedule(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.apiBaseUrl}/schedules/${id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadSchedules()
            },
            fail: () => {
              const allSchedules = wx.getStorageSync('schedules') || []
              const filtered = allSchedules.filter(s => s.id !== id)
              wx.setStorageSync('schedules', filtered)
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadSchedules()
            }
          })
        }
      }
    })
  }
})

