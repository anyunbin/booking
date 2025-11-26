// pages/owner/requests/requests.js
const app = getApp()

Page({
  data: {
    currentTab: 'pending',
    requests: []
  },

  onLoad() {
    this.loadRequests()
  },

  onShow() {
    this.loadRequests()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadRequests()
  },

  loadRequests() {
    const { currentTab } = this.data
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/requests?status=${currentTab}`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            requests: res.data.data || []
          })
        }
      },
      fail: () => {
        const allRequests = wx.getStorageSync('requests') || []
        const filtered = allRequests.filter(r => r.status === currentTab)
        this.setData({ requests: filtered })
      }
    })
  },

  approveRequest(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认同意',
      content: '确定要同意这个预约请求吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.apiBaseUrl}/requests/${id}/approve`,
            method: 'POST',
            success: () => {
              wx.showToast({
                title: '已同意',
                icon: 'success'
              })
              this.loadRequests()
            },
            fail: () => {
              const allRequests = wx.getStorageSync('requests') || []
              const index = allRequests.findIndex(r => r.id === id)
              if (index !== -1) {
                allRequests[index].status = 'approved'
                wx.setStorageSync('requests', allRequests)
              }
              wx.showToast({
                title: '已同意',
                icon: 'success'
              })
              this.loadRequests()
            }
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
          wx.request({
            url: `${app.globalData.apiBaseUrl}/requests/${id}/reject`,
            method: 'POST',
            success: () => {
              wx.showToast({
                title: '已驳回',
                icon: 'success'
              })
              this.loadRequests()
            },
            fail: () => {
              const allRequests = wx.getStorageSync('requests') || []
              const index = allRequests.findIndex(r => r.id === id)
              if (index !== -1) {
                allRequests[index].status = 'rejected'
                wx.setStorageSync('requests', allRequests)
              }
              wx.showToast({
                title: '已驳回',
                icon: 'success'
              })
              this.loadRequests()
            }
          })
        }
      }
    })
  }
})

