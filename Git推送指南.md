# 🚀 Git 推送指南

## 📋 当前状态

- **仓库地址**：git@github.com:anyunbin/booking.git
- **分支**：master
- **状态**：工作区干净，所有文件已提交

---

## 🔧 推送代码的两种方式

### 方式 1️⃣：使用 SSH（推荐）

#### 前置条件
- SSH 密钥已生成
- 公钥已添加到 GitHub

#### 推送步骤

```bash
# 1. 进入项目目录
cd /Users/anyunbin/LLM/booking

# 2. 确保远程仓库配置为 SSH
git remote set-url origin git@github.com:anyunbin/booking.git

# 3. 推送代码
git push origin master

# 或推送所有分支
git push origin --all
```

#### 如果遇到 SSH 密钥问题

```bash
# 1. 检查 SSH 密钥
ls -la ~/.ssh/id_rsa

# 2. 如果没有，生成新的 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "anyunbin@meituan.com"

# 3. 添加公钥到 GitHub
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 然后：
# - 登录 GitHub
# - 进入 Settings → SSH and GPG keys
# - 点击 New SSH key
# - 粘贴公钥内容
# - 点击 Add SSH key

# 4. 测试 SSH 连接
ssh -T git@github.com

# 5. 推送代码
git push origin master
```

---

### 方式 2️⃣：使用 HTTPS（备选）

#### 推送步骤

```bash
# 1. 进入项目目录
cd /Users/anyunbin/LLM/booking

# 2. 切换到 HTTPS
git remote set-url origin https://github.com/anyunbin/booking.git

# 3. 推送代码
git push origin master

# 4. 输入 GitHub 用户名和密码
# 用户名：anyunbin
# 密码：你的 GitHub 密码或 Personal Access Token
```

#### 使用 Personal Access Token（推荐）

```bash
# 1. 在 GitHub 生成 Personal Access Token
# - 登录 GitHub
# - 进入 Settings → Developer settings → Personal access tokens
# - 点击 Generate new token
# - 选择 repo 权限
# - 生成 token

# 2. 推送时使用 token 作为密码
git push origin master
# 用户名：anyunbin
# 密码：<你的 Personal Access Token>
```

---

## 📝 完整推送流程

### 步骤 1：检查状态

```bash
cd /Users/anyunbin/LLM/booking
git status
```

**预期输出**：
```
位于分支 master
无文件要提交，干净的工作区
```

### 步骤 2：查看远程仓库

```bash
git remote -v
```

**预期输出**：
```
origin  git@github.com:anyunbin/booking.git (fetch)
origin  git@github.com:anyunbin/booking.git (push)
```

### 步骤 3：推送代码

```bash
git push origin master
```

**成功输出**：
```
Everything up-to-date
```

或

```
Counting objects: 100% (XX/XX)
Delta compression using up to 8 threads
Compressing objects: 100% (XX/XX)
Writing objects: 100% (XX/XX)
Total XX (delta XX), reused XX (delta XX)
remote: Resolving deltas: 100% (XX/XX), done.
To github.com:anyunbin/booking.git
   xxxxxxx..xxxxxxx  master -> master
```

---

## 🔍 常见问题

### Q1：Permission denied (publickey)

**原因**：SSH 密钥未正确配置

**解决方案**：
```bash
# 方案 A：使用 HTTPS
git remote set-url origin https://github.com/anyunbin/booking.git
git push origin master

# 方案 B：修复 SSH 密钥
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
ssh -T git@github.com
```

### Q2：fatal: 'origin' does not appear to be a 'git' repository

**原因**：不在 Git 仓库目录中

**解决方案**：
```bash
cd /Users/anyunbin/LLM/booking
git push origin master
```

### Q3：fatal: The current branch master has no upstream branch

**原因**：分支未关联远程分支

**解决方案**：
```bash
git push -u origin master
```

### Q4：Everything up-to-date

**原因**：所有提交都已推送

**解决方案**：
```bash
# 检查是否有新的提交
git log --oneline -5

# 如果有新提交，再次推送
git push origin master
```

---

## 📊 推送前检查清单

- [ ] 已进入项目目录：`/Users/anyunbin/LLM/booking`
- [ ] 工作区干净：`git status` 显示 "干净的工作区"
- [ ] 远程仓库配置正确：`git remote -v` 显示正确的 URL
- [ ] SSH 密钥已配置或使用 HTTPS
- [ ] 网络连接正常

---

## 🚀 快速推送命令

### 一键推送（假设所有配置都正确）

```bash
cd /Users/anyunbin/LLM/booking && git push origin master
```

### 推送所有分支

```bash
git push origin --all
```

### 推送所有标签

```bash
git push origin --tags
```

### 强制推送（谨慎使用）

```bash
git push -f origin master
```

---

## 💡 推送后验证

### 验证推送成功

```bash
# 1. 查看远程分支
git branch -r

# 2. 查看最新提交
git log --oneline -5

# 3. 访问 GitHub 网页
# https://github.com/anyunbin/booking
```

### 查看推送历史

```bash
git reflog
```

---

## 📞 需要帮助？

### 查看 Git 配置

```bash
git config --list
```

### 查看 SSH 配置

```bash
cat ~/.ssh/config
```

### 测试 SSH 连接

```bash
ssh -T git@github.com
```

### 查看 Git 日志

```bash
git log --oneline -10
```

---

## 🎯 推荐流程

### 日常开发

```bash
# 1. 进入项目目录
cd /Users/anyunbin/LLM/booking

# 2. 查看状态
git status

# 3. 添加文件
git add .

# 4. 提交代码
git commit -m "feat: 描述你的改动"

# 5. 推送代码
git push origin master
```

### 定期推送

```bash
# 每天结束时推送一次
git push origin master

# 每周推送一次总结
git push origin master
```

---

**版本**：1.0.0
**最后更新**：2025年11月26日
**推荐方式**：SSH（安全）或 HTTPS（简单）

