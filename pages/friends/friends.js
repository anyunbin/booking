// pages/friends/friends.js
const app = getApp()

Page({
  data: {
    friends: [],
    bookingStats: {
      approvedCount: 0,
      pendingCount: 0,
      totalCount: 0
    },
    bookingDetails: {
      approvedBookings: [],
      pendingBookings: [],
      availableCount: 0,
      myBookingCount: 0
    }
  },

  onLoad() {
    this.loadFriends()
  },

  onShow() {
    this.loadFriends()
    this.loadBookingDetails()
  },

  loadFriends() {
    const userId = app.getUserId()
    wx.request({
      url: `${app.globalData.apiBaseUrl}/friends?userId=${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const friends = res.data.data || []
          this.setData({
            friends: friends
          })
          // 加载每个好友的日程统计
          this.loadFriendsScheduleStats(friends)
        }
      },
      fail: () => {
        const friends = wx.getStorageSync('friends') || []
        this.setData({ friends })
      }
    })
  },

  // 加载每个好友的日程统计
  loadFriendsScheduleStats(friends) {
    const userId = app.getUserId()
    const today = this.formatDate(new Date())
    const endDate = this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 未来30天

    // 为每个好友加载统计数据
    friends.forEach((friend, index) => {
      // 加载该好友的可预约日程数
      wx.request({
        url: `${app.globalData.apiBaseUrl}/schedules?friendId=${friend.id}&startDate=${today}&endDate=${endDate}`,
        method: 'GET',
        success: (res) => {
          if (res.data.success) {
            const availableCount = res.data.data.filter(s => s.status === 'available').length

            // 更新好友数据
            const updatedFriends = this.data.friends
            updatedFriends[index].availableCount = availableCount
            this.setData({ friends: updatedFriends })
          }
        }
      })

      // 加载我在该好友那里的预约数
      wx.request({
        url: `${app.globalData.apiBaseUrl}/requests?guestId=${userId}&ownerId=${friend.id}&startDate=${today}&endDate=${endDate}`,
        method: 'GET',
        success: (res) => {
          if (res.data.success) {
            const myBookingCount = res.data.data.filter(r => r.status === 'approved').length

            // 更新好友数据
            const updatedFriends = this.data.friends
            updatedFriends[index].myBookingCount = myBookingCount
            this.setData({ friends: updatedFriends })
          }
        }
      })
    })
  },

  // 加载预约详情信息
  loadBookingDetails() {
    const userId = app.getUserId()
    const today = this.formatDate(new Date())

    // 加载我的预约请求（已预约和待审核）
    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?guestId=${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const requests = res.data.data || []

          // 过滤未过期的预约
          const approvedBookings = requests
            .filter(r => r.status === 'approved' && r.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3) // 只显示最近3个

          const pendingBookings = requests
            .filter(r => r.status === 'pending' && r.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3) // 只显示最近3个

          const myBookingCount = requests.filter(r => r.date >= today).length

           // 统计已预约和待审批的数量
           const approvedCount = requests.filter(r => r.status === 'approved' && r.date >= today).length
           const pendingCount = requests.filter(r => r.status === 'pending' && r.date >= today).length

           this.setData({
             'bookingDetails.approvedBookings': approvedBookings,
             'bookingDetails.pendingBookings': pendingBookings,
             'bookingDetails.myBookingCount': myBookingCount,
             'bookingStats.approvedCount': approvedCount,
             'bookingStats.pendingCount': pendingCount,
             'bookingStats.totalCount': approvedCount + pendingCount
           })
        }
      },
      fail: () => {
        // 加载失败，保持默认值
      }
    })

    // 加载可预约日程数
    this.loadAvailableSchedulesCount()
  },

  // 加载可预约日程数
  loadAvailableSchedulesCount() {
    const userId = app.getUserId()
    const today = this.formatDate(new Date())
    const endDate = this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 未来30天

    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?guestId=${userId}&startDate=${today}&endDate=${endDate}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          const requests = res.data.data || []
          // 统计所有好友的可预约日程数（简单估算：总日程数 - 已预约数）
          // 这里我们通过计算未来30天内的可用日程来估算
          const availableCount = Math.max(0, 50 - requests.length) // 假设总共50个可预约时段

          this.setData({
            'bookingDetails.availableCount': availableCount
          })
        }
      },
      fail: () => {
        // 加载失败，保持默认值
      }
    })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  goToAddFriend() {
    wx.navigateTo({
      url: '/pages/friends/addFriend/addFriend'
    })
  },

  viewFriendSchedule(e) {
    const friendId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/friends/friendSchedule/friendSchedule?friendId=${friendId}`
    })
  }
})

