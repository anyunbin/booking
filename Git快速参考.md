# 🚀 Git 快速参考

## 📍 仓库信息

```
仓库地址：git@github.com:anyunbin/booking.git
仓库类型：SSH
项目名称：booking（预约系统小程序）
用户名：anyunbin
邮箱：anyunbin@meituan.com
```

---

## ⚡ 最常用的 5 个命令

### 1. 查看状态
```bash
git status
```

### 2. 添加文件
```bash
git add .
```

### 3. 提交代码
```bash
git commit -m "feat: 添加新功能"
```

### 4. 推送到远程
```bash
git push origin main
```

### 5. 拉取最新代码
```bash
git pull origin main
```

---

## 📋 日常工作流程

### 开始工作
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 进行开发...
```

### 提交代码
```bash
# 1. 查看变化
git status

# 2. 添加文件
git add .

# 3. 提交代码
git commit -m "feat: 描述你的改动"

# 4. 推送分支
git push origin feature/your-feature-name
```

### 合并代码
```bash
# 1. 在 GitHub 上创建 Pull Request
# 2. 代码审查
# 3. 合并到 main 分支
# 4. 删除功能分支
git branch -d feature/your-feature-name
```

---

## 🔧 常用命令速查

| 命令 | 说明 |
|------|------|
| `git status` | 查看当前状态 |
| `git add .` | 添加所有文件 |
| `git commit -m "msg"` | 提交代码 |
| `git push origin main` | 推送到远程 |
| `git pull origin main` | 拉取最新代码 |
| `git branch` | 查看分支 |
| `git checkout -b name` | 创建并切换分支 |
| `git log --oneline` | 查看提交历史 |
| `git diff` | 查看文件变化 |
| `git reset --soft HEAD~1` | 撤销最后一次提交 |

---

## 📝 提交信息规范

```bash
# 新功能
git commit -m "feat: 添加头像上传功能"

# bug 修复
git commit -m "fix: 修复好友列表宽度问题"

# 文档更新
git commit -m "docs: 更新 README 文档"

# 代码重构
git commit -m "refactor: 优化日程管理代码"

# 性能优化
git commit -m "perf: 优化 API 响应速度"
```

---

## 🆘 常见问题快速解决

### SSH 连接失败
```bash
# 测试 SSH 连接
ssh -T git@github.com

# 如果失败，检查 SSH 密钥
ls -la ~/.ssh/
```

### 远程仓库已存在
```bash
# 删除现有远程仓库
git remote remove origin

# 添加新的远程仓库
git remote add origin git@github.com:anyunbin/booking.git
```

### 需要撤销提交
```bash
# 撤销最后一次提交，保留更改
git reset --soft HEAD~1

# 撤销最后一次提交，丢弃更改
git reset --hard HEAD~1
```

### 合并冲突
```bash
# 1. 手动编辑冲突文件
# 2. 标记为已解决
git add <conflicted-file>

# 3. 完成合并
git commit -m "Merge: 解决合并冲突"
```

---

## 🔐 安全提示

✅ **应该做**
- 使用 SSH 而不是 HTTPS
- 定期更新依赖
- 不提交敏感信息
- 使用 .gitignore 忽略不需要的文件

❌ **不应该做**
- 不要提交密码或 API 密钥
- 不要使用 `git push -f`（强制推送）
- 不要在提交信息中包含敏感信息
- 不要忽视 .gitignore 文件

---

## 📚 详细文档

查看 `Git配置指南.md` 获取完整的 Git 配置和使用说明。

---

**快速链接**
- 🔗 [GitHub 仓库](https://github.com/anyunbin/booking)
- 📖 [Git 官方文档](https://git-scm.com/doc)
- 💬 [GitHub 帮助](https://docs.github.com)

---

**最后更新**：2025年11月26日

