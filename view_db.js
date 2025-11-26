// view_db.js - 查看数据库内容的脚本
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, 'server', 'database.db')

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    process.exit(1)
  }
  
  console.log('='.repeat(60))
  console.log('数据库内容查看')
  console.log('='.repeat(60))
  console.log('')
  
  // 查看所有表
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('查询表失败:', err)
      return
    }
    
    console.log('📊 数据表列表:')
    tables.forEach(table => {
      console.log(`  - ${table.name}`)
    })
    console.log('')
    
    // 查看用户表
    db.all("SELECT * FROM users", (err, users) => {
      if (err) {
        console.log('⚠️  用户表查询失败（可能不存在）')
      } else {
        console.log('👥 用户表 (users):')
        if (users.length === 0) {
          console.log('  (空)')
        } else {
          users.forEach(user => {
            console.log(`  ID: ${user.id}, 名称: ${user.name}, 创建时间: ${user.created_at}`)
          })
        }
        console.log('')
      }
      
      // 查看日程表
      db.all("SELECT * FROM schedules LIMIT 10", (err, schedules) => {
        if (err) {
          console.log('⚠️  日程表查询失败:', err.message)
        } else {
          console.log('📅 日程表 (schedules):')
          if (schedules.length === 0) {
            console.log('  (空)')
          } else {
            schedules.forEach(schedule => {
              const ownerId = schedule.owner_id || schedule.user_id || 'N/A'
              const isPublic = schedule.is_public !== undefined ? (schedule.is_public ? '公开' : '不公开') : '未知'
              console.log(`  ID: ${schedule.id}, 用户: ${ownerId}, 日期: ${schedule.date}`)
              console.log(`      时间: ${schedule.start_time}-${schedule.end_time}, 状态: ${schedule.status}, 公开: ${isPublic}`)
            })
          }
          console.log('')
        }
        
        // 查看好友表
        db.all("SELECT * FROM friends", (err, friends) => {
          if (err) {
            console.log('⚠️  好友表查询失败（可能不存在）')
          } else {
            console.log('👫 好友关系表 (friends):')
            if (friends.length === 0) {
              console.log('  (空)')
            } else {
              friends.forEach(friend => {
                console.log(`  用户 ${friend.user_id} <-> 好友 ${friend.friend_id}`)
              })
            }
            console.log('')
          }
          
          // 查看预约请求表
          db.all("SELECT * FROM requests LIMIT 10", (err, requests) => {
            if (err) {
              console.log('⚠️  预约请求表查询失败（可能不存在）')
            } else {
              console.log('📋 预约请求表 (requests):')
              if (requests.length === 0) {
                console.log('  (空)')
              } else {
                requests.forEach(req => {
                  console.log(`  ID: ${req.id}, 日程ID: ${req.schedule_id}`)
                  console.log(`      客人: ${req.guest_name} (${req.guest_id}), 状态: ${req.status}`)
                  console.log(`      时间: ${req.date} ${req.start_time}-${req.end_time}`)
                })
              }
              console.log('')
            }
            
            console.log('='.repeat(60))
            db.close()
          })
        })
      })
    })
  })
})

