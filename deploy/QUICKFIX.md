# 快速修复指南

## 常见问题和解决方案

### 问题 1：systemd 服务 NAMESPACE 错误

**错误信息**:
```
Failed to set up mount namespacing: /run/systemd/unit-root/opt/legendary-spoon/data: No such file or directory
Failed at step NAMESPACE spawning /home/user/.bun/bin/bun
```

**原因**: 
1. `data` 或 `uploads` 目录不存在
2. systemd 的 `ProtectSystem=strict` 和 `ReadWritePaths` 配置冲突

**解决方案**:

```bash
# 方法 1：重新运行安装脚本（推荐）
cd /opt/legendary-spoon
git pull
bash deploy/quick-install.sh

# 方法 2：手动创建目录并重启
sudo mkdir -p /opt/legendary-spoon/data
sudo mkdir -p /opt/legendary-spoon/uploads
sudo chown -R $USER:$USER /opt/legendary-spoon/data /opt/legendary-spoon/uploads
sudo systemctl restart legendary-spoon

# 检查状态
sudo systemctl status legendary-spoon
```

### 问题 2：systemd 服务找不到 Bun 可执行文件

**错误信息**:
```
Failed to locate executable /home/user/.bun/bin/bun
Failed at step EXEC spawning /home/user/.bun/bin/bun
```

**原因**: Bun 路径配置不正确或 systemd 无法访问用户目录

**解决方案**:

```bash
# 1. 检查 Bun 实际路径
which bun

# 2. 编辑服务文件
sudo nano /etc/systemd/system/legendary-spoon.service

# 3. 修改 ExecStart 行为实际的 Bun 路径
# 例如: ExecStart=/home/azureuser/.bun/bin/bun run src/index.ts

# 4. 确保 PATH 环境变量包含 Bun 目录
# 添加或修改这一行:
# Environment="PATH=/home/azureuser/.bun/bin:/usr/local/bin:/usr/bin:/bin"

# 5. 重载并重启服务
sudo systemctl daemon-reload
sudo systemctl restart legendary-spoon

# 6. 检查状态
sudo systemctl status legendary-spoon
```

**快速修复（推荐）**:

```bash
# 运行诊断脚本
bash deploy/diagnose.sh

# 重新运行安装脚本会自动修复路径
bash deploy/quick-install.sh
```

### 问题 3：安装脚本创建了错误的目录

**问题**: 目录名为 `INSTALL_DIR=${INSTALL_DIR:-/opt/legendary-spoon}` 而不是实际路径

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
