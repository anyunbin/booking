// server/routes/friends.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 获取好友列表
router.get('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query
    
    const friends = await db.query(
      `SELECT u.id, u.username, u.name, u.nickname, u.avatar_url, u.created_at 
       FROM users u
       INNER JOIN friends f ON u.id = f.friend_id
       WHERE f.user_id = ?
       ORDER BY u.nickname, u.name`,
      [userId]
    )
    
    // 格式化返回数据
    const formattedFriends = friends.map(friend => ({
      id: friend.id,
      username: friend.username,
      name: friend.name,
      nickname: friend.nickname || friend.name,
      avatar_url: friend.avatar_url,
      created_at: friend.created_at
    }))
    
    res.json({
      success: true,
      data: formattedFriends
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 添加好友
router.post('/add', async (req, res) => {
  try {
    const { friendId, userId = 'default' } = req.body
    
    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: '好友ID不能为空'
      })
    }

    if (friendId === userId) {
      return res.status(400).json({
        success: false,
        message: '不能添加自己为好友'
      })
    }

    // 检查好友是否存在，不存在则创建
    const users = await db.query('SELECT * FROM users WHERE id = ?', [friendId])
    if (users.length === 0) {
      await db.run('INSERT INTO users (id, name) VALUES (?, ?)', [friendId, `用户${friendId}`])
    }

    // 检查是否已经是好友
    const existing = await db.query(
      'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
      [userId, friendId]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该用户已经是您的好友'
      })
    }

    // 添加双向好友关系
    await db.run(
      'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
      [userId, friendId]
    )
    
    await db.run(
      'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
      [friendId, userId]
    )

    res.json({
      success: true,
      message: '添加成功'
    })
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        message: '该用户已经是您的好友'
      })
    }
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router

