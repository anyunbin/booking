// server/index.js
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const db = require('./db')

const app = express()
const PORT = 3000

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl || req.url
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  // 记录请求开始时间
  req.startTime = Date.now()
  
  // 记录请求信息
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`)
  
  // 如果有请求体，记录（但不记录敏感信息）
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body }
    // 可以在这里过滤敏感信息
    console.log(`  Body:`, JSON.stringify(bodyCopy, null, 2))
  }
  
  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    const status = res.statusCode
    const statusColor = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢'
    console.log(`${statusColor} [${timestamp}] ${method} ${url} - ${status} - ${duration}ms`)
  })
  
  next()
})

// 中间件
// 配置CORS，允许所有来源（开发环境）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// 处理预检请求
app.options('*', cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 静态文件服务（管理后台和上传文件）
const path = require('path')
app.use('/admin', express.static(path.join(__dirname, 'admin')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 路由
app.use('/api', require('./routes'))

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器错误'
  })
})

// 初始化数据库并启动服务器
db.init()
  .then(() => {
    // 监听所有网络接口，允许手机访问
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在 http://localhost:${PORT}`)
      console.log(`局域网访问: http://11.0.119.60:${PORT}`)
      console.log(`API地址: http://11.0.119.60:${PORT}/api`)
      console.log(`管理后台: http://localhost:${PORT}/admin`)
      console.log(`管理后台: http://11.0.119.60:${PORT}/admin`)
    })
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err)
    process.exit(1)
  })

