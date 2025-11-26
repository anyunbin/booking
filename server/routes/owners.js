// server/routes/owners.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取所有主人（用于客人端查看已添加的主人）
router.get('/', async (req, res) => {
  try {
    const { guestId } = req.query
    
    if (guestId) {
      // 获取客人已添加的主人
      const owners = await db.query(
        `SELECT o.* FROM owners o
         INNER JOIN guest_owners go ON o.id = go.owner_id
         WHERE go.guest_id = ?`,
        [guestId]
      )
      res.json({
        success: true,
        data: owners
      })
    } else {
      // 获取所有主人
      const owners = await db.query('SELECT * FROM owners')
      res.json({
        success: true,
        data: owners
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 根据ID获取主人信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const owners = await db.query('SELECT * FROM owners WHERE id = ?', [id])
    
    if (owners.length === 0) {
      // 如果不存在，创建一个默认的主人记录
      await db.run('INSERT INTO owners (id, name) VALUES (?, ?)', [id, `主人${id}`])
      res.json({
        success: true,
        data: { id, name: `主人${id}` }
      })
    } else {
      res.json({
        success: true,
        data: owners[0]
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 添加主人（客人端使用）
router.post('/add', async (req, res) => {
  try {
    const { ownerId, guestId = 'guest1' } = req.body
    
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: '主人ID不能为空'
      })
    }

    // 检查主人是否存在，不存在则创建
    const owners = await db.query('SELECT * FROM owners WHERE id = ?', [ownerId])
    if (owners.length === 0) {
      await db.run('INSERT INTO owners (id, name) VALUES (?, ?)', [ownerId, `主人${ownerId}`])
    }

    // 添加关系
    try {
      await db.run(
        'INSERT INTO guest_owners (guest_id, owner_id) VALUES (?, ?)',
        [guestId, ownerId]
      )
      res.json({
        success: true,
        message: '添加成功'
      })
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(400).json({
          success: false,
          message: '该主人已添加'
        })
      }
      throw error
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router

