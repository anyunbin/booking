#!/bin/bash
# 启动脚本 - 自动获取IP地址并启动服务器

echo "=========================================="
echo "  微信小程序预约系统 - 启动脚本"
echo "=========================================="
echo ""

# 获取本机IP地址
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$IP" ]; then
    echo "❌ 无法获取本机IP地址"
    echo "请手动检查网络连接"
    exit 1
fi

echo "✅ 检测到本机IP地址: $IP"
echo ""
echo "📱 手机访问配置："
echo "   请在 app.js 中设置 apiBaseUrl 为:"
echo "   http://$IP:3000/api"
echo ""
echo "⚠️  重要提示："
echo "   1. 确保手机和电脑连接在同一个WiFi网络"
echo "   2. 如果IP地址变化，需要重新修改 app.js"
echo "   3. 在微信开发者工具中，需要关闭域名校验"
echo ""
echo "=========================================="
echo "正在启动服务器..."
echo "=========================================="
echo ""

# 启动服务器
npm start
