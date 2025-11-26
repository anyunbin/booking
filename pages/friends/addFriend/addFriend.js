// pages/friends/addFriend/addFriend.js
const app = getApp()

Page({
  data: {
    searchKeyword: '',
    searchResults: [],
    isSearching: false,
    myFriends: [] // 当前用户的好友列表
  },

  onLoad() {
    // 加载当前用户的好友列表，用于判断是否已是好友
    this.loadMyFriends()
  },

  // 加载我的好友列表
  loadMyFriends() {
    const userId = app.getUserId()
    app.call({
      path: '/api/friends',
      method: 'GET',
      data: { userId: userId }
    }).then((res) => {
      if (res && res.success) {
        const friends = res.data || []
        const friendIds = friends.map(f => f.id)
        this.setData({ myFriends: friendIds })
      }
    }).catch((err) => {
      console.error('加载好友列表失败:', err)
      // 失败不影响搜索功能
    })
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    
    // 如果输入为空，清空搜索结果
    if (!keyword.trim()) {
      this.setData({ searchResults: [] })
      return
    }

    // 防抖：延迟搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
    
    this.searchTimer = setTimeout(() => {
      if (keyword.trim().length >= 2) {
        this.searchUsers()
      }
    }, 500)
  },

  // 搜索用户
  searchUsers() {
    const { searchKeyword } = this.data
    
    if (!searchKeyword || searchKeyword.trim().length < 2) {
      wx.showToast({
        title: '请输入至少2个字符',
        icon: 'none'
      })
      return
    }

    this.setData({ isSearching: true })

    app.call({
      path: '/api/users/search',
      method: 'GET',
      data: {
        keyword: searchKeyword.trim()
      }
    }).then((res) => {
      this.setData({ isSearching: false })

      if (res && res.success) {
        const results = res.data || []
        const { myFriends } = this.data

        // 标记是否已是好友，并处理头像文字
        const resultsWithStatus = results.map(user => {
          const displayName = user.nickname || user.name || '用户'
          return {
            ...user,
            isFriend: myFriends.includes(user.id),
            avatarText: displayName.charAt(0) // 首字母用于头像显示
          }
        })

        this.setData({ searchResults: resultsWithStatus })
      } else {
        this.setData({ searchResults: [] })
        wx.showToast({
            title: res.data?.message || '搜索失败',
            icon: 'none'
          })
        }
    }).catch((err) => {
      this.setData({ isSearching: false, searchResults: [] })
      console.error('搜索用户失败:', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    })
  }
  },

  // 添加好友
  addFriend(e) {
    const friend = e.currentTarget.dataset.friend
    
    if (!friend || friend.isFriend) {
      return
    }

    // 不能添加自己
    const userId = app.getUserId()
    if (friend.id === userId) {
      wx.showToast({
        title: '不能添加自己为好友',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '添加中...'
    })

    app.call({
      path: '/api/friends/add',
      method: 'POST',
      data: { 
        friendId: friend.id, 
        userId: userId 
      },
      }).then((res) => {
        wx.hideLoading()
        
        if (res.data && res.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })
          
          // 更新搜索结果中的状态
          const searchResults = this.data.searchResults.map(item => {
            if (item.id === friend.id) {
              return { ...item, isFriend: true }
            }
            return item
          })
          this.setData({ searchResults })
          
          // 更新好友列表
          this.loadMyFriends()
          
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data?.message || '添加失败',
            icon: 'none'
          })
        }
      },
      }).catch((err) => {
        wx.hideLoading()
        console.error('添加好友失败:', err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  }
})

