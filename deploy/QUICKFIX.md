# 快速修复指南

## 常见问题和解决方案

> **注意**：从 2026年1月 开始，安装脚本已整合所有修复。正常使用 `bash deploy/quick-install.sh` 即可。
> 
> 以下问题及解决方案仅供参考。如遇到特殊情况，可使用 `deploy/troubleshooting/` 目录下的诊断工具。

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
# 方法 1：重新安装（推荐）
cd /opt/legendary-spoon
git pull
bash deploy/quick-install.sh

# 方法 2：使用故障排除工具
sudo bash deploy/troubleshooting/fix-with-wrapper.sh

# 方法 3：手动创建目录
sudo mkdir -p /opt/legendary-spoon/data
sudo mkdir -p /opt/legendary-spoon/uploads
sudo chown -R $USER:$USER /opt/legendary-spoon/data /opt/legendary-spoon/uploads
sudo systemctl restart legendary-spoon
```

### 问题 2：systemd 服务找不到 Bun 可执行文件

**错误信息**:
```
Failed to locate executable /home/user/.bun/bin/bun: No such file or directory
Failed at step EXEC spawning /home/user/.bun/bin/bun
```

**原因**: 
1. Bun 路径配置不正确
2. **最常见**：服务配置中有 `ProtectHome=true`，阻止访问 `/home` 目录

**诊断步骤**:

```bash
# 1. 运行详细诊断
sudo bash deploy/troubleshooting/debug-bun.sh

# 2. 检查服务文件中是否有 ProtectHome=true
cat /etc/systemd/system/legendary-spoon.service | grep -E "Protect|ReadWrite"
```

**解决方案**:

```bash
# 快速修复（推荐）
cd /opt/legendary-spoon
git pull
bash deploy/quick-install.sh

# 使用故障排除工具
sudo bash deploy/troubleshooting/fix-with-wrapper.sh

# 或运行诊断
sudo bash deploy/troubleshooting/debug-bun.sh
```

### 问题 3：安装脚本创建了错误的目录

**问题**: 目录名为 `INSTALL_DIR=${INSTALL_DIR:-/opt/legendary-spoon}` 而不是实际路径

## 🔧 解决方案

### 方法 1: 使用清理脚本（最简单）

```bash
# 如果已经克隆了项目
cd legendary-spoon
bash deploy/troubleshooting/cleanup.sh
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

使用最新版本的安装脚本 `deploy/quick-install.sh`，所有已知问题已修复：
- ✅ 正确的变量展开
- ✅ 自动创建 start.sh 包装脚本
- ✅ 移除了导致问题的安全限制
- ✅ 权限检查和处理
- ✅ 更好的错误提示
- ✅ 安装前目录验证

## 📋 故障排除工具

所有诊断和修复工具已整理到 `deploy/troubleshooting/` 目录：

- `debug-bun.sh` - 详细诊断 Bun 可执行文件问题
- `fix-bun-path.sh` - 自动修复 Bun 路径
- `fix-with-wrapper.sh` - 使用包装器解决权限问题
- `cleanup.sh` - 清理错误的安装目录
- `diagnose.sh` - 全面系统诊断

查看详情：`deploy/troubleshooting/README.md`

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

1. 先运行诊断：`bash deploy/troubleshooting/diagnose.sh`
2. 查看完整文档：[DEPLOYMENT.md](DEPLOYMENT.md)
3. 提交问题：[GitHub Issues](https://github.com/imbatony/legendary-spoon/issues)
