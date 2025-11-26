// server/routes/admin.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    // 用户总数
    const userCount = await db.query('SELECT COUNT(*) as count FROM users')
    
    // 日程总数
    const scheduleCount = await db.query('SELECT COUNT(*) as count FROM schedules')
    
    // 好友关系总数
    const friendCount = await db.query('SELECT COUNT(*) as count FROM friends')
    
    // 预约请求总数
    const requestCount = await db.query('SELECT COUNT(*) as count FROM requests')
    
    // 按状态统计预约请求
    const requestStatusStats = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM requests 
       GROUP BY status`
    )
    
    // 按状态统计日程
    const scheduleStatusStats = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM schedules 
       GROUP BY status`
    )
    
    // 最近注册的用户（7天内）
    const recentUsers = await db.query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE datetime(created_at) >= datetime('now', '-7 days')`
    )
    
    // 最近创建的日程（7天内）
    const recentSchedules = await db.query(
      `SELECT COUNT(*) as count 
       FROM schedules 
       WHERE datetime(created_at) >= datetime('now', '-7 days')`
    )

    res.json({
      success: true,
      data: {
        users: {
          total: userCount[0].count,
          recent: recentUsers[0].count
        },
        schedules: {
          total: scheduleCount[0].count,
          recent: recentSchedules[0].count,
          byStatus: scheduleStatusStats.reduce((acc, item) => {
            acc[item.status] = item.count
            return acc
          }, {})
        },
        friends: {
          total: friendCount[0].count
        },
        requests: {
          total: requestCount[0].count,
          byStatus: requestStatusStats.reduce((acc, item) => {
            acc[item.status] = item.count
            return acc
          }, {})
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取所有用户列表（带分页）
router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let sql = 'SELECT * FROM users WHERE 1=1'
    const params = []
    
    if (keyword) {
      sql += ' AND (username LIKE ? OR nickname LIKE ? OR name LIKE ?)'
      const searchKeyword = `%${keyword}%`
      params.push(searchKeyword, searchKeyword, searchKeyword)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const users = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1'
    const countParams = []
    if (keyword) {
      countSql += ' AND (username LIKE ? OR nickname LIKE ? OR name LIKE ?)'
      const searchKeyword = `%${keyword}%`
      countParams.push(searchKeyword, searchKeyword, searchKeyword)
    }
    const countResult = await db.query(countSql, countParams)
    const total = countResult[0].count
    
    res.json({
      success: true,
      data: {
        list: users,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取所有好友关系
router.get('/friends', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    const friends = await db.query(
      `SELECT 
        f.id,
        f.user_id,
        f.friend_id,
        f.created_at,
        u1.username as user_username,
        u1.nickname as user_nickname,
        u1.name as user_name,
        u2.username as friend_username,
        u2.nickname as friend_nickname,
        u2.name as friend_name
       FROM friends f
       LEFT JOIN users u1 ON f.user_id = u1.id
       LEFT JOIN users u2 ON f.friend_id = u2.id
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    
    const totalResult = await db.query('SELECT COUNT(*) as count FROM friends')
    const total = totalResult[0].count
    
    res.json({
      success: true,
      data: {
        list: friends,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取所有日程（带分页和筛选）
router.get('/schedules', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, userId, status, date } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let sql = `
      SELECT 
        s.*,
        u.username,
        u.nickname,
        u.name as user_name
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (userId) {
      sql += ' AND s.user_id = ?'
      params.push(userId)
    }
    
    if (status) {
      sql += ' AND s.status = ?'
      params.push(status)
    }
    
    if (date) {
      sql += ' AND s.date = ?'
      params.push(date)
    }
    
    sql += ' ORDER BY s.date DESC, s.start_time DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const schedules = await db.query(sql, params)
    
    // 获取总数
    let countSql = `
      SELECT COUNT(*) as count 
      FROM schedules s
      WHERE 1=1
    `
    const countParams = []
    if (userId) {
      countSql += ' AND s.user_id = ?'
      countParams.push(userId)
    }
    if (status) {
      countSql += ' AND s.status = ?'
      countParams.push(status)
    }
    if (date) {
      countSql += ' AND s.date = ?'
      countParams.push(date)
    }
    const countResult = await db.query(countSql, countParams)
    const total = countResult[0].count
    
    res.json({
      success: true,
      data: {
        list: schedules.map(s => ({
          ...s,
          isPublic: s.is_public === 1
        })),
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取所有预约请求（带分页和筛选）
router.get('/requests', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status, ownerId, guestId } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    let sql = `
      SELECT 
        r.*,
        u1.username as owner_username,
        u1.nickname as owner_nickname,
        u1.name as owner_name,
        u2.username as guest_username,
        u2.nickname as guest_nickname,
        u2.name as guest_name,
        s.date as schedule_date,
        s.start_time as schedule_start_time,
        s.end_time as schedule_end_time
      FROM requests r
      LEFT JOIN users u1 ON r.owner_id = u1.id
      LEFT JOIN users u2 ON r.guest_id = u2.id
      LEFT JOIN schedules s ON r.schedule_id = s.id
      WHERE 1=1
    `
    const params = []
    
    if (status) {
      sql += ' AND r.status = ?'
      params.push(status)
    }
    
    if (ownerId) {
      sql += ' AND r.owner_id = ?'
      params.push(ownerId)
    }
    
    if (guestId) {
      sql += ' AND r.guest_id = ?'
      params.push(guestId)
    }
    
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const requests = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as count FROM requests WHERE 1=1'
    const countParams = []
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    if (ownerId) {
      countSql += ' AND owner_id = ?'
      countParams.push(ownerId)
    }
    if (guestId) {
      countSql += ' AND guest_id = ?'
      countParams.push(guestId)
    }
    const countResult = await db.query(countSql, countParams)
    const total = countResult[0].count
    
    res.json({
      success: true,
      data: {
        list: requests,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router

