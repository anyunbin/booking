// 测试 API 连接脚本
const http = require('http')

// 测试登录接口
function testLogin() {
  const postData = JSON.stringify({
    username: 'testuser',
    password: 'testpass123'
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = http.request(options, (res) => {
    console.log(`\n登录接口测试:`)
    console.log(`状态码: ${res.statusCode}`)
    console.log(`响应头: ${JSON.stringify(res.headers)}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log(`响应体: ${data}`)

      // 测试注册接口
      testRegister()
    })
  })

  req.on('error', (e) => {
    console.error(`登录接口错误: ${e.message}`)
    process.exit(1)
  })

  req.write(postData)
  req.end()
}

// 测试注册接口
function testRegister() {
  const postData = JSON.stringify({
    username: 'newuser' + Date.now(),
    password: 'password123',
    nickname: '测试用户'
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = http.request(options, (res) => {
    console.log(`\n注册接口测试:`)
    console.log(`状态码: ${res.statusCode}`)
    console.log(`响应头: ${JSON.stringify(res.headers)}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log(`响应体: ${data}`)

      // 测试用户查询接口
      testGetUser()
    })
  })

  req.on('error', (e) => {
    console.error(`注册接口错误: ${e.message}`)
    process.exit(1)
  })

  req.write(postData)
  req.end()
}

// 测试获取用户接口
function testGetUser() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/search?keyword=test',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const req = http.request(options, (res) => {
    console.log(`\n用户搜索接口测试:`)
    console.log(`状态码: ${res.statusCode}`)
    console.log(`响应头: ${JSON.stringify(res.headers)}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log(`响应体: ${data}`)
      console.log(`\n✅ 所有接口测试完成！`)
      process.exit(0)
    })
  })

  req.on('error', (e) => {
    console.error(`用户搜索接口错误: ${e.message}`)
    process.exit(1)
  })

  req.end()
}

console.log('开始测试 API 接口...')
console.log('服务器地址: http://localhost:3000')
testLogin()

