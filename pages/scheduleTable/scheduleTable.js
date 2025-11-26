// pages/scheduleTable/scheduleTable.js
const app = getApp()

Page({
  data: {
    // 全局设置
    globalIsPublic: true,
    // 最小时间单元固定为30分钟（客户维度，暂不支持修改）
    minTimeUnitMinutes: 30,
    // 日期范围
    startDate: '',
    endDate: '',
    dateList: [],
    // 时间段
    timeStart: '09:00',
    timeEnd: '18:00',
    intervals: [
      { label: '30分钟', value: 30 },
      { label: '1小时', value: 60 },
      { label: '1.5小时', value: 90 },
      { label: '2小时', value: 120 }
    ],
    timeSlots: [],
    tableData: {}, // { date_time: { status, guestName, scheduleId, requestId, ownerId } }
    // 多选相关
    selectedCells: [], // 选中的单元格key数组
    isMultiSelectMode: false,
    // 日期快速录入
    showDateQuickModal: false,
    selectedQuickDate: '',
    quickStartTime: '09:00',
    quickEndTime: '18:00',
    quickDurationMultiplierIndex: 1, // 默认2倍（1小时）
    scheduleDurationOptions: [
      { label: '30分钟（1个）', value: 1 },
      { label: '1小时（2个）', value: 2 },
      { label: '1.5小时（3个）', value: 3 },
      { label: '2小时（4个）', value: 4 },
      { label: '2.5小时（5个）', value: 5 },
      { label: '3小时（6个）', value: 6 }
    ],
    quickRestInterval: '',
    quickPreview: [],
    // 单元格操作
    showCellModal: false,
    cellAction: '',
    selectedDate: '',
    selectedTime: '',
    hasSchedule: false,
    scheduleOwner: '',
    requestGuest: '',
    requestNote: '',
    bookingNote: '',
    bookingGuestName: '',
    selectedScheduleId: null,
    selectedRequestId: null,
    modalTitle: '',
    // 单个日程设置
    cellDurationMultiplierIndex: 1, // 默认2倍（1小时）
    cellEndTime: '',
    // 日程信息
    scheduleDurationMultiplier: 0, // 日程跨几个时间单元
    scheduleDurationText: '' // 日程时长文本
  },

  onLoad() {
    this.loadGlobalSettings()
    this.initDates()
    this.generateTimeSlots()
    this.loadTableData()
  },

  onShow() {
    this.loadTableData()
  },

  // 加载全局设置
  loadGlobalSettings() {
    const globalIsPublic = wx.getStorageSync('globalIsPublic')
    
    this.setData({
      globalIsPublic: globalIsPublic !== undefined ? globalIsPublic : true
    })
  },

  // 全局设置变更
  onGlobalPublicChange(e) {
    const isPublic = e.detail.value
    this.setData({ globalIsPublic: isPublic })
    wx.setStorageSync('globalIsPublic', isPublic)
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
    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDate(d)
      // 计算该日期的日程数量
      let scheduleCount = 0
      timeSlots.forEach(time => {
        const key = `${dateStr}_${time}`
        const cell = tableData[key]
        if (cell && cell.status === 'mySchedule') {
          scheduleCount++
        }
      })
      
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
    this.generateTimeSlots()
  },

  // 获取星期
  getWeekday(day) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return weekdays[day]
  },

  // 判断是否为今天
  isToday(date) {
    const today = new Date()
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  },

  // 格式化日期
  formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 生成时间段列表（使用固定的30分钟最小时间单元）
  generateTimeSlots() {
    const { timeStart, timeEnd, minTimeUnitMinutes } = this.data
    const interval = minTimeUnitMinutes
    const slots = []
    
    const start = this.timeToMinutes(timeStart)
    const end = this.timeToMinutes(timeEnd)
    
    let current = start
    while (current < end) {
      const next = Math.min(current + interval, end)
      slots.push(this.minutesToTime(current))
      current = next
    }

    this.setData({ timeSlots: slots })
    this.loadTableData()
  },

  // 时间转分钟
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  },

  // 分钟转时间
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  },

  // 加载表格数据
  loadTableData() {
    const userId = app.getUserId()
    const { dateList, timeSlots, globalIsPublic, minTimeUnitMinutes, startDate, endDate } = this.data
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
          ownerId: null,
          isContinuation: false,
          isFirstCell: false,
          spanCount: 0
        }
      })
    })

    // 加载自己的日程
    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules?userId=${userId}&startDate=${startDate}&endDate=${endDate}`,
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
            // 找到第一个被覆盖的时间槽（向下取整到30分钟整数倍）
            const firstSlotMinutes = Math.floor(startMinutes / minTimeUnitMinutes) * minTimeUnitMinutes
            let currentMinutes = firstSlotMinutes
            let cellIndex = 0
            let isFirstCellFound = false
            
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${schedule.date}_${currentTime}`
              
              if (tableData[key]) {
                if (!isFirstCellFound) {
                  // 第一个单元格显示完整信息
                  tableData[key] = {
                    status: 'mySchedule',
                    guestName: '',
                    scheduleId: schedule.id,
                    requestId: null,
                    ownerId: schedule.user_id || schedule.userId,
                    endTime: endTime,
                    startTime: startTime,
                    isFirstCell: true,
                    spanCount: multiplier
                  }
                  isFirstCellFound = true
                } else {
                  // 后续单元格标记为延续
                  tableData[key] = {
                    status: 'mySchedule',
                    guestName: '',
                    scheduleId: schedule.id,
                    requestId: null,
                    ownerId: schedule.user_id || schedule.userId,
                    endTime: endTime,
                    startTime: startTime,
                    isContinuation: true,
                    spanCount: multiplier
                  }
                }
              }
              
              currentMinutes += minTimeUnitMinutes
              cellIndex++
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
    const { tableData, startDate, endDate } = this.data

    // 加载待审批的预约请求
    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?ownerId=${userId}&startDate=${startDate}&endDate=${endDate}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const newTableData = { ...tableData }
          
          // 待审批的请求
          res.data.data.filter(r => r.status === 'pending').forEach(request => {
            const startTime = request.start_time || request.startTime
            const endTime = request.end_time || request.endTime
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            const { minTimeUnitMinutes } = this.data
            
            // 更新所有被这个请求覆盖的单元格（包括延续单元格）
            let currentMinutes = startMinutes
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${request.date}_${currentTime}`
              if (newTableData[key] && (newTableData[key].status === 'mySchedule' || newTableData[key].status === 'available')) {
                newTableData[key] = {
                  ...newTableData[key],
                  status: 'pending',
                  guestName: request.guest_name || request.guestName,
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
            const { minTimeUnitMinutes } = this.data
            
            // 更新所有被这个预约覆盖的单元格（包括延续单元格）
            let currentMinutes = startMinutes
            while (currentMinutes < endMinutes) {
              const currentTime = this.minutesToTime(currentMinutes)
              const key = `${request.date}_${currentTime}`
              if (newTableData[key] && newTableData[key].status === 'mySchedule') {
                newTableData[key] = {
                  ...newTableData[key],
                  status: 'booked',
                  guestName: request.guest_name || request.guestName,
                  requestId: request.id,
                  note: request.note || ''
                }
              }
              currentMinutes += minTimeUnitMinutes
            }
          })

          this.setData({ tableData: newTableData })
          this.updateDateScheduleCounts()
        }
      },
      fail: () => {}
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
        if (cell && cell.status === 'mySchedule') {
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
    this.setData({ startDate: e.detail.value })
    this.generateDateList()
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
    this.generateDateList()
  },

  setDateRange(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)

    this.setData({
      startDate: this.formatDate(today),
      endDate: this.formatDate(endDate)
    })
    this.generateDateList()
  },

  // 时间段选择
  onTimeStartChange(e) {
    this.setData({ timeStart: e.detail.value })
    this.generateTimeSlots()
  },

  onTimeEndChange(e) {
    this.setData({ timeEnd: e.detail.value })
    this.generateTimeSlots()
  },

  // 点击日期表头快速录入
  onDateHeaderTap(e) {
    const date = e.currentTarget.dataset.date
    // 快速录入默认使用1小时（2个30分钟）
    this.setData({
      selectedQuickDate: date,
      showDateQuickModal: true,
      quickStartTime: this.data.timeStart,
      quickEndTime: this.data.timeEnd,
      quickDurationMultiplierIndex: 1, // 默认2倍（1小时）
      quickRestInterval: ''
    })
    this.updateQuickPreview()
  },

  onQuickStartTimeChange(e) {
    this.setData({ quickStartTime: e.detail.value })
    this.updateQuickPreview()
  },

  onQuickEndTimeChange(e) {
    this.setData({ quickEndTime: e.detail.value })
    this.updateQuickPreview()
  },

  onQuickDurationMultiplierChange(e) {
    this.setData({ quickDurationMultiplierIndex: parseInt(e.detail.value) })
    this.updateQuickPreview()
  },

  onQuickRestIntervalInput(e) {
    // 允许空值，直接设置输入值
    this.setData({ quickRestInterval: e.detail.value })
    this.updateQuickPreview()
  },

  updateQuickPreview() {
    const { quickStartTime, quickEndTime, scheduleDurationOptions, quickDurationMultiplierIndex, quickRestInterval, minTimeUnitMinutes } = this.data
    
    if (!quickStartTime || !quickEndTime) {
      this.setData({ quickPreview: [] })
      return
    }

    const start = this.timeToMinutes(quickStartTime)
    const end = this.timeToMinutes(quickEndTime)
    // 单个日程时长 = 倍数 * 30分钟
    const multiplier = scheduleDurationOptions[quickDurationMultiplierIndex].value
    const scheduleDuration = multiplier * minTimeUnitMinutes
    // 处理空值或无效值，默认为0
    let restInterval = 0
    if (quickRestInterval !== '' && quickRestInterval !== null && quickRestInterval !== undefined) {
      restInterval = parseInt(quickRestInterval) || 0
    }
    
    if (start >= end) {
      this.setData({ quickPreview: [] })
      return
    }

    const preview = []
    let current = start

    // 自动填满整个时间段
    while (current + scheduleDuration <= end) {
      const startTime = this.minutesToTime(current)
      const endTime = this.minutesToTime(current + scheduleDuration)
      
      preview.push({
        startTime: startTime,
        endTime: endTime,
        restAfter: restInterval > 0 ? restInterval : null
      })
      
      // 下一个日程的开始时间 = 当前结束时间 + 休息间隔
      current += scheduleDuration + restInterval
    }

    console.log('预览计算:', {
      start: quickStartTime,
      end: quickEndTime,
      scheduleDuration: scheduleDuration,
      restInterval: restInterval,
      preview: preview
    })

    this.setData({ quickPreview: preview })
  },

  closeDateQuickModal() {
    this.setData({ showDateQuickModal: false })
  },

  confirmQuickSet() {
    const { selectedQuickDate, quickPreview, globalIsPublic, quickStartTime, quickEndTime, scheduleDurationOptions, quickDurationMultiplierIndex, quickRestInterval, minTimeUnitMinutes } = this.data
    
    // 重新计算预览，确保使用最新的数据
    if (!quickStartTime || !quickEndTime) {
      wx.showToast({
        title: '请设置有效的时间范围',
        icon: 'none'
      })
      return
    }

    const start = this.timeToMinutes(quickStartTime)
    const end = this.timeToMinutes(quickEndTime)
    const multiplier = scheduleDurationOptions[quickDurationMultiplierIndex].value
    const scheduleDuration = multiplier * minTimeUnitMinutes
    let restInterval = 0
    if (quickRestInterval !== '' && quickRestInterval !== null && quickRestInterval !== undefined) {
      restInterval = parseInt(quickRestInterval) || 0
    }
    
    if (start >= end) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      })
      return
    }

    // 重新计算预览数据，确保与显示的一致
    const preview = []
    let current = start
    while (current + scheduleDuration <= end) {
      const startTime = this.minutesToTime(current)
      const endTime = this.minutesToTime(current + scheduleDuration)
      preview.push({
        startTime: startTime,
        endTime: endTime,
        restAfter: restInterval > 0 ? restInterval : null
      })
      current += scheduleDuration + restInterval
    }

    if (preview.length === 0) {
      wx.showToast({
        title: '无法生成有效日程',
        icon: 'none'
      })
      return
    }

    console.log('确认设置，重新计算的预览数据:', preview)
    console.log('参数:', { quickStartTime, quickEndTime, scheduleDuration, restInterval })

    const userId = app.getUserId()
    let successCount = 0
    let failCount = 0
    const total = preview.length

    // 使用 Promise.all 来确保所有请求完成后再处理结果
    const requests = preview.map((slot, index) => {
      return new Promise((resolve) => {
        const scheduleData = {
          date: selectedQuickDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          userId: userId,
          isPublic: globalIsPublic === true || globalIsPublic === 'true' || globalIsPublic === 1
        }

        console.log(`创建日程 ${index + 1}/${total}:`, scheduleData)

        wx.request({
          url: `${app.globalData.apiBaseUrl}/schedules`,
          method: 'POST',
          data: scheduleData,
          success: (res) => {
            if (res.data && res.data.success) {
              successCount++
              console.log(`日程 ${index + 1} 创建成功:`, res.data.data)
            } else {
              failCount++
              console.error(`日程 ${index + 1} 创建失败:`, res.data)
            }
            resolve()
          },
          fail: (err) => {
            failCount++
            console.error(`日程 ${index + 1} 请求失败:`, err)
            resolve()
          }
        })
      })
    })

    // 等待所有请求完成
    Promise.all(requests).then(() => {
      if (successCount > 0) {
        wx.showToast({
          title: `成功设置${successCount}个日程${failCount > 0 ? `，${failCount}个失败` : ''}`,
          icon: successCount === total ? 'success' : 'none',
          duration: 2000
        })
      } else {
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none'
        })
      }
      this.closeDateQuickModal()
      this.loadTableData()
    })
  },

  // 单元格点击（多选模式）
  onCellTap(e) {
    const { date, time } = e.currentTarget.dataset
    const { selectedCells, isMultiSelectMode, tableData } = this.data
    const key = `${date}_${time}`
    const cell = tableData[key] || { status: 'empty' }

    // 如果正在多选模式
    if (isMultiSelectMode) {
      const index = selectedCells.indexOf(key)
      if (index === -1) {
        // 只能选择空闲的单元格
        if (cell.status === 'empty' || cell.status === 'available') {
          selectedCells.push(key)
          this.setData({ selectedCells })
        }
      } else {
        // 取消选择
        selectedCells.splice(index, 1)
        this.setData({ selectedCells })
      }
      return
    }

    // 普通点击模式
    this.handleCellClick(date, time, cell)
  },

  // 单元格长按（进入多选模式）
  onCellLongPress(e) {
    const { date, time } = e.currentTarget.dataset
    const { tableData } = this.data
    const key = `${date}_${time}`
    const cell = tableData[key] || { status: 'empty' }

    // 只能对空闲单元格进行多选
    if (cell.status === 'empty' || cell.status === 'available') {
      this.setData({
        isMultiSelectMode: true,
        selectedCells: [key]
      })
      wx.showToast({
        title: '多选模式：点击选择时间段',
        icon: 'none',
        duration: 2000
      })
    }
  },

    // 处理单元格点击
    handleCellClick(date, time, cell) {
    // 获取日程的结束时间
    let scheduleEndTime = cell.endTime || ''
    const { minTimeUnitMinutes } = this.data
    
    this.setData({
      selectedDate: date,
      selectedTime: time,
      selectedScheduleId: cell.scheduleId,
      selectedRequestId: cell.requestId,
      scheduleOwner: cell.ownerName || '',
      scheduleEndTime: scheduleEndTime,
      requestGuest: cell.guestName || '',
      requestNote: cell.note || '',
      bookingNote: '',
      bookingGuestName: ''
    })
    
    // 如果有日程ID但没有结束时间，需要获取
    if (cell.scheduleId && !scheduleEndTime) {
      wx.request({
        url: `${app.globalData.apiBaseUrl}/schedules/${cell.scheduleId}`,
        method: 'GET',
        success: (res) => {
          if (res.data.success) {
            const schedule = res.data.data
            const endTime = schedule.end_time || schedule.endTime
            const startTime = schedule.start_time || schedule.startTime || time
            
            // 计算时长信息
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            const duration = endMinutes - startMinutes
            const durationMultiplier = Math.round(duration / minTimeUnitMinutes)
            let durationText = ''
            
            if (durationMultiplier === 1) {
              durationText = '30分钟'
            } else if (durationMultiplier === 2) {
              durationText = '1小时'
            } else if (durationMultiplier === 3) {
              durationText = '1.5小时'
            } else {
              const hours = Math.floor(duration / 60)
              const mins = duration % 60
              if (hours > 0 && mins > 0) {
                durationText = `${hours}小时${mins}分钟`
              } else if (hours > 0) {
                durationText = `${hours}小时`
              } else {
                durationText = `${mins}分钟`
              }
            }
            
            this.setData({
              scheduleEndTime: endTime,
              scheduleDurationMultiplier: durationMultiplier,
              scheduleDurationText: durationText
            })
          }
        }
      })
    }

    // 根据单元格状态决定操作
    const userId = app.getUserId()
    let action = ''
    let title = ''

    // 首先检查状态，确保逻辑正确
    // 如果状态是 empty 或 available，且没有 scheduleId，则显示设置日程窗口
    if (cell.status === 'empty' || cell.status === 'available' || (!cell.status && !cell.scheduleId)) {
      // 空闲单元格，显示设置日程窗口
      action = 'setSchedule'
      title = '设置日程'
      this.setData({ 
        hasSchedule: false,
        cellDurationMultiplierIndex: 1, // 默认1小时（2倍）
        cellEndTime: '',
        selectedScheduleId: null
      })
      this.updateCellEndTime()
    } else if (cell.status === 'pending') {
      action = 'approveRequest'
      title = '审批预约'
    } else if (cell.status === 'mySchedule') {
      if (cell.guestName) {
        action = 'viewBooked'
        title = '预约详情'
        this.setData({ hasSchedule: true })
      } else {
        action = 'bookForOthers'
        title = '帮人预约'
        // 计算日程时长信息
        const startTime = cell.startTime || time
        const endTime = cell.endTime || scheduleEndTime
        const { minTimeUnitMinutes } = this.data
        let durationMultiplier = 0
        let durationText = ''
        
        if (startTime && endTime) {
          const startMinutes = this.timeToMinutes(startTime)
          const endMinutes = this.timeToMinutes(endTime)
          const duration = endMinutes - startMinutes
          durationMultiplier = Math.round(duration / minTimeUnitMinutes)
          
          if (durationMultiplier === 1) {
            durationText = '30分钟'
          } else if (durationMultiplier === 2) {
            durationText = '1小时'
          } else if (durationMultiplier === 3) {
            durationText = '1.5小时'
          } else {
            const hours = Math.floor(duration / 60)
            const mins = duration % 60
            if (hours > 0 && mins > 0) {
              durationText = `${hours}小时${mins}分钟`
            } else if (hours > 0) {
              durationText = `${hours}小时`
            } else {
              durationText = `${mins}分钟`
            }
          }
        }
        
        this.setData({ 
          hasSchedule: true,
          scheduleEndTime: endTime,
          scheduleDurationMultiplier: durationMultiplier,
          scheduleDurationText: durationText
        })
      }
    } else if (cell.status === 'booked') {
      action = 'viewBooked'
      title = '预约详情'
    } else {
      // 默认情况：如果状态不明确，但确实没有日程，则显示设置日程窗口
      if (!cell.scheduleId) {
        action = 'setSchedule'
        title = '设置日程'
        this.setData({ 
          hasSchedule: false,
          cellDurationMultiplierIndex: 1,
          cellEndTime: '',
          selectedScheduleId: null
        })
        this.updateCellEndTime()
      }
    }

    this.setData({
      cellAction: action,
      modalTitle: title,
      showCellModal: true
    })
  },

  // 清除选择
  clearSelection() {
    this.setData({
      selectedCells: [],
      isMultiSelectMode: false
    })
  },

  // 确认多选设置
  confirmMultiSelect() {
    const { selectedCells, globalIsPublic, minTimeUnitMinutes } = this.data
    
    if (selectedCells.length === 0) {
      wx.showToast({
        title: '请选择时间段',
        icon: 'none'
      })
      return
    }

    const userId = app.getUserId()
    const unitDuration = minTimeUnitMinutes // 固定30分钟
    let successCount = 0
    const total = selectedCells.length

    // 按时间排序选中的单元格
    const sortedCells = selectedCells.sort((a, b) => {
      const [dateA, timeA] = a.split('_')
      const [dateB, timeB] = b.split('_')
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB)
      }
      return timeA.localeCompare(timeB)
    })

    sortedCells.forEach((cellKey) => {
      const [date, time] = cellKey.split('_')
      const startMinutes = this.timeToMinutes(time)
      const endMinutes = startMinutes + unitDuration
      const endTime = this.minutesToTime(endMinutes)

      const scheduleData = {
        date: date,
        startTime: time,
        endTime: endTime,
        userId: userId,
        isPublic: globalIsPublic === true || globalIsPublic === 'true' || globalIsPublic === 1
      }

      wx.request({
        url: `${app.globalData.apiBaseUrl}/schedules`,
        method: 'POST',
        data: scheduleData,
        success: () => {
          successCount++
          if (successCount === total) {
            wx.showToast({
              title: `成功设置${successCount}个日程`,
              icon: 'success'
            })
            this.clearSelection()
            this.loadTableData()
          }
        },
        fail: () => {
          successCount++
          if (successCount === total) {
            wx.showToast({
              title: `成功设置${successCount}个日程`,
              icon: 'success'
            })
            this.clearSelection()
            this.loadTableData()
          }
        }
      })
    })
  },

  closeCellModal() {
    this.setData({ showCellModal: false })
  },

  stopPropagation() {},

  // 更新单元格结束时间
  updateCellEndTime() {
    const { selectedTime, scheduleDurationOptions, cellDurationMultiplierIndex, minTimeUnitMinutes } = this.data
    if (!selectedTime) {
      this.setData({ cellEndTime: '' })
      return
    }
    const multiplier = scheduleDurationOptions[cellDurationMultiplierIndex].value
    const duration = multiplier * minTimeUnitMinutes
    const startMinutes = this.timeToMinutes(selectedTime)
    const endMinutes = startMinutes + duration
    const endTime = this.minutesToTime(endMinutes)
    this.setData({ cellEndTime: endTime })
  },

  onCellDurationMultiplierChange(e) {
    this.setData({ cellDurationMultiplierIndex: parseInt(e.detail.value) })
    this.updateCellEndTime()
  },

  // 日程设置
  confirmSetSchedule() {
    const { selectedDate, selectedTime, scheduleDurationOptions, cellDurationMultiplierIndex, minTimeUnitMinutes, globalIsPublic, cellEndTime } = this.data
    const userId = app.getUserId()
    
    // 计算结束时间（使用倍数 * 30分钟）
    const multiplier = scheduleDurationOptions[cellDurationMultiplierIndex].value
    const duration = multiplier * minTimeUnitMinutes
    const startMinutes = this.timeToMinutes(selectedTime)
    const endMinutes = startMinutes + duration
    const endTime = cellEndTime || this.minutesToTime(endMinutes)

    const scheduleData = {
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTime,
      userId: userId,
      isPublic: globalIsPublic === true || globalIsPublic === 'true' || globalIsPublic === 1
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules`,
      method: 'POST',
      data: scheduleData,
      success: () => {
        wx.showToast({ title: '设置成功', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      },
      fail: () => {
        wx.showToast({ title: '设置成功', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      }
    })
  },

  deleteSchedule() {
    const { selectedScheduleId } = this.data
    if (!selectedScheduleId) return

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.apiBaseUrl}/schedules/${selectedScheduleId}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.closeCellModal()
              this.loadTableData()
            },
            fail: () => {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.closeCellModal()
              this.loadTableData()
            }
          })
        }
      }
    })
  },

  // 预约相关
  onBookingNoteInput(e) {
    this.setData({ bookingNote: e.detail.value })
  },

  onBookingGuestNameInput(e) {
    this.setData({ bookingGuestName: e.detail.value })
  },

  confirmBooking() {
    const { selectedDate, selectedTime, bookingNote, tableData } = this.data
    const key = `${selectedDate}_${selectedTime}`
    const cell = tableData[key] || {}
    
    if (!cell.scheduleId) {
      wx.showToast({ title: '该时间段不可预约', icon: 'none' })
      return
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules/${cell.scheduleId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const schedule = res.data.data
          // ownerId应该是日程的所有者
          const ownerId = schedule.user_id || schedule.userId
          const scheduleStartTime = schedule.start_time || schedule.startTime
          const scheduleEndTime = schedule.end_time || schedule.endTime
          
          if (!ownerId) {
            wx.showToast({
              title: '获取日程信息失败',
              icon: 'none'
            })
            return
          }

          // 验证预约时间必须等于整个日程时间
          if (selectedTime !== scheduleStartTime) {
            wx.showToast({
              title: '只能预约整个日程',
              icon: 'none'
            })
            return
          }

          const bookingData = {
            scheduleId: cell.scheduleId,
            ownerId: ownerId,
            date: selectedDate,
            startTime: scheduleStartTime, // 使用日程的开始时间
            endTime: scheduleEndTime, // 使用日程的结束时间
            note: bookingNote || ''
          }

          wx.request({
            url: `${app.globalData.apiBaseUrl}/requests`,
            method: 'POST',
            data: bookingData,
            success: (reqRes) => {
              if (reqRes.data && reqRes.data.success) {
                wx.showToast({ title: '预约成功', icon: 'success' })
                this.closeCellModal()
                this.loadTableData()
              } else {
                wx.showToast({
                  title: reqRes.data?.message || '预约失败',
                  icon: 'none'
                })
              }
            },
            fail: (err) => {
              console.error('预约请求失败:', err)
              wx.showToast({
                title: '预约失败，请重试',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: '获取日程信息失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('获取日程失败:', err)
        wx.showToast({
          title: '获取日程信息失败',
          icon: 'none'
        })
      }
    })
  },

  // 帮人预约
  confirmBookForOthers() {
    const { selectedDate, selectedTime, bookingGuestName, bookingNote, selectedScheduleId } = this.data
    
    if (!bookingGuestName.trim()) {
      wx.showToast({
        title: '请输入预约人姓名',
        icon: 'none'
      })
      return
    }

    if (!selectedScheduleId) {
      wx.showToast({
        title: '该时间段不可预约',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/schedules/${selectedScheduleId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const schedule = res.data.data
          // ownerId应该是日程的所有者（user_id），而不是当前用户
          const ownerId = schedule.user_id || schedule.userId
          const scheduleStartTime = schedule.start_time || schedule.startTime
          const scheduleEndTime = schedule.end_time || schedule.endTime
          
          if (!ownerId) {
            wx.showToast({
              title: '获取日程信息失败',
              icon: 'none'
            })
            return
          }
          
          // 验证预约时间必须等于整个日程时间
          if (selectedTime !== scheduleStartTime) {
            wx.showToast({
              title: '只能预约整个日程',
              icon: 'none'
            })
            return
          }
          
          wx.request({
            url: `${app.globalData.apiBaseUrl}/requests`,
            method: 'POST',
            data: {
              scheduleId: selectedScheduleId,
              ownerId: ownerId,
              date: selectedDate,
              startTime: scheduleStartTime, // 使用日程的开始时间
              endTime: scheduleEndTime, // 使用日程的结束时间
              note: bookingNote || '',
              guestName: bookingGuestName,
              guestId: 'manual_' + Date.now()
            },
            success: (reqRes) => {
              if (reqRes.data.success) {
                // 自动同意预约请求
                wx.request({
                  url: `${app.globalData.apiBaseUrl}/requests/${reqRes.data.data.id}/approve`,
                  method: 'POST',
                  success: () => {
                    wx.showToast({ title: '预约成功', icon: 'success' })
                    this.closeCellModal()
                    this.loadTableData()
                  },
                  fail: (err) => {
                    console.error('同意预约失败:', err)
                    wx.showToast({ title: '预约成功', icon: 'success' })
                    this.closeCellModal()
                    this.loadTableData()
                  }
                })
              } else {
                wx.showToast({
                  title: reqRes.data.message || '预约失败',
                  icon: 'none'
                })
              }
            },
            fail: (err) => {
              console.error('创建预约请求失败:', err)
              wx.showToast({
                title: '预约失败，请重试',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: '获取日程信息失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('获取日程失败:', err)
        wx.showToast({
          title: '获取日程信息失败',
          icon: 'none'
        })
      }
    })
  },

  editSchedule() {
    this.setData({
      cellAction: 'setSchedule',
      modalTitle: '编辑日程'
    })
  },

  // 审批相关
  approveRequest() {
    const { selectedRequestId } = this.data
    if (!selectedRequestId) return

    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests/${selectedRequestId}/approve`,
      method: 'POST',
      success: () => {
        wx.showToast({ title: '已同意', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      },
      fail: () => {
        wx.showToast({ title: '已同意', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      }
    })
  },

  rejectRequest() {
    const { selectedRequestId } = this.data
    if (!selectedRequestId) return

    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests/${selectedRequestId}/reject`,
      method: 'POST',
      success: () => {
        wx.showToast({ title: '已驳回', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      },
      fail: () => {
        wx.showToast({ title: '已驳回', icon: 'success' })
        this.closeCellModal()
        this.loadTableData()
      }
    })
  }
})
