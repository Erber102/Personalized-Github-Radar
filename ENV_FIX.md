# 🔧 环境变量问题解决方案

## 问题描述

本地无法读取 `.env` 文件中的 `GITHUB_TOKEN`，因为现有的配置系统期望特定的环境变量名。

## 解决方案

### 1. 创建了独立的雷达系统

我创建了一个完全独立的雷达版本 `scripts/radar-standalone.js`，它：

- **不依赖现有的配置系统**
- **支持多种 GitHub Token 环境变量名**：
  - `GITHUB_TOKEN` (你的 .env 文件中的名称)
  - `GITHUB_TOKEN_BOT` (原有系统期望的名称)
  - `GITHUB_TOKEN_VITALETS` (原有系统期望的名称)

### 2. 创建了雷达专用的 GitHub API 客户端

`scripts/helpers/analyzer/radar-github-api.js`：

- 独立的 API 客户端，避免环境变量冲突
- 自动检测可用的 GitHub Token
- 内置重试逻辑和速率限制处理

### 3. 更新了 NPM 脚本

现在可以使用以下命令运行雷达：

```bash
# 主要雷达命令（推荐）
npm run radar

# 独立雷达版本
npm run radar-standalone

# 测试模式（使用模拟数据）
npm run radar-test
```

## 验证环境变量

使用以下命令验证环境变量是否正确加载：

```bash
node scripts/test-env.js
```

## 当前环境变量状态

根据测试，你的环境变量配置是正确的：

- ✅ `GITHUB_TOKEN`：已正确加载
- ✅ `OPENAI_API_KEY`：已正确加载

## 如何使用

### 1. 确保 .env 文件存在

你的 `.env` 文件应该包含：

```bash
GITHUB_TOKEN="your_github_token_here"
OPENAI_API_KEY="your_openai_api_key_here"
```

### 2. 运行雷达

```bash
npm run radar
```

### 3. 查看结果

雷达会：

1. 从 GitHub 趋势页面获取所有语言的仓库
2. 根据你的配置过滤语言和关键词
3. 获取 README 内容和元数据
4. 分析相关性并生成 AI 摘要
5. 生成个性化报告并保存到 `radar-report.md`

## 技术细节

### 环境变量加载机制

- 使用 `dotenv` 包加载 `.env` 文件
- 雷达系统自动检测多种可能的 GitHub Token 名称
- 如果找不到 Token，会显示明确的错误信息

### 兼容性

- ✅ 与现有系统完全兼容
- ✅ 不会影响原有的 trending 功能
- ✅ 独立的错误处理机制
- ✅ 优雅的降级处理

## 故障排除

### 如果仍然遇到问题

1. **检查 .env 文件位置**：确保在项目根目录
2. **检查文件权限**：确保 .env 文件可读
3. **检查 Token 格式**：确保没有多余的空格或引号
4. **重启终端**：有时需要重启终端来重新加载环境变量

### 手动设置环境变量

如果 .env 文件仍然不工作，可以手动设置：

```bash
export GITHUB_TOKEN="your_token_here"
export OPENAI_API_KEY="your_openai_key_here"
npm run radar
```

## 成功标志

当你看到以下输出时，表示雷达系统工作正常：

```
✅ Radar GitHub API client initialized with token: ghp_xxxxx...
✅ Standalone Radar completed successfully
```

雷达报告会保存到 `radar-report.md` 文件，并在控制台显示完整的个性化分析结果。