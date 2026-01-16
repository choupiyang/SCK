# 🚀 GLM-4-Flash 内容提炼功能

## 功能概述

新增智谱 GLM-4-Flash 模型提炼功能，用于从 DeepSeek OCR 的输出中进一步提取纯净的 Markdown 内容。

### 工作流程

```
图片 → DeepSeek OCR → GLM-4-Flash 提炼 → 纯净 Markdown
```

### 为什么需要提炼？

即使使用了优化的 OCR 提示词，DeepSeek OCR 有时仍可能输出：
- "好的，我来识别..."
- "以下是识别结果..."
- "我已经完成了..."
- 其他对话性填充词

GLM-4-Flash 提炼功能会：
- ✅ 移除所有额外文字
- ✅ 修正格式错误
- ✅ 保持纯净 Markdown
- ✅ 提高输出质量

## 配置方法

### 1. 获取智谱 API Key

访问 [智谱AI开放平台](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) 创建 API Key。

### 2. 配置环境变量

在 `.env` 文件中添加：

```bash
# 智谱 GLM API 密钥（可选）
GLM_API_KEY=your_glm_api_key_here
```

### 3. 重启服务

```bash
npm run server
```

启动时会显示：

```
=== 配置信息 ===
OCR Prompt: 使用默认中文提示词
Prompt Length: 234 字符
GLM Refine: ✓ 已启用 GLM-4-Flash 提炼  ← 确认已启用
================
```

## 使用场景

### 场景1: 不使用提炼（快速模式）

**配置**:
```bash
# 只配置 DeepSeek API Key
SILICONFLOW_API_KEY=your_key
# 不配置 GLM_API_KEY
```

**流程**: `图片 → OCR → 直接输出`

**优点**:
- ⚡ 处理速度快
- 💰 成本低（只用一次 API）
- ⏱️ 适合批量处理

**缺点**:
- ⚠️ 可能包含额外文字

### 场景2: 使用提炼（高质量模式）

**配置**:
```bash
SILICONFLOW_API_KEY=your_deepseek_key
GLM_API_KEY=your_glm_key
```

**流程**: `图片 → OCR → GLM提炼 → 纯净输出`

**优点**:
- ✨ 输出质量最高
- 🎯 格式最规范
- 🧹 无额外文字

**缺点**:
- 🐌 处理时间增加约 50%
- 💵 成本略高（两次 API 调用）

## 技术细节

### API 配置

**端点**: `https://open.bigmodel.cn/api/paas/v4/chat/completions`

**模型**: `glm-4-flash`

**参数**:
```javascript
{
  model: 'glm-4-flash',
  messages: [
    {
      role: 'system',
      content: GLM_REFINE_PROMPT  // 提炼提示词
    },
    {
      role: 'user',
      content: `请提炼以下 OCR 识别结果...`
    }
  ],
  temperature: 0.3,  // 低温度确保稳定性
  stream: false
}
```

### 提炼提示词

默认提炼提示词：

```
你是一个 Markdown 内容提炼专家。你的任务是从 OCR 识别结果中提取纯净的 Markdown 内容。

严格要求：
1. 只输出纯净的 Markdown 内容 - 移除所有开场白、解释、道歉、说明性文字
2. 保持原有的 Markdown 结构和格式
3. 保留所有标题、列表、代码块、表格、链接等元素
4. 修正明显的格式错误（如列表符号、代码块标记）
5. 不要添加任何原内容中没有的新信息
6. 如果原内容已经是纯净的 Markdown，直接原样输出
7. 绝对不要添加"以下是提炼后的内容"等开场白
8. 直接从 Markdown 内容开始输出

记住：只输出提炼后的纯净 Markdown，不要任何额外文字。
```

### 自定义提炼提示词

在 `.env` 中设置 `GLM_REFINE_PROMPT`：

```bash
GLM_REFINE_PROMPT=你的自定义提炼提示词...
```

## 日志输出

### 单张图片处理

```bash
开始调用 DeepSeek OCR API...
OCR 识别完成，内容长度: 1234
开始调用 GLM-4-Flash 提炼...
GLM 提炼完成，最终内容长度: 1198
```

### 批量处理

```bash
开始处理 5 张图片...
[1/5] 开始 OCR 识别: image1.png
[1/5] OCR 识别完成: image1.png
[1/5] 开始 GLM 提炼: image1.png
[1/5] GLM 提炼完成: image1.png
[2/5] 开始 OCR 识别: image2.png
...
```

## 错误处理

### 提炼失败时的降级策略

```javascript
try {
  // 调用 GLM API
  markdown = await callGLMRefineAPI(markdown);
} catch (error) {
  // 如果提炼失败，使用原始 OCR 结果
  console.log('提炼失败，使用原始 OCR 结果');
  return markdown;
}
```

**保证**: 即使 GLM API 调用失败，系统仍能返回 OCR 结果，不会中断流程。

## 成本估算

### API 调用次数

**不使用提炼**:
- 1 张图片 = 1 次 DeepSeek OCR API 调用

**使用提炼**:
- 1 张图片 = 1 次 DeepSeek OCR + 1 次 GLM-4-Flash

### 成本对比

假设：
- DeepSeek OCR: ¥0.001/次
- GLM-4-Flash: ¥0.0001/次

处理 100 张图片：
- 不提炼: ¥0.001 × 100 = **¥0.1**
- 使用提炼: (¥0.001 + ¥0.0001) × 100 = **¥0.11**

**成本增加约 10%，但质量显著提升！**

## 性能影响

### 处理时间

**单张图片**:
- 不提炼: ~2-3 秒
- 使用提炼: ~3-4 秒（增加 50%）

**批量 100 张**:
- 不提炼: ~3-4 分钟
- 使用提炼: ~5-6 分钟（增加 50%）

### 优化建议

1. **少量重要文档**: 使用提炼模式
2. **批量处理**: 考虑是否需要提炼
3. **时间敏感**: 关闭提炼功能

## 配置示例

### 示例1: 仅使用 DeepSeek OCR

```bash
# .env
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxx
PORT=3014
# 不设置 GLM_API_KEY
```

### 示例2: 使用双模型（推荐）

```bash
# .env
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxx
GLM_API_KEY=your_glm_api_key_here
PORT=3014
```

### 示例3: 自定义提炼提示词

```bash
# .env
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxx
GLM_API_KEY=your_glm_api_key_here
GLM_REFINE_PROMPT=提取Markdown，移除所有非Markdown内容，只保留纯净格式。
PORT=3014
```

## 测试建议

### 测试步骤

1. **准备测试图片**: 选择一张包含多种格式（标题、列表、代码）的图片
2. **不使用提炼**: 注释掉 `GLM_API_KEY`，测试 OCR 直接输出
3. **使用提炼**: 启用 `GLM_API_KEY`，对比输出质量
4. **评估差异**: 检查是否有额外文字、格式是否正确

### 评估标准

- ✅ 是否包含额外文字（开场白、说明等）
- ✅ Markdown 格式是否正确
- ✅ 代码块、表格等特殊元素是否保留
- ✅ 是否有格式错误

## 故障排除

### 问题1: GLM API 调用失败

**错误信息**:
```
GLM 提炼 API 调用失败: ...
提炼失败，使用原始 OCR 结果
```

**解决方法**:
1. 检查 `GLM_API_KEY` 是否正确
2. 检查 API Key 是否有足够额度
3. 检查网络连接

**注意**: 即使失败，系统仍会返回 OCR 结果，不会中断。

### 问题2: 提炼后内容为空

**可能原因**:
- GLM API 返回格式异常
- 提炼提示词过于严格

**解决方法**:
1. 检查后端日志
2. 尝试调整 `GLM_REFINE_PROMPT`
3. 如果问题持续，可以临时关闭提炼功能

### 问题3: 处理速度变慢

**原因**: 启用提炼后，每张图片需要额外调用一次 API

**解决方法**:
- 批量处理时考虑关闭提炼
- 或者接受较慢但质量更高的输出

## API 限制

### GLM-4-Flash 限制

- **并发限制**: 根据账户等级不同
- **速率限制**: 约 100 次/分钟
- **Token 限制**: 单次请求最大 128K tokens

### 建议

批量处理大量图片时：
- 控制并发数量
- 添加适当的延迟
- 监控 API 使用量

## 更新日志

### v1.0 (2025-01-14)
- ✅ 新增 GLM-4-Flash 提炼功能
- ✅ 支持自定义提炼提示词
- ✅ 优雅降级：提炼失败时使用原始结果
- ✅ 详细的日志输出
- ✅ 完整的错误处理

## 相关文档

- [智谱AI开放平台文档](https://open.bigmodel.cn/dev/api)
- [.env.example 配置文件](./.env.example)
- [OCR_PROMPT_GUIDE.md](./OCR_PROMPT_GUIDE.md)

## 反馈

如有问题或建议，欢迎反馈！
