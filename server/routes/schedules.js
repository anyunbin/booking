// server/routes/schedules.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取日程列表
router.get('/', async (req, res) => {
  try {
    const { userId, friendId } = req.query
    let sql = `
      SELECT s.*, u.name as user_name, u.id as owner_id
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
    `
    const params = []
    
    if (userId) {
      // 获取自己的日程（全部）
      sql += ' WHERE s.user_id = ?'
      params.push(userId)
    } else if (friendId) {
      // 获取好友的公开日程
      sql += ' WHERE s.user_id = ? AND s.is_public = 1'
      params.push(friendId)
    }
    
    sql += ' ORDER BY s.date, s.start_time'
    
    const schedules = await db.query(sql, params)
    // 转换 is_public 字段
    const formattedSchedules = schedules.map(s => ({
      ...s,
      isPublic: s.is_public === 1,
      ownerName: s.user_name || `用户${s.user_id}`,
      ownerId: s.owner_id || s.user_id
    }))
    
    res.json({
      success: true,
      data: formattedSchedules
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取单个日程
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schedules = await db.query(
      `SELECT s.*, u.name as user_name, u.id as owner_id
       FROM schedules s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    )
    
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    const schedule = {
      ...schedules[0],
      isPublic: schedules[0].is_public === 1,
      ownerName: schedules[0].user_name || `用户${schedules[0].user_id}`,
      ownerId: schedules[0].owner_id || schedules[0].user_id
    }

    res.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 添加日程
router.post('/', async (req, res) => {
  try {
    let { date, startTime, endTime, userId = 'default', isPublic = true } = req.body
    
    // 确保 isPublic 是布尔值
    if (isPublic === '' || isPublic === null || isPublic === undefined) {
      isPublic = true
    } else if (typeof isPublic === 'string') {
      isPublic = isPublic === 'true' || isPublic === '1'
    } else {
      isPublic = Boolean(isPublic)
    }
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '日期和时间不能为空'
      })
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须晚于开始时间'
      })
    }

    // 确保用户存在于users表中
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    if (users.length === 0) {
      // 如果用户不存在，创建用户记录
      await db.run('INSERT INTO users (id, name) VALUES (?, ?)', [userId, `用户${userId}`])
    }

    const result = await db.run(
      'INSERT INTO schedules (user_id, date, start_time, end_time, status, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, date, startTime, endTime, 'available', isPublic ? 1 : 0]
    )

    res.json({
      success: true,
      data: {
        id: result.id,
        userId,
        date,
        startTime,
        endTime,
        status: 'available',
        isPublic: isPublic
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 删除日程
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.run('DELETE FROM schedules WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 更新日程状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!['available', 'booked', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      })
    }

    const result = await db.run(
      'UPDATE schedules SET status = ? WHERE id = ?',
      [status, id]
    )
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 更新日程公开状态
router.patch('/:id/public', async (req, res) => {
  try {
    const { id } = req.params
    const { isPublic } = req.body

    const result = await db.run(
      'UPDATE schedules SET is_public = ? WHERE id = ?',
      [isPublic ? 1 : 0, id]
    )
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router

