# 预约系统微信小程序

一个支持好友关系的日程管理和预约系统。

## 功能特性

### 核心功能
- ✅ **统一界面**：每个人都可以管理自己的日程
- ✅ **好友系统**：添加好友后可以查看好友的公开日程
- ✅ **日程管理**：
  - 语音设置日程
  - 手动设置日程
  - 设置日程公开/不公开
- ✅ **预约功能**：预约好友的公开日程

### 主要特性
- 每个人都可以管理自己的日程
- 添加好友后，好友之间可以查看相互的公开日程
- 个人可以设置每个日程为公开或不公开
- 支持语音和手动两种方式添加日程

## 项目结构

```
booking/
├── pages/              # 小程序页面
│   ├── index/          # 首页
│   ├── schedule/       # 我的日程
│   ├── friends/        # 好友管理
│   │   ├── friends/    # 好友列表
│   │   ├── addFriend/  # 添加好友
│   │   └── friendSchedule/ # 好友日程
│   └── book/           # 预约
├── server/             # 后端服务
│   ├── index.js        # 服务器入口
│   ├── db.js           # 数据库配置
│   └── routes/         # API路由
└── app.js              # 小程序入口

```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务器

```bash
npm start
# 或使用开发模式（自动重启）
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 3. 配置小程序

1. 使用微信开发者工具打开项目
2. 在 `project.config.json` 中配置你的 `appid`
3. 在 `app.js` 中修改 `apiBaseUrl` 为你的服务器地址（如果是真机调试，需要使用局域网IP）

### 4. 运行小程序

在微信开发者工具中点击"编译"即可运行

## API接口

### 日程管理
- `GET /api/schedules?userId=xxx` - 获取自己的日程列表
- `GET /api/schedules?friendId=xxx` - 获取好友的公开日程
- `GET /api/schedules/:id` - 获取单个日程
- `POST /api/schedules` - 添加日程
- `DELETE /api/schedules/:id` - 删除日程
- `PATCH /api/schedules/:id/public` - 更新日程公开状态

### 好友管理
- `GET /api/friends?userId=xxx` - 获取好友列表
- `POST /api/friends/add` - 添加好友

### 用户管理
- `GET /api/users/:id` - 获取用户信息

### 预约请求
- `GET /api/requests` - 获取预约请求列表
- `POST /api/requests` - 创建预约请求
- `POST /api/requests/:id/approve` - 同意预约
- `POST /api/requests/:id/reject` - 驳回预约

## 数据库

项目使用 SQLite 数据库，数据库文件位于 `server/database.db`。

主要数据表：
- `users` - 用户信息
- `schedules` - 日程（包含 is_public 字段）
- `friends` - 好友关系（双向）
- `requests` - 预约请求

## 使用流程

1. **管理日程**：
   - 进入"我的日程"
   - 添加日程（语音或手动）
   - 设置日程为公开或不公开

2. **添加好友**：
   - 进入"我的好友"
   - 点击"添加好友"
   - 输入好友ID或扫描二维码

3. **查看好友日程**：
   - 在"我的好友"中点击好友
   - 查看好友的公开日程
   - 可以预约好友的公开日程

## 注意事项

1. **语音识别功能**：当前语音设置功能为演示版本，实际应用中需要集成微信语音识别API或第三方语音识别服务。

2. **用户ID**：系统会自动为每个用户生成一个唯一ID，存储在本地。

3. **数据持久化**：小程序端使用了本地存储作为备用方案，当服务器不可用时可以继续使用基本功能。

4. **真机调试**：真机调试时需要将 `apiBaseUrl` 修改为服务器的局域网IP地址。

## 开发计划

- [ ] 集成微信语音识别API
- [ ] 实现完整的用户认证系统
- [ ] 添加消息推送功能
- [ ] 优化UI/UX设计
- [ ] 添加数据统计功能

## 许可证

MIT
