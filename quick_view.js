// quick_view.js - 快速查看数据库
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, 'server', 'database.db')

console.log('='.repeat(60))
console.log('快速查看数据库')
console.log('='.repeat(60))
console.log('')

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err)
    process.exit(1)
  }

  // 统计各表数据量
  db.all(`
    SELECT 'users' as table_name, COUNT(*) as count FROM users
    UNION ALL SELECT 'schedules', COUNT(*) FROM schedules
    UNION ALL SELECT 'friends', COUNT(*) FROM friends
    UNION ALL SELECT 'requests', COUNT(*) FROM requests
  `, (err, stats) => {
    if (err) {
      console.error('查询失败:', err)
      db.close()
      return
    }

    console.log('📊 数据统计:')
    stats.forEach(stat => {
      console.log(`  ${stat.table_name}: ${stat.count} 条记录`)
    })
    console.log('')

    // 查看日程详情
    db.all(`
      SELECT 
        s.id,
        s.user_id,
        COALESCE(u.name, '未知用户') as owner_name,
        s.date,
        s.start_time || '-' || s.end_time as time_slot,
        s.status,
        CASE WHEN s.is_public = 1 THEN '公开' ELSE '不公开' END as visibility
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.date, s.start_time
      LIMIT 20
    `, (err, schedules) => {
      if (err) {
        console.error('查询日程失败:', err)
        db.close()
        return
      }

      if (schedules.length > 0) {
        console.log('📅 日程列表（最近20条）:')
        schedules.forEach(s => {
          console.log(`  [${s.id}] ${s.date} ${s.time_slot} - ${s.owner_name} (${s.status}, ${s.visibility})`)
        })
      } else {
        console.log('📅 日程列表: (空)')
      }
      console.log('')

      // 查看好友关系
      db.all(`
        SELECT 
          COALESCE(u1.name, f.user_id) as user_name,
          COALESCE(u2.name, f.friend_id) as friend_name
        FROM friends f
        LEFT JOIN users u1 ON f.user_id = u1.id
        LEFT JOIN users u2 ON f.friend_id = u2.id
        LIMIT 10
      `, (err, friends) => {
        if (err) {
          console.error('查询好友失败:', err)
          db.close()
          return
        }

        if (friends.length > 0) {
          console.log('👫 好友关系（最近10条）:')
          friends.forEach(f => {
            console.log(`  ${f.user_name} <-> ${f.friend_name}`)
          })
        } else {
          console.log('👫 好友关系: (空)')
        }
        console.log('')
        console.log('='.repeat(60))
        db.close()
      })
    })
  })
})
