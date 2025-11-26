// server/routes/timeSlots.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取所有时间单元
router.get('/', async (req, res) => {
  try {
    const slots = await db.query('SELECT * FROM time_slots ORDER BY start_time')
    res.json({
      success: true,
      data: slots
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 添加时间单元
router.post('/', async (req, res) => {
  try {
    const { startTime, endTime } = req.body
    
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '开始时间和结束时间不能为空'
      })
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须晚于开始时间'
      })
    }

    const result = await db.run(
      'INSERT INTO time_slots (start_time, end_time) VALUES (?, ?)',
      [startTime, endTime]
    )

    res.json({
      success: true,
      data: { id: result.id, startTime, endTime }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 删除时间单元
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.run('DELETE FROM time_slots WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '时间单元不存在'
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

module.exports = router

