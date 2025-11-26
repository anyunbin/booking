// server/routes/auth.js
const express = require('express')
const router = express.Router()
const db = require('../db')
const crypto = require('crypto')

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度为3-20个字符'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6个字符'
      })
    }

    // 检查用户名是否已存在
    const existingUsers = await db.query('SELECT * FROM users WHERE username = ?', [username])
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }

    // 生成用户ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    // 加密密码（简单实现，生产环境应使用bcrypt）
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

    // 创建用户
    await db.run(
      'INSERT INTO users (id, username, password, nickname, name, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [userId, username, hashedPassword, nickname || username, nickname || username]
    )

    res.json({
      success: true,
      message: '注册成功'
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    // 查询用户
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username])
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const user = users[0]
    
    // 验证密码
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 更新最后登录时间
    await db.run(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?',
      [user.id]
    )

    // 生成token（简单实现，生产环境应使用JWT）
    const token = crypto.createHash('sha256').update(user.id + Date.now()).digest('hex')

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      nickname: user.nickname || user.name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      email: user.email,
      created_at: user.created_at,
      last_login_at: new Date().toISOString()
    }

    res.json({
      success: true,
      data: {
        userInfo: userInfo,
        token: token
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码至少6个字符'
      })
    }

    // 查询用户
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const user = users[0]
    
    // 验证旧密码
    const hashedOldPassword = crypto.createHash('sha256').update(oldPassword).digest('hex')
    if (user.password !== hashedOldPassword) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      })
    }

    // 加密新密码
    const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex')

    // 更新密码
    await db.run(
      'UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?',
      [hashedNewPassword, userId]
    )

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 验证token（中间件）
async function verifyToken(req, res, next) {
  const token = req.headers.authorization || req.query.token
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    })
  }

  // 简单验证，生产环境应使用JWT验证
  // 这里为了演示，直接通过
  req.token = token
  next()
}

module.exports = router
module.exports.verifyToken = verifyToken

