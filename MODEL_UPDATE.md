# 🔄 模型更新：glm-4.5-flash

## 更新日期
2025-01-14

## 主要变更

### 模型名称更正
- ❌ 之前：`glm-4-flash`（不正确）
- ✅ 现在：`glm-4.5-flash`（正确）

### 新增功能
添加了 `GLM_MODEL` 环境变量，允许用户自定义 GLM 模型。

## 配置方法

### 默认配置（推荐）

在 `.env` 文件中：

```bash
# 必填：硅基流动 API Key
SILICONFLOW_API_KEY=your_key

# 可选：智谱 GLM API Key
GLM_API_KEY=your_glm_key

# 可选：GLM 模型（不设置则默认为 glm-4.5-flash）
# GLM_MODEL=glm-4.5-flash  ← 默认值，可以不写
```

### 自定义模型

在 `.env` 文件中添加：

```bash
GLM_MODEL=glm-4.5-flash
```

### 可选的 GLM 模型

根据智谱 AI 开放平台，可用的模型包括：

- `glm-4.5-flash` - 推荐（最新，速度快）
- `glm-4-flash` - 旧版 Flash
- `glm-4-air` - 轻量级
- `glm-4-plus` - 增强版
- `glm-4` - 标准版

## 启动验证

### 使用默认模型（glm-4.5-flash）

```bash
$ npm run server

Server running on http://localhost:3014

=== 配置信息 ===
OCR Prompt: 使用默认中文提示词
Prompt Length: 234 字符
GLM Refine: ✓ 已启用 glm-4.5-flash 提炼  ← 显示使用的模型
================
```

### 自定义其他模型

如果设置了 `GLM_MODEL=glm-4-plus`：

```
=== 配置信息 ===
OCR Prompt: 使用默认中文提示词
Prompt Length: 234 字符
GLM Refine: ✓ 已启用 glm-4-plus 提炼  ← 显示自定义模型
================
```

## API 调用示例

### 使用默认 glm-4.5-flash

```javascript
// server/index.js 自动使用
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.5-flash';

const response = await axios.post(
  'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  {
    model: GLM_MODEL,  // ← 'glm-4.5-flash'
    messages: [...],
    temperature: 0.3,
  }
);
```

### 代码位置

**文件**: [server/index.js:63-64](server/index.js#L63-L64)

```javascript
// 获取 GLM 模型名称（可配置）
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.5-flash';
```

## 配置文件更新

### .env.example

新增配置项：

```bash
# GLM 模型名称（可选，默认为 glm-4.5-flash）
# 可选值: glm-4.5-flash, glm-4-flash, glm-4-air, glm-4-plus 等
GLM_MODEL=glm-4.5-flash
```

## 为什么使用 glm-4.5-flash？

### 优势

1. ✅ **最新版本**: 智谱最新发布的 Flash 模型
2. ✅ **速度快**: Flash 系列专为速度优化
3. ✅ **成本低**: 相比 Plus 版本更经济
4. ✅ **效果好**: 提炼质量出色
5. ✅ **稳定性高**: temperature=0.3 确保输出稳定

### 性能对比

| 模型 | 速度 | 成本 | 质量 |
|------|------|------|------|
| glm-4.5-flash | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| glm-4-plus | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| glm-4-air | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**推荐**: glm-4.5-flash（性价比最高）

## 迁移指南

### 从旧版本迁移

如果你之前使用了 `glm-4-flash`：

**选项1: 使用新的默认值（推荐）**
```bash
# .env 文件
GLM_API_KEY=your_key
# 删除或注释掉 GLM_MODEL=glm-4-flash
# 系统会自动使用 glm-4.5-flash
```

**选项2: 显式指定新模型**
```bash
# .env 文件
GLM_API_KEY=your_key
GLM_MODEL=glm-4.5-flash
```

**选项3: 继续使用旧模型**
```bash
# .env 文件
GLM_API_KEY=your_key
GLM_MODEL=glm-4-flash
```

## 日志输出

### 单张图片处理

```bash
开始调用 DeepSeek OCR API...
OCR 识别完成，内容长度: 1234
开始调用 GLM-4.5-Flash 提炼...  ← 显示模型名称
GLM 提炼完成，最终内容长度: 1198
```

### 批量处理

```bash
开始处理 5 张图片...
[1/5] 开始 OCR 识别: image1.png
[1/5] OCR 识别完成: image1.png
[1/5] 开始 GLM-4.5-Flash 提炼: image1.png  ← 显示模型名称
[1/5] GLM 提炼完成: image1.png
...
```

## 验证清单

启动服务后检查：

- [ ] 启动日志显示正确的模型名称（如 `glm-4.5-flash`）
- [ ] 后端日志显示 "开始调用 GLM-4.5-Flash 提炼..."
- [ ] API 调用成功，返回提炼后的内容
- [ ] 输出为纯净的 Markdown，无额外文字

## 故障排除

### 问题1: 模型名称错误

**错误**: `Error: Model 'glm-4-flash' not found`

**解决**:
1. 检查 `.env` 中的 `GLM_MODEL` 配置
2. 确保使用 `glm-4.5-flash` 或其他可用模型
3. 查看智谱官方文档确认可用模型列表

### 问题2: 模型切换无效

**原因**: 可能缓存了旧配置

**解决**:
1. 重启后端服务
2. 检查 `.env` 文件是否正确保存
3. 查看启动日志确认使用的模型

### 问题3: API 调用失败

**错误**: `GLM 提炼 API 调用失败: ...`

**可能原因**:
1. API Key 无效或过期
2. 账户余额不足
3. 网络连接问题
4. 模型名称错误

**解决**:
1. 检查 API Key 是否正确
2. 登录智谱平台查看余额
3. 检查网络连接
4. 验证模型名称是否正确

## 相关文件

### 修改的文件
- `server/index.js` - 更新模型为 `glm-4.5-flash`，添加 `GLM_MODEL` 环境变量
- `.env.example` - 新增 `GLM_MODEL` 配置说明

### 文档文件
- `GLM_REFINE_GUIDE.md` - 详细配置指南
- `GLM_UPDATE.md` - 功能更新说明
- `MODEL_UPDATE.md` - 本文档

## 技术细节

### API 端点
```
https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 请求体
```json
{
  "model": "glm-4.5-flash",
  "messages": [...],
  "temperature": 0.3,
  "stream": false
}
```

### 温度参数
- `temperature: 0.3` - 低温度确保输出稳定
- 降低随机性，提高可预测性
- 适合提炼任务

## 最佳实践

### 推荐配置

```bash
# .env
SILICONFLOW_API_KEY=your_deepseek_key
GLM_API_KEY=your_glm_key
GLM_MODEL=glm-4.5-flash  ← 使用默认值
# GLM_REFINE_PROMPT=...   ← 使用默认提炼提示词
# OCR_PROMPT=...          ← 使用默认 OCR 提示词
```

### 性能优化

- 使用 `glm-4.5-flash` 平衡速度和质量
- `temperature=0.3` 确保稳定输出
- 提炼失败时自动降级到 OCR 原结果

## 总结

- ✅ 模型更正为 `glm-4.5-flash`
- ✅ 添加 `GLM_MODEL` 环境变量支持
- ✅ 支持自定义 GLM 模型
- ✅ 默认使用最优模型
- ✅ 灵活的配置选项

**所有功能已完成！** 🎉
