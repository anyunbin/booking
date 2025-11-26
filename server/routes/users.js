// server/routes/users.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// 搜索用户（按昵称或用户名）
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query
    
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词至少2个字符'
      })
    }

    const searchKeyword = `%${keyword.trim()}%`
    
    // 搜索昵称或用户名匹配的用户
    const users = await db.query(
      `SELECT id, username, name, nickname, avatar_url, created_at 
       FROM users 
       WHERE nickname LIKE ? OR username LIKE ? OR name LIKE ?
       ORDER BY 
         CASE 
           WHEN nickname LIKE ? THEN 1
           WHEN username LIKE ? THEN 2
           ELSE 3
         END,
         nickname, username
       LIMIT 20`,
      [searchKeyword, searchKeyword, searchKeyword, searchKeyword, searchKeyword]
    )
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      nickname: user.nickname || user.name,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    }))
    
    res.json({
      success: true,
      data: formattedUsers
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 根据ID获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const users = await db.query('SELECT * FROM users WHERE id = ?', [id])
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const user = users[0]
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        nickname: user.nickname || user.name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        email: user.email,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 更新用户信息
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nickname, avatar_url, name, phone, email } = req.body

    const updates = []
    const params = []

    if (nickname !== undefined) {
      updates.push('nickname = ?')
      params.push(nickname)
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?')
      params.push(avatar_url)
    }
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      params.push(phone)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }

    updates.push('updated_at = datetime("now")')
    params.push(id)

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    await db.run(sql, params)

    // 返回更新后的用户信息
    const users = await db.query('SELECT * FROM users WHERE id = ?', [id])
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const user = users[0]
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        nickname: user.nickname || user.name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at
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

