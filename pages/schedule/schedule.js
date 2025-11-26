// pages/schedule/schedule.js
const app = getApp()

Page({
  data: {
    schedules: [],
    showManualModal: false,
    scheduleDate: '',
    scheduleStartTime: '',
    scheduleEndTime: '',
    isPublic: true,
    enableSplit: false,
    splitIntervalIndex: 2, // 默认1小时
    splitIntervals: [
      { label: '30分钟', value: 30 },
      { label: '1小时', value: 60 },
      { label: '1.5小时', value: 90 },
      { label: '2小时', value: 120 },
      { label: '3小时', value: 180 }
    ],
    splitPreview: []
  },

  onLoad() {
    this.loadSchedules()
    this.loadRequests()
  },

  onShow() {
    this.loadSchedules()
    if (this.data.currentTab === 'requests') {
      this.loadRequests()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    if (tab === 'requests') {
      this.loadRequests()
    }
  },

  loadSchedules() {
    app.call({
      path: '/api/schedules',
      method: 'GET'
    }).then((res) => {
      if (res && res.success) {
        this.setData({
          schedules: this.groupSchedulesByDate(res.data || [])
        })
      }
    }).catch((err) => {
      console.error('加载日程失败:', err)
      const schedules = wx.getStorageSync('schedules') || []
      this.setData({
        schedules: this.groupSchedulesByDate(schedules)
      })
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
    wx.showToast({
      title: '正在处理语音输入...',
      icon: 'loading'
    })
    
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
      scheduleEndTime: '',
      isPublic: true,
      enableSplit: false,
      splitIntervalIndex: 2,
      splitPreview: []
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


  onScheduleEndTimeChange(e) {
    this.setData({
      scheduleEndTime: e.detail.value
    })
    this.updateSplitPreview()
  },

  onScheduleStartTimeChange(e) {
    this.setData({
      scheduleStartTime: e.detail.value
    })
    this.updateSplitPreview()
  },

  onSplitChange(e) {
    this.setData({
      enableSplit: e.detail.value
    })
    this.updateSplitPreview()
  },

  onSplitIntervalChange(e) {
    this.setData({
      splitIntervalIndex: parseInt(e.detail.value)
    })
    this.updateSplitPreview()
  },

  // 更新时间段拆分预览
  updateSplitPreview() {
    const { scheduleStartTime, scheduleEndTime, enableSplit, splitIntervals, splitIntervalIndex } = this.data
    
    if (!enableSplit || !scheduleStartTime || !scheduleEndTime) {
      this.setData({ splitPreview: [] })
      return
    }

    const start = this.timeToMinutes(scheduleStartTime)
    const end = this.timeToMinutes(scheduleEndTime)
    
    if (start >= end) {
      this.setData({ splitPreview: [] })
      return
    }

    const interval = splitIntervals[splitIntervalIndex].value
    const preview = []
    
    let current = start
    while (current + interval <= end) {
      preview.push({
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(current + interval)
      })
      current += interval
    }

    this.setData({ splitPreview: preview })
  },

  // 时间字符串转分钟数（如 "13:30" -> 810）
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  },

  // 分钟数转时间字符串（如 810 -> "13:30"）
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  },

  onPublicChange(e) {
    this.setData({
      isPublic: e.detail.value
    })
  },

  togglePublic(e) {
    const { id, public: isPublic } = e.currentTarget.dataset
    const newPublic = !isPublic
    
    app.call({
      path: `/api/schedules/${id}/public`,
      method: 'PATCH',
      data: { isPublic: newPublic }
    }).then(() => {
      this.loadSchedules()
    }).catch((err) => {
      console.error('更新日程公开状态失败:', err)
      const allSchedules = wx.getStorageSync('schedules') || []
      const index = allSchedules.findIndex(s => s.id == id)
      if (index !== -1) {
        allSchedules[index].isPublic = newPublic
        wx.setStorageSync('schedules', allSchedules)
      }
      this.loadSchedules()
    })
  },

  confirmAddSchedule() {
    const { scheduleDate, scheduleStartTime, scheduleEndTime, isPublic, enableSplit, splitIntervals, splitIntervalIndex } = this.data

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

    const userId = app.getUserId()
    let schedulesToAdd = []

    if (enableSplit) {
      // 拆分时间段
      const start = this.timeToMinutes(scheduleStartTime)
      const end = this.timeToMinutes(scheduleEndTime)
      const interval = splitIntervals[splitIntervalIndex].value
      
      let current = start
      while (current + interval <= end) {
        schedulesToAdd.push({
          id: Date.now() + schedulesToAdd.length,
          date: scheduleDate,
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(current + interval),
          status: 'available',
          isPublic: isPublic,
          userId: userId
        })
        current += interval
      }

      if (schedulesToAdd.length === 0) {
        wx.showToast({
          title: '时间段太短，无法拆分',
          icon: 'none'
        })
        return
      }
    } else {
      // 单个时间段
      schedulesToAdd.push({
        id: Date.now(),
        date: scheduleDate,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        status: 'available',
        isPublic: isPublic,
        userId: userId
      })
    }

    // 批量添加日程
    this.addSchedulesBatch(schedulesToAdd)
  },

  // 批量添加日程
  addSchedulesBatch(schedules) {
    let successCount = 0
    let failCount = 0
    const total = schedules.length

    const requests = schedules.map((schedule) => {
      return app.call({
        path: '/api/schedules',
        method: 'POST',
        data: schedule
      }).then(() => {
        successCount++
      }).catch((err) => {
        console.error('创建日程失败:', err)
        // 保存到本地存储
        const allSchedules = wx.getStorageSync('schedules') || []
        allSchedules.push(schedule)
        wx.setStorageSync('schedules', allSchedules)
        successCount++
      })
    })

    Promise.all(requests).then(() => {
      this.onBatchAddComplete(successCount, failCount)
    })
  },

  onBatchAddComplete(successCount, failCount) {
    wx.showToast({
      title: `成功添加${successCount}个日程`,
      icon: 'success',
      duration: 2000
    })
    this.setData({ showManualModal: false })
    this.loadSchedules()
  },

  deleteSchedule(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          app.call({
            path: `/api/schedules/${id}`,
            method: 'DELETE'
          }).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadSchedules()
          }).catch((err) => {
            console.error('删除日程失败:', err)
            const allSchedules = wx.getStorageSync('schedules') || []
            const filtered = allSchedules.filter(s => s.id !== id)
            wx.setStorageSync('schedules', filtered)
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadSchedules()
          })
        }
      }
    })
  },


  // ========== 预约状态管理 ==========
  loadRequests() {
    const userId = app.getUserId()
    const { requestTab } = this.data
    
    app.call({
      path: '/api/requests',
      method: 'GET',
      data: { ownerId: userId, status: requestTab }
    }).then((res) => {
      if (res && res.success) {
        this.setData({
          requests: res.data || []
        })
      }
    }).catch((err) => {
      console.error('加载预约请求失败:', err)
      const allRequests = wx.getStorageSync('requests') || []
      const filtered = allRequests.filter(r => r.status === requestTab)
      this.setData({ requests: filtered })
    })
  },

  switchRequestTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ requestTab: tab })
    this.loadRequests()
  },

  approveRequest(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认同意',
      content: '确定要同意这个预约请求吗？',
      success: (res) => {
        if (res.confirm) {
          app.call({
            path: `/api/requests/${id}/approve`,
            method: 'POST'
          }).then(() => {
            wx.showToast({
              title: '已同意',
              icon: 'success'
            })
            this.loadRequests()
            this.loadSchedules() // 刷新日程状态
          }).catch((err) => {
            console.error('同意请求失败:', err)
            const allRequests = wx.getStorageSync('requests') || []
            const index = allRequests.findIndex(r => r.id == id)
            if (index !== -1) {
              allRequests[index].status = 'approved'
              wx.setStorageSync('requests', allRequests)
            }
            wx.showToast({
              title: '已同意',
              icon: 'success'
            })
            this.loadRequests()
            this.loadSchedules()
          })
        }
      }
    })
  },

  rejectRequest(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认驳回',
      content: '确定要驳回这个预约请求吗？',
      success: (res) => {
        if (res.confirm) {
          app.call({
            path: `/api/requests/${id}/reject`,
            method: 'POST'
          }).then(() => {
            wx.showToast({
              title: '已驳回',
              icon: 'success'
            })
            this.loadRequests()
            this.loadSchedules() // 刷新日程状态
          }).catch((err) => {
            console.error('驳回请求失败:', err)
            const allRequests = wx.getStorageSync('requests') || []
            const index = allRequests.findIndex(r => r.id == id)
            if (index !== -1) {
              allRequests[index].status = 'rejected'
              wx.setStorageSync('requests', allRequests)
            }
            wx.showToast({
              title: '已驳回',
              icon: 'success'
            })
            this.loadRequests()
            this.loadSchedules()
          })
        }
      }
    })
  }
})

