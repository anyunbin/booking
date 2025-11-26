// migrate_to_username_password.js - 数据库迁移脚本
// 将users表从旧结构迁移到支持用户名密码的结构

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, 'server', 'database.db')

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    process.exit(1)
  }
  
  console.log('开始数据库迁移...')
  console.log('')
  
  // 检查表是否存在
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('检查表失败:', err)
      process.exit(1)
    }
    
    if (!row) {
      console.log('users表不存在，将在首次运行时自动创建')
      process.exit(0)
    }
    
    // 检查表结构
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('获取表结构失败:', err)
        process.exit(1)
      }
      
      const columnNames = columns.map(col => col.name)
      const hasUsername = columnNames.includes('username')
      const hasPassword = columnNames.includes('password')
      
      if (hasUsername && hasPassword) {
        console.log('✅ 表结构已是最新，无需迁移')
        process.exit(0)
      }
      
      console.log('当前表结构:', columnNames.join(', '))
      console.log('')
      
      // 开始迁移
      migrateTable(columnNames)
    })
  })
})

function migrateTable(existingColumns) {
  console.log('步骤1: 创建新表 users_new...')
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
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
    
    console.log('✅ 新表创建成功')
    console.log('')
    
    // 迁移数据
    console.log('步骤2: 迁移现有数据...')
    
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        console.error('查询旧数据失败:', err)
        process.exit(1)
      }
      
      console.log(`找到 ${rows.length} 条用户记录`)
      
      if (rows.length === 0) {
        console.log('没有数据需要迁移，直接替换表')
        replaceTable()
        return
      }
      
      let completed = 0
      let errors = 0
      
      rows.forEach((row) => {
        // 为旧用户生成用户名和密码
        const username = row.username || `user_${row.id}`
        const password = row.password || 'default_password_' + row.id
        
        // 如果已经有username和password，使用现有的
        const finalUsername = existingColumns.includes('username') ? row.username : username
        const finalPassword = existingColumns.includes('password') ? row.password : password
        
        db.run(`
          INSERT INTO users_new (
            id, username, password, nickname, avatar_url, name, 
            phone, email, created_at, updated_at, last_login_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          row.id,
          finalUsername,
          finalPassword,
          row.nickname || row.name,
          row.avatar_url || null,
          row.name,
          row.phone || null,
          row.email || null,
          row.created_at || new Date().toISOString(),
          row.updated_at || new Date().toISOString(),
          row.last_login_at || null
        ], (err) => {
          if (err) {
            console.error(`迁移用户 ${row.id} 失败:`, err.message)
            errors++
          } else {
            completed++
          }
          
          if (completed + errors === rows.length) {
            console.log(`✅ 数据迁移完成: 成功 ${completed} 条, 失败 ${errors} 条`)
            console.log('')
            replaceTable()
          }
        })
      })
    })
  })
}

function replaceTable() {
  console.log('步骤3: 替换表结构...')
  
  // 备份旧表
  db.run('ALTER TABLE users RENAME TO users_old_backup', (err) => {
    if (err) {
      console.error('备份旧表失败:', err)
      process.exit(1)
    }
    
    console.log('✅ 旧表已备份为 users_old_backup')
    
    // 重命名新表
    db.run('ALTER TABLE users_new RENAME TO users', (err) => {
      if (err) {
        console.error('重命名新表失败:', err)
        process.exit(1)
      }
      
      console.log('✅ 新表已重命名为 users')
      console.log('')
      console.log('='.repeat(60))
      console.log('✅ 数据库迁移完成！')
      console.log('='.repeat(60))
      console.log('')
      console.log('注意：')
      console.log('- 旧表已备份为 users_old_backup')
      console.log('- 如果迁移的用户没有username，已自动生成')
      console.log('- 如果迁移的用户没有password，已设置默认密码')
      console.log('- 建议用户重新设置密码')
      console.log('')
      
      process.exit(0)
    })
  })
}

