// server/routes/requests.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取预约请求列表
router.get('/', async (req, res) => {
  try {
    const { status, ownerId, guestId } = req.query
    let sql = 'SELECT * FROM requests WHERE 1=1'
    const params = []
    
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    if (ownerId) {
      sql += ' AND owner_id = ?'
      params.push(ownerId)
    }
    
    if (guestId) {
      sql += ' AND guest_id = ?'
      params.push(guestId)
    }
    
    sql += ' ORDER BY created_at DESC'
    
    const requests = await db.query(sql, params)
    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 创建预约请求
router.post('/', async (req, res) => {
  try {
    const { scheduleId, ownerId, date, startTime, endTime, note, guestId = 'guest1', guestName = '客人' } = req.body
    
    if (!scheduleId || !ownerId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      })
    }

    // 检查日程是否存在且可用
    const schedules = await db.query('SELECT * FROM schedules WHERE id = ?', [scheduleId])
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    if (schedules[0].status !== 'available') {
      return res.status(400).json({
        success: false,
        message: '该时间段不可预约'
      })
    }

    // 创建预约请求
    const result = await db.run(
      `INSERT INTO requests (schedule_id, owner_id, guest_id, guest_name, date, start_time, end_time, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [scheduleId, ownerId, guestId || guestId, guestName || '访客', date, startTime, endTime, note || '', 'pending']
    )

    // 更新日程状态为待审核
    await db.run('UPDATE schedules SET status = ? WHERE id = ?', ['pending', scheduleId])

    res.json({
      success: true,
      data: {
        id: result.id,
        scheduleId,
        ownerId,
        guestId,
        guestName,
        date,
        startTime,
        endTime,
        note,
        status: 'pending'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 同意预约请求
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取请求信息
    const requests = await db.query('SELECT * FROM requests WHERE id = ?', [id])
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: '请求不存在'
      })
    }

    const request = requests[0]

    // 更新请求状态
    await db.run('UPDATE requests SET status = ? WHERE id = ?', ['approved', id])

    // 更新日程状态为已预约
    await db.run('UPDATE schedules SET status = ? WHERE id = ?', ['booked', request.schedule_id])

    res.json({
      success: true,
      message: '已同意预约'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 驳回预约请求
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取请求信息
    const requests = await db.query('SELECT * FROM requests WHERE id = ?', [id])
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: '请求不存在'
      })
    }

    const request = requests[0]

    // 更新请求状态
    await db.run('UPDATE requests SET status = ? WHERE id = ?', ['rejected', id])

    // 更新日程状态为可用
    await db.run('UPDATE schedules SET status = ? WHERE id = ?', ['available', request.schedule_id])

    res.json({
      success: true,
      message: '已驳回预约'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router

