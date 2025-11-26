// clear_schedules.js - 清空所有日程
const db = require('./server/db')

async function clearSchedules() {
  try {
    await db.init()
    
    // 删除所有日程
    const result = await db.run('DELETE FROM schedules')
    
    console.log(`成功删除 ${result.changes} 条日程记录`)
    
    // 可选：也清空预约请求表
    const requestsResult = await db.run('DELETE FROM requests')
    console.log(`成功删除 ${requestsResult.changes} 条预约请求记录`)
    
    console.log('数据库清空完成')
    process.exit(0)
  } catch (error) {
    console.error('清空数据库失败:', error)
    process.exit(1)
  }
}

clearSchedules()

