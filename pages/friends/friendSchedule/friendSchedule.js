// pages/friends/friendSchedule/friendSchedule.js
const app = getApp()

Page({
  data: {
    friendId: '',
    friendName: '',
    // 最小时间单元固定为30分钟
    minTimeUnitMinutes: 30,
    // 日期范围
    startDate: '',
    endDate: '',
    dateList: [],
    // 时间段
    timeStart: '09:00',
    timeEnd: '18:00',
    timeSlots: [],
    tableData: {}, // { date_time: { status, guestName, scheduleId, requestId, startTime, endTime } }
    // 预约相关
    showBookingModal: false,
    selectedDate: '',
    selectedTime: '',
    scheduleEndTime: '',
    selectedScheduleId: null,
    bookingNote: ''
  },

  onLoad(options) {
    const friendId = options.friendId
    if (friendId) {
      this.setData({ friendId }, () => {
        this.loadFriendInfo()
        this.initDates()
        // generateTimeSlots 会在最后调用 generateDateList，然后加载数据
        this.generateTimeSlots()
      })
    }
  },

  onShow() {
    if (this.data.friendId) {
      this.loadTableData()
    }
  },

  loadFriendInfo() {
    const { friendId } = this.data
    wx.request({
      url: `${app.globalData.apiBaseUrl}/users/${friendId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            friendName: res.data.data.nickname || res.data.data.name || `用户${friendId}`
          })
        }
      },
      fail: () => {
        this.setData({
          friendName: `用户${friendId}`
        })
      }
    })
  },

  // 初始化日期范围（默认未来7天）
  initDates() {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 6) // 未来7天

    const startDateStr = this.formatDate(today)
    const endDateStr = this.formatDate(endDate)

    this.setData({
      startDate: startDateStr,
      endDate: endDateStr
    })
    this.generateDateList()
  },

  // 生成日期列表
  generateDateList() {
    const { startDate, endDate, tableData, timeSlots } = this.data
    
    // 确保日期范围有效
    if (!startDate || !endDate) {
      return
    }
    
    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 确保日期范围有效
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      console.error('Invalid date range:', startDate, endDate)
      return
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDate(d)
      // 计算该日期的可预约日程数量
      let scheduleCount = 0
      if (timeSlots && timeSlots.length > 0 && tableData) {
        timeSlots.forEach(time => {
          const key = `${dateStr}_${time}`
          const cell = tableData[key]
          if (cell && cell.status === 'available') {
            scheduleCount++
          }
        })
      }
      
      const dayOfWeek = d.getDay()
      const isToday = this.isToday(d)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      dates.push({
        date: dateStr,
        dateText: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: this.getWeekday(dayOfWeek),
        scheduleCount: scheduleCount,
        isToday: isToday,
        isWeekend: isWeekend,
        dayOfWeek: dayOfWeek
      })
    }

    this.setData({ dateList: dates })
  },

  // 获取星期
  getWeekday(day) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return weekdays[day]
  },

  // 判断是否是今天
  isToday(date) {
    const today = new Date()
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 生成时间段列表
  generateTimeSlots() {
    const { timeStart, timeEnd, minTimeUnitMinutes } = this.data
    const slots = []
    const start = this.timeToMinutes(timeStart)
    const end = this.timeToMinutes(timeEnd)
    
    for (let minutes = start; minutes < end; minutes += minTimeUnitMinutes) {
      slots.push(this.minutesToTime(minutes))
    }
    
    this.setData({ timeSlots: slots }, () => {
      this.generateDateList()
      // 确保日期列表生成后再加载表格数据
      this.loadTableData()
    })
  },

  // 时间转分钟数
  timeToMinutes(time) {
    const [hours, mins] = time.split(':').map(Number)
    return hours * 60 + mins
  },

  // 分钟数转时间
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  },

  // 加载表格数据
  loadTableData() {
    const { friendId, dateList, timeSlots, minTimeUnitMinutes } = this.data
    
    // 如果日期列表或时间段为空，先初始化
    if (!dateList || dateList.length === 0 || !timeSlots || timeSlots.length === 0) {
      console.log('Waiting for dateList or timeSlots to be ready', {
        dateListLength: dateList?.length || 0,
        timeSlotsLength: timeSlots?.length || 0
      })
      return
    }
    
    console.log('Loading table data', {
      dateListLength: dateList.length,
      timeSlotsLength: timeSlots.length,
      dateRange: `${dateList[0]?.date} to ${dateList[dateList.length - 1]?.date}`
    })
    
    const tableData = {}

    // 初始化所有单元格为空
    dateList.forEach(date => {
      timeSlots.forEach(time => {
        const key = `${date.date}_${time}`
        tableData[key] = {
          status: 'empty',
          guestName: '',
          scheduleId: null,
          requestId: null,
          isContinuation: false,
          isFirstCell: false,
          spanCount: 0
        }
      })
    })
    
    console.log('Initialized table cells:', Object.keys(tableData).length)

    // 加载好友的公开日程
    const { startDate, endDate } = this.data
    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules?friendId=${friendId}&startDate=${startDate}&endDate=${endDate}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          res.data.data.forEach(schedule => {
            const startTime = schedule.start_time || schedule.startTime
            const endTime = schedule.end_time || schedule.endTime
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            const duration = endMinutes - startMinutes
            const multiplier = Math.round(duration / minTimeUnitMinutes) // 跨几个时间单元
            
            // 标记所有被这个日程覆盖的单元格
            const firstSlotMinutes = Math.floor(startMinutes / minTimeUnitMinutes) * minTimeUnitMinutes
            let currentMinutes = firstSlotMinutes
            let isFirstCellFound = false
            
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${schedule.date}_${currentTime}`
              
              if (tableData[key]) {
                if (!isFirstCellFound) {
                  // 第一个单元格显示完整信息
                  tableData[key] = {
                    status: schedule.status === 'booked' ? 'booked' : schedule.status === 'pending' ? 'pending' : 'available',
                    guestName: '',
                    scheduleId: schedule.id,
                    requestId: null,
                    startTime: startTime,
                    endTime: endTime,
                    isFirstCell: true,
                    spanCount: multiplier
                  }
                  isFirstCellFound = true
                } else {
                  // 后续单元格标记为延续
                  tableData[key] = {
                    status: schedule.status === 'booked' ? 'booked' : schedule.status === 'pending' ? 'pending' : 'available',
                    guestName: '',
                    scheduleId: schedule.id,
                    requestId: null,
                    startTime: startTime,
                    endTime: endTime,
                    isContinuation: true,
                    spanCount: multiplier
                  }
                }
              }
              
              currentMinutes += minTimeUnitMinutes
            }
          })
        }
        this.setData({ tableData })
        this.loadBookingData()
      },
      fail: () => {
        this.setData({ tableData })
        this.loadBookingData()
      }
    })
  },

  // 加载预约数据
  loadBookingData() {
    const userId = app.getUserId()
    const { friendId, tableData, minTimeUnitMinutes, startDate, endDate } = this.data

    // 加载我向这个好友发起的预约请求
    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?guestId=${userId}&ownerId=${friendId}&startDate=${startDate}&endDate=${endDate}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const newTableData = { ...tableData }
          
          // 待审核的请求
          res.data.data.filter(r => r.status === 'pending').forEach(request => {
            const startTime = request.start_time || request.startTime
            const endTime = request.end_time || request.endTime
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            
            // 更新所有被这个请求覆盖的单元格（包括延续单元格）
            let currentMinutes = startMinutes
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${request.date}_${currentTime}`
              if (newTableData[key]) {
                newTableData[key] = {
                  ...newTableData[key],
                  status: 'pending',
                  guestName: '我的申请',
                  isMyRequest: true,
                  requestId: request.id,
                  note: request.note || ''
                }
              }
              currentMinutes += minTimeUnitMinutes
            }
          })

          // 已预约的请求（已同意）
          res.data.data.filter(r => r.status === 'approved').forEach(request => {
            const startTime = request.start_time || request.startTime
            const endTime = request.end_time || request.endTime
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            
            // 更新所有被这个预约覆盖的单元格（包括延续单元格）
            let currentMinutes = startMinutes
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${request.date}_${currentTime}`
              if (newTableData[key]) {
                newTableData[key] = {
                  ...newTableData[key],
                  status: 'booked',
                  guestName: '我的预约',
                  isMyRequest: true,
                  requestId: request.id,
                  note: request.note || ''
                }
              }
              currentMinutes += minTimeUnitMinutes
            }
          })

          this.setData({ tableData: newTableData })
          this.loadOtherBookingData(newTableData)
        }
      },
      fail: () => {}
    })
  },

  // 加载其他人的预约数据
  loadOtherBookingData(tableData) {
    const { friendId, minTimeUnitMinutes, startDate, endDate } = this.data

    // 加载所有向这个好友发起的预约请求（不仅仅是我的）
    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?ownerId=${friendId}&startDate=${startDate}&endDate=${endDate}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const newTableData = { ...tableData }

          // 已同意的请求（其他人的预约）
          res.data.data.filter(r => r.status === 'approved').forEach(request => {
            const startTime = request.start_time || request.startTime
            const endTime = request.end_time || request.endTime
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)

            // 更新所有被这个预约覆盖的单元格（包括延续单元格）
            let currentMinutes = startMinutes
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${request.date}_${currentTime}`
              if (newTableData[key] && !newTableData[key].isMyRequest) {
                // 只有在不是我的请求时才显示"已被预约"
                newTableData[key] = {
                  ...newTableData[key],
                  status: 'booked',
                  guestName: '已被预约',
                  isMyRequest: false,
                  requestId: request.id,
                  note: ''
                }
              }
              currentMinutes += minTimeUnitMinutes
            }
          })

          this.setData({ tableData: newTableData })
          this.updateDateScheduleCounts()
        }
      },
      fail: () => {
        this.updateDateScheduleCounts()
      }
    })
  },

  // 更新日期列表的日程数量
  updateDateScheduleCounts() {
    const { dateList, tableData, timeSlots } = this.data
    const updatedDates = dateList.map(dateItem => {
      let count = 0
      timeSlots.forEach(time => {
        const key = `${dateItem.date}_${time}`
        const cell = tableData[key]
        if (cell && cell.status === 'available') {
          count++
        }
      })
      return {
        ...dateItem,
        scheduleCount: count
      }
    })
    this.setData({ dateList: updatedDates })
  },

  // 日期范围选择
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value }, () => {
      this.generateDateList()
      this.loadTableData()
    })
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value }, () => {
      this.generateDateList()
      this.loadTableData()
    })
  },

  setDateRange(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)

    this.setData({
      startDate: this.formatDate(today),
      endDate: this.formatDate(endDate)
    }, () => {
      this.generateDateList()
      this.loadTableData()
    })
  },

  // 时间段选择
  onTimeStartChange(e) {
    this.setData({ timeStart: e.detail.value }, () => {
      this.generateTimeSlots()
      // generateTimeSlots 会调用 generateDateList 和 loadTableData
    })
  },

  onTimeEndChange(e) {
    this.setData({ timeEnd: e.detail.value }, () => {
      this.generateTimeSlots()
      // generateTimeSlots 会调用 generateDateList 和 loadTableData
    })
  },

  // 点击单元格
  onCellTap(e) {
    const date = e.currentTarget.dataset.date
    const time = e.currentTarget.dataset.time
    const key = `${date}_${time}`
    const cell = this.data.tableData[key]

    if (!cell || cell.status === 'empty') {
      wx.showToast({
        title: '该时间段无日程',
        icon: 'none'
      })
      return
    }

    if (cell.status === 'booked' || cell.status === 'pending') {
      wx.showToast({
        title: '该时间段不可预约',
        icon: 'none'
      })
      return
    }

    if (cell.status === 'available') {
      // 打开预约弹窗
      // 计算结束时间：如果单元格有endTime就用endTime，否则根据时间单元计算
      let endTime = cell.endTime
      if (!endTime) {
        // 根据时间单元计算结束时间
        const startMinutes = this.timeToMinutes(time)
        const { minTimeUnitMinutes } = this.data
        const endMinutes = startMinutes + minTimeUnitMinutes
        endTime = this.minutesToTime(endMinutes)
      }
      
      this.setData({
        showBookingModal: true,
        selectedDate: date,
        selectedTime: time,
        scheduleEndTime: endTime,
        selectedScheduleId: cell.scheduleId,
        bookingNote: ''
      })
    }
  },

  // 关闭预约弹窗
  closeBookingModal() {
    this.setData({ showBookingModal: false })
  },

  stopPropagation() {},

  // 预约备注输入
  onBookingNoteInput(e) {
    this.setData({ bookingNote: e.detail.value })
  },

  // 确认预约
  confirmBooking() {
    const { selectedDate, selectedTime, scheduleEndTime, selectedScheduleId, bookingNote, friendId } = this.data
    const userId = app.getUserId()

    if (!selectedScheduleId) {
      wx.showToast({
        title: '日程信息错误',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests`,
      method: 'POST',
      data: {
        scheduleId: selectedScheduleId,
        ownerId: friendId,
        date: selectedDate,
        startTime: selectedTime,
        endTime: scheduleEndTime,
        note: bookingNote,
        guestId: userId,
        guestName: app.getUserInfo()?.nickname || app.getUserInfo()?.name || '访客'
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({
            title: '预约成功',
            icon: 'success'
          })
          this.closeBookingModal()
          this.loadTableData()
        } else {
          wx.showToast({
            title: res.data.message || '预约失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  }
})
