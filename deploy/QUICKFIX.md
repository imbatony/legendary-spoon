# 快速修复指南

## 问题：安装脚本创建了错误的目录

如果您遇到类似这样的错误目录：
```
INSTALL_DIR=${INSTALL_DIR:-/opt/legendary-spoon}
```

## 🔧 解决方案

### 方法 1: 使用清理脚本（最简单）

```bash
# 下载并运行清理脚本
curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/cleanup.sh | bash

# 或者如果已经克隆了项目
cd legendary-spoon
bash deploy/cleanup.sh
```

### 方法 2: 手动清理

```bash
# 如果在当前目录
rm -rf "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"

# 如果需要 sudo 权限
sudo rm -rf "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"

# 如果在 /opt 目录下
cd /opt
sudo rm -rf "legendary-spoon/INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"
```

### 方法 3: 使用引号处理特殊字符

```bash
# 完整路径删除
sudo rm -rf './INSTALL_DIR=$'{INSTALL_DIR:-/opt/legendary-spoon}

# 或使用通配符（小心使用）
sudo rm -rf INSTALL_DIR*
```

## 🚀 重新安装

清理完成后，使用最新的安装脚本：

```bash
# 快速安装（推荐）
bash <(curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/quick-install.sh)

# 或手动安装
git clone https://github.com/imbatony/legendary-spoon.git /opt/legendary-spoon
cd /opt/legendary-spoon
bun install
bun run db:init
```

## 📋 验证清理

检查是否还有残留目录：

```bash
# 检查当前目录
ls -la | grep INSTALL

# 检查 /opt 目录
ls -la /opt | grep legendary

# 查找所有相关目录
find / -name "*legendary-spoon*" 2>/dev/null
```

## 🛡️ 预防措施

使用最新版本的脚本，这些问题已经修复：
- ✅ 正确的变量展开
- ✅ 权限检查和处理
- ✅ 更好的错误提示
- ✅ 安装前目录验证

## 💡 提示

如果遇到权限问题：
```bash
# 检查目录所有者
ls -ld /path/to/directory

# 更改所有者
sudo chown -R $USER:$USER /path/to/directory

# 更改权限
sudo chmod -R 755 /path/to/directory
```

## 📞 需要帮助？

查看完整文档：
- [部署指南](DEPLOYMENT.md)
- [GitHub Issues](https://github.com/imbatony/legendary-spoon/issues)
