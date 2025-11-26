/**
 * 管理员认证中间件
 * 用于保护管理后台的所有 API 端点
 */

const adminAuth = (req, res, next) => {
  // 从环境变量中获取管理员密码
  // 如果没有设置环境变量，使用默认密码（仅用于开发）
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  // 从请求头中获取密码
  const password = req.headers['x-admin-password']

  // 如果没有在请求头中，尝试从查询参数中获取（不推荐，仅用于测试）
  const passwordFromQuery = req.query.adminPassword

  const providedPassword = password || passwordFromQuery

  // 验证密码
  if (!providedPassword || providedPassword !== adminPassword) {
    console.warn(`[管理员认证失败] IP: ${req.ip}, 时间: ${new Date().toISOString()}`)
    return res.status(401).json({
      success: false,
      message: '未授权：管理员密码错误或未提供'
    })
  }

  // 密码正确，记录日志并继续处理请求
  console.log(`[管理员认证成功] IP: ${req.ip}, 路径: ${req.path}, 时间: ${new Date().toISOString()}`)
  next()
}

module.exports = adminAuth

