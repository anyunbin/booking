# 📚 Git 配置和使用指南

## 🎯 仓库信息

**仓库地址**：`git@github.com:anyunbin/booking.git`
**仓库类型**：SSH
**项目名称**：booking（预约系统小程序）

---

## 🚀 快速开始

### 1️⃣ 初始化本地仓库（第一次设置）

```bash
# 进入项目目录
cd /Users/anyunbin/LLM/booking

# 初始化 Git 仓库
git init

# 添加远程仓库
git remote add origin git@github.com:anyunbin/booking.git

# 验证远程仓库配置
git remote -v
```

### 2️⃣ 克隆仓库（如果还没有本地代码）

```bash
# 克隆仓库到本地
git clone git@github.com:anyunbin/booking.git

# 进入项目目录
cd booking
```

### 3️⃣ 配置 Git 用户信息

```bash
# 全局配置（推荐）
git config --global user.name "anyunbin"
git config --global user.email "your-email@example.com"

# 或仅为本项目配置
git config user.name "anyunbin"
git config user.email "your-email@example.com"

# 验证配置
git config --list
```

---

## 🔑 SSH 密钥配置

### 检查是否已有 SSH 密钥

```bash
# 检查 SSH 密钥是否存在
ls -la ~/.ssh/

# 如果看到 id_rsa 和 id_rsa.pub，说明已有密钥
```

### 生成新的 SSH 密钥（如果没有）

```bash
# 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 按照提示操作：
# 1. 输入文件保存位置（默认 ~/.ssh/id_rsa）
# 2. 输入密码（可选，按 Enter 跳过）
# 3. 确认密码
```

### 添加 SSH 密钥到 GitHub

```bash
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 然后：
# 1. 登录 GitHub
# 2. 进入 Settings → SSH and GPG keys
# 3. 点击 New SSH key
# 4. 粘贴公钥内容
# 5. 点击 Add SSH key
```

### 测试 SSH 连接

```bash
# 测试 SSH 连接
ssh -T git@github.com

# 成功会显示：
# Hi anyunbin! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 📝 常用 Git 命令

### 查看状态

```bash
# 查看当前状态
git status

# 查看详细的文件变化
git diff

# 查看提交历史
git log

# 查看简洁的提交历史
git log --oneline

# 查看最近 10 次提交
git log -10
```

### 提交代码

```bash
# 查看未暂存的变化
git status

# 添加所有变化到暂存区
git add .

# 或添加特定文件
git add filename

# 提交代码
git commit -m "提交信息"

# 推送到远程仓库
git push origin main
# 或
git push origin master
```

### 拉取代码

```bash
# 拉取远程仓库的最新代码
git pull origin main

# 或
git fetch origin
git merge origin/main
```

### 分支管理

```bash
# 查看本地分支
git branch

# 查看所有分支（包括远程）
git branch -a

# 创建新分支
git branch feature/new-feature

# 切换分支
git checkout feature/new-feature

# 创建并切换分支
git checkout -b feature/new-feature

# 删除分支
git branch -d feature/new-feature

# 强制删除分支
git branch -D feature/new-feature

# 推送分支到远程
git push origin feature/new-feature

# 删除远程分支
git push origin --delete feature/new-feature
```

---

## 📋 完整的工作流程

### 场景 1：第一次提交代码

```bash
# 1. 进入项目目录
cd /Users/anyunbin/LLM/booking

# 2. 初始化 Git 仓库
git init

# 3. 添加远程仓库
git remote add origin git@github.com:anyunbin/booking.git

# 4. 配置用户信息
git config user.name "anyunbin"
git config user.email "your-email@example.com"

# 5. 添加所有文件
git add .

# 6. 提交代码
git commit -m "Initial commit: 预约系统小程序初始版本"

# 7. 推送到远程仓库
git push -u origin main
# 如果分支是 master，使用：
# git push -u origin master
```

### 场景 2：日常开发流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建功能分支
git checkout -b feature/add-avatar-upload

# 3. 进行开发...

# 4. 查看变化
git status
git diff

# 5. 添加变化
git add .

# 6. 提交代码
git commit -m "feat: 添加头像上传功能"

# 7. 推送分支
git push origin feature/add-avatar-upload

# 8. 在 GitHub 上创建 Pull Request
# 9. 代码审查后合并到 main 分支
```

### 场景 3：修复 bug

```bash
# 1. 创建 bug 修复分支
git checkout -b bugfix/fix-friend-list-width

# 2. 修复 bug...

# 3. 提交代码
git add .
git commit -m "fix: 修复好友列表宽度问题"

# 4. 推送分支
git push origin bugfix/fix-friend-list-width

# 5. 创建 Pull Request 并合并
```

---

## 🔄 同步远程仓库

### 更新本地代码

```bash
# 方法 1：使用 pull（推荐）
git pull origin main

# 方法 2：使用 fetch + merge
git fetch origin
git merge origin/main

# 方法 3：使用 rebase（保持线性历史）
git pull --rebase origin main
```

### 推送本地代码

```bash
# 推送当前分支
git push origin main

# 推送所有分支
git push origin --all

# 推送标签
git push origin --tags

# 强制推送（谨慎使用！）
git push -f origin main
```

---

## 🏷️ 标签管理

### 创建标签

```bash
# 创建轻量级标签
git tag v1.0.0

# 创建带注释的标签
git tag -a v1.0.0 -m "版本 1.0.0 发布"

# 为历史提交创建标签
git tag v1.0.0 <commit-hash>
```

### 推送标签

```bash
# 推送单个标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

### 查看标签

```bash
# 列出所有标签
git tag

# 查看标签详情
git show v1.0.0
```

---

## 🔍 常见问题解决

### 问题 1：Permission denied (publickey)

**原因**：SSH 密钥未正确配置

**解决方案**：
```bash
# 1. 检查 SSH 密钥
ls -la ~/.ssh/

# 2. 测试 SSH 连接
ssh -T git@github.com

# 3. 如果失败，重新生成密钥
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 4. 将新密钥添加到 GitHub
```

### 问题 2：fatal: remote origin already exists

**原因**：远程仓库已经存在

**解决方案**：
```bash
# 查看现有远程仓库
git remote -v

# 删除现有远程仓库
git remote remove origin

# 添加新的远程仓库
git remote add origin git@github.com:anyunbin/booking.git
```

### 问题 3：Your branch is ahead of 'origin/main'

**原因**：本地提交未推送到远程

**解决方案**：
```bash
# 推送本地提交
git push origin main
```

### 问题 4：Merge conflict（合并冲突）

**原因**：同一文件被多人修改

**解决方案**：
```bash
# 1. 查看冲突文件
git status

# 2. 手动编辑冲突文件，解决冲突

# 3. 标记为已解决
git add <conflicted-file>

# 4. 完成合并
git commit -m "Merge: 解决合并冲突"
```

### 问题 5：需要撤销最后一次提交

**原因**：提交错误或需要修改

**解决方案**：
```bash
# 撤销最后一次提交，保留更改
git reset --soft HEAD~1

# 撤销最后一次提交，丢弃更改
git reset --hard HEAD~1

# 修改最后一次提交信息
git commit --amend -m "新的提交信息"
```

---

## 📊 提交信息规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat`：新功能
- `fix`：bug 修复
- `docs`：文档更新
- `style`：代码风格（不影响功能）
- `refactor`：代码重构
- `perf`：性能优化
- `test`：测试相关
- `chore`：构建、依赖等变化

### 示例

```bash
# 新功能
git commit -m "feat(friends): 添加头像上传功能"

# bug 修复
git commit -m "fix(friends): 修复好友列表宽度问题"

# 文档更新
git commit -m "docs: 更新 README 文档"

# 代码重构
git commit -m "refactor(schedule): 优化日程管理代码"

# 性能优化
git commit -m "perf(api): 优化 API 响应速度"
```

---

## 🛠️ 有用的 Git 配置

### 配置别名

```bash
# 添加常用命令别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --graph --oneline --all'

# 使用别名
git st          # 等同于 git status
git co main     # 等同于 git checkout main
git ci -m "msg" # 等同于 git commit -m "msg"
```

### 配置编辑器

```bash
# 使用 VS Code 作为默认编辑器
git config --global core.editor "code --wait"

# 使用 Vim 作为默认编辑器
git config --global core.editor "vim"
```

### 配置换行符

```bash
# Windows 用户
git config --global core.autocrlf true

# Mac/Linux 用户
git config --global core.autocrlf input
```

---

## 📚 .gitignore 配置

创建 `.gitignore` 文件，忽略不需要提交的文件：

```
# 依赖
node_modules/
package-lock.json

# 环境变量
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 日志
*.log
logs/

# 构建输出
dist/
build/

# 数据库
*.db
*.sqlite

# 临时文件
tmp/
temp/
```

---

## 🔐 安全建议

### 1. 不要提交敏感信息

```bash
# ❌ 不要提交
- 密码
- API 密钥
- 数据库凭证
- 个人信息

# ✅ 使用环境变量
- 创建 .env 文件（添加到 .gitignore）
- 使用 .env.example 作为模板
```

### 2. 定期更新依赖

```bash
# 检查过期的依赖
npm outdated

# 更新依赖
npm update

# 更新到最新版本
npm install <package>@latest
```

### 3. 使用 SSH 而不是 HTTPS

```bash
# ✅ 推荐：SSH
git clone git@github.com:anyunbin/booking.git

# ❌ 不推荐：HTTPS（需要输入密码）
git clone https://github.com/anyunbin/booking.git
```

---

## 📖 有用的资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助文档](https://docs.github.com)
- [Git 教程](https://www.atlassian.com/git/tutorials)
- [Git 速查表](https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf)

---

## ✅ 检查清单

在第一次推送代码前，请确保：

- [ ] SSH 密钥已配置
- [ ] SSH 连接已测试成功
- [ ] Git 用户信息已配置
- [ ] 远程仓库地址正确
- [ ] .gitignore 文件已创建
- [ ] 敏感信息未被提交
- [ ] 提交信息清晰明确
- [ ] 代码已本地测试

---

## 🚀 快速命令参考

```bash
# 初始化和配置
git init
git remote add origin git@github.com:anyunbin/booking.git
git config user.name "anyunbin"
git config user.email "your-email@example.com"

# 日常开发
git status
git add .
git commit -m "message"
git push origin main
git pull origin main

# 分支管理
git branch
git checkout -b feature/name
git push origin feature/name

# 查看历史
git log --oneline
git show <commit>

# 撤销操作
git reset --soft HEAD~1
git revert <commit>
```

---

**版本**：1.0.0
**最后更新**：2025年11月26日

---

**需要帮助？** 查看上面的常见问题解决部分或访问 [Git 官方文档](https://git-scm.com/doc)

