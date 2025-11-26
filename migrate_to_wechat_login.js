// migrate_to_wechat_login.js - 数据库迁移脚本
// 将现有的users表迁移到支持微信登录的结构

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, 'server', 'database.db')

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    process.exit(1)
  }
  
  console.log('开始数据库迁移...')
  
  // 1. 创建新表
  db.run(`
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      openid TEXT UNIQUE,
      unionid TEXT,
      nickname TEXT,
      avatar_url TEXT,
      name TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('创建新表失败:', err)
      process.exit(1)
    }
    
    console.log('新表创建成功')
    
    // 2. 迁移现有数据
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        console.error('查询旧数据失败:', err)
        process.exit(1)
      }
      
      console.log(`找到 ${rows.length} 条用户记录`)
      
      if (rows.length === 0) {
        // 没有数据，直接替换表
        replaceTable()
        return
      }
      
      // 迁移数据
      let completed = 0
      rows.forEach((row) => {
        db.run(`
          INSERT INTO users_new (id, name, nickname, created_at)
          VALUES (?, ?, ?, ?)
        `, [row.id, row.name, row.name, row.created_at || new Date().toISOString()], (err) => {
          if (err) {
            console.error(`迁移用户 ${row.id} 失败:`, err)
          }
          completed++
          if (completed === rows.length) {
            console.log('数据迁移完成')
            replaceTable()
          }
        })
      })
    })
  })
})

function replaceTable() {
  // 3. 备份旧表
  db.run('ALTER TABLE users RENAME TO users_old', (err) => {
    if (err) {
      console.error('重命名旧表失败:', err)
      process.exit(1)
    }
    
    console.log('旧表已备份为 users_old')
    
    // 4. 重命名新表
    db.run('ALTER TABLE users_new RENAME TO users', (err) => {
      if (err) {
        console.error('重命名新表失败:', err)
        process.exit(1)
      }
      
      console.log('✅ 数据库迁移完成！')
      console.log('旧表已备份为 users_old，如需恢复可以手动操作')
      process.exit(0)
    })
  })
}

