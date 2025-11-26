// migrate_db.js - 数据库迁移脚本
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
  
  // 检查schedules表是否有is_public字段
  db.all("PRAGMA table_info(schedules)", (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err)
      db.close()
      return
    }
    
    const hasIsPublic = columns.some(col => col.name === 'is_public')
    const hasUserId = columns.some(col => col.name === 'user_id')
    const hasOwnerId = columns.some(col => col.name === 'owner_id')
    
    console.log('当前schedules表结构:')
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`)
    })
    console.log('')
    
    if (!hasIsPublic || !hasUserId) {
      console.log('需要迁移schedules表...')
      
      // 创建新表
      db.run(`
        CREATE TABLE IF NOT EXISTS schedules_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          status TEXT DEFAULT 'available',
          is_public INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('创建新表失败:', err)
          db.close()
          return
        }
        
        console.log('✅ 新表创建成功')
        
        // 迁移数据（如果有owner_id，转换为user_id）
        if (hasOwnerId) {
          db.run(`
            INSERT INTO schedules_new (id, user_id, date, start_time, end_time, status, is_public, created_at)
            SELECT id, owner_id as user_id, date, start_time, end_time, status, 1 as is_public, created_at
            FROM schedules
          `, (err) => {
            if (err) {
              console.error('迁移数据失败:', err)
              db.close()
              return
            }
            
            console.log('✅ 数据迁移成功')
            
            // 删除旧表，重命名新表
            db.run('DROP TABLE schedules', (err) => {
              if (err) {
                console.error('删除旧表失败:', err)
                db.close()
                return
              }
              
              db.run('ALTER TABLE schedules_new RENAME TO schedules', (err) => {
                if (err) {
                  console.error('重命名表失败:', err)
                  db.close()
                  return
                }
                
                console.log('✅ 表迁移完成')
                console.log('')
                console.log('迁移完成！')
                db.close()
              })
            })
          })
        } else {
          // 如果没有旧数据，直接删除旧表重命名
          db.run('DROP TABLE schedules', () => {
            db.run('ALTER TABLE schedules_new RENAME TO schedules', (err) => {
              if (err) {
                console.error('重命名表失败:', err)
                db.close()
                return
              }
              
              console.log('✅ 表迁移完成')
              console.log('')
              console.log('迁移完成！')
              db.close()
            })
          })
        }
      })
    } else {
      console.log('✅ schedules表结构已是最新，无需迁移')
      db.close()
    }
  })
})

