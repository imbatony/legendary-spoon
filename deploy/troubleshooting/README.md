# 故障排除工具

本目录包含用于诊断和修复部署问题的工具脚本。

## 脚本说明

### debug-bun.sh
详细诊断 Bun 可执行文件问题
- 检查文件存在性、权限、所有者
- 验证 SELinux 状态
- 测试符号链接和动态链接库
- systemd 执行测试

用法：
```bash
sudo bash deploy/troubleshooting/debug-bun.sh
```

### fix-bun-path.sh
自动检测并修复 Bun 路径问题
- 智能查找 Bun 安装位置
- 自动更新服务配置
- 验证修复结果

用法：
```bash
sudo bash deploy/troubleshooting/fix-bun-path.sh
```

### fix-with-wrapper.sh
使用 shell 包装器解决 systemd 执行限制
- 创建 start.sh 包装脚本
- 移除文件系统访问限制
- 绕过 ProtectHome 等安全限制

用法：
```bash
sudo bash deploy/troubleshooting/fix-with-wrapper.sh
```

### cleanup.sh
清理错误的安装目录
- 处理变量展开错误
- 安全删除错误目录
- 支持 sudo 权限

用法：
```bash
bash deploy/troubleshooting/cleanup.sh
```

### diagnose.sh
全面系统诊断
- 检查 Bun 安装
- 验证项目文件
- 测试依赖和配置
- systemd 服务状态

用法：
```bash
bash deploy/troubleshooting/diagnose.sh
```

## 常见问题

这些工具主要解决以下问题：

1. **ProtectHome=true** 导致 systemd 无法访问 /home 目录
2. **NAMESPACE 错误** - 数据目录不存在或权限问题
3. **Bun 路径错误** - systemd 找不到 Bun 可执行文件
4. **安装目录命名错误** - 变量展开问题

## 注意

正常安装应该使用 `deploy/quick-install.sh`，它已经集成了这些修复。

这些工具仅在遇到特殊部署问题时使用。
