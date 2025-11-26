// pages/friends/friends.js
const app = getApp()

Page({
  data: {
    friends: []
  },

  onLoad() {
    this.loadFriends()
  },

  onShow() {
    this.loadFriends()
  },

  loadFriends() {
    const userId = app.getUserId()
    app.call({
      path: '/api/friends',
      method: 'GET',
      data: { userId: userId }
    }).then((res) => {
      if (res && res.success) {
        this.setData({
          friends: res.data || []
        })
      }
    }).catch((err) => {
      console.error('加载好友列表失败:', err)
      const friends = wx.getStorageSync('friends') || []
      this.setData({ friends })
    })
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

