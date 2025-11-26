// 批量注册用户脚本
const http = require('http');

// 配置
const API_BASE_URL = 'http://localhost:3000';
const TOTAL_USERS = 100;

// 生成随机用户名
function generateUsername() {
  const adjectives = ['happy', 'smart', 'quick', 'bright', 'swift', 'calm', 'bold', 'cool', 'kind', 'nice'];
  const nouns = ['cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'eagle', 'wolf', 'bear', 'fox'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}_${noun}_${num}`;
}

// 生成随机昵称
function generateNickname() {
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '吴', '周'];
  const lastNames = ['小', '大', '老', '新', '真', '假', '好', '坏', '快', '慢'];
  const numbers = Math.floor(Math.random() * 100);
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]}${lastNames[Math.floor(Math.random() * lastNames.length)]}${numbers}`;
}

// 发送注册请求
function registerUser(username, password, nickname) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password,
      nickname: nickname
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  console.log(`开始注册 ${TOTAL_USERS} 个用户...`);
  console.log('');

  let successCount = 0;
  let failCount = 0;
  const users = [];

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const username = generateUsername();
    const password = 'password123'; // 统一密码便于测试
    const nickname = generateNickname();

    try {
      const result = await registerUser(username, password, nickname);

      if (result.success) {
        successCount++;
        users.push({
          username: username,
          password: password,
          nickname: nickname
        });
        console.log(`✓ [${i}/${TOTAL_USERS}] 注册成功: ${username} (${nickname})`);
      } else {
        failCount++;
        console.log(`✗ [${i}/${TOTAL_USERS}] 注册失败: ${username} - ${result.message}`);
      }
    } catch (error) {
      failCount++;
      console.log(`✗ [${i}/${TOTAL_USERS}] 注册出错: ${username} - ${error.message}`);
    }

    // 每个请求间隔100ms，避免过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`注册完成！`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log('='.repeat(50));
  console.log('');
  console.log('已注册的用户信息（用于测试登录）:');
  console.log(JSON.stringify(users.slice(0, 10), null, 2));
  console.log(`... 还有 ${Math.max(0, users.length - 10)} 个用户`);
}

// 运行
main().catch(console.error);

