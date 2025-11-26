// server/db.js
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, 'database.db')

let db = null

function init() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('数据库连接失败:', err)
        reject(err)
        return
      }
      console.log('数据库连接成功')
      createTables().then(resolve).catch(reject)
    })
  })
}

function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // 用户表（支持用户名密码登录）
      `CREATE TABLE IF NOT EXISTS users (
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
      )`,
      
      // 日程表
      `CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        is_public INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 预约请求表
      `CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        owner_id TEXT NOT NULL,
        guest_id TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        note TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
      )`,
      
      // 好友关系表（双向关系）
      `CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )`
    ]

    let completed = 0
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`创建表失败 (${index}):`, err)
          reject(err)
          return
        }
        completed++
        if (completed === tables.length) {
          console.log('数据库表创建完成')
          resolve()
        }
      })
    })
  })
}

function getDB() {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

// 封装查询方法
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve({ id: this.lastID, changes: this.changes })
      }
    })
  })
}

module.exports = {
  init,
  getDB,
  query,
  run
}

