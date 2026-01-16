# 问题诊断指南

## 问题描述
修改后完全没有输出 Markdown 内容

## 可能的原因

### 1. GLM API 返回空内容
GLM-4.5-Flash 可能返回了空字符串或 null

### 2. 提炼逻辑错误
OpenAI 或 GLM 提炼失败后，没有正确降级到原始 OCR 结果

### 3. API 调用异常
API 调用抛出异常但被捕获

## 诊断步骤

### 步骤 1: 查看完整日志

重新处理图片，观察以下关键日志：

```
→ 开始调用 DeepSeek OCR API...
✓ DeepSeek OCR 调用成功
→ OCR 识别内容长度: XXX 字符
→ 内容预览 (前150字符): ...
```

**问题 A**: 如果 OCR 识别内容长度为 0 或很小
- 问题在于 DeepSeek OCR API
- 需要检查 API Key 和图片质量

**问题 B**: OCR 内容正常，但之后出现问题
- 继续查看下一步

### 步骤 2: 检查提炼阶段日志

#### 如果启用了 OpenAI:
```
开始调用 OpenAI API 提炼...
→ OpenAI 提炼输入长度: XXX 字符
→ 使用模型: gpt-4o
→ API 端点: https://api.openai.com/v1
```

如果看到:
```
❌ OpenAI 提炼 API 调用失败
```
- 检查 OpenAI API Key 是否正确
- 检查 Base URL 是否可访问
- 应该会自动降级到 GLM

#### 如果启用了 GLM:
```
开始调用 GLM 提炼...
→ GLM 提炼输入长度: XXX 字符
→ 使用模型: glm-4.5-flash
→ GLM API 响应状态: 200
→ GLM 响应数据键: ['id', 'choices', ...]
```

**关键检查点**:
如果看到:
```
⚠️  GLM 返回内容为空
→ response.data.choices: [...]
```
- 说明 API 调用成功，但返回了空内容
- 问题在于 GLM 模型本身

### 步骤 3: 临时禁用提炼测试

编辑 `.env` 文件，临时禁用所有提炼：

```bash
# 注释掉 GLM API Key
# GLM_API_KEY=your_key

# 确保关闭 OpenAI
OPENAI_ENABLED=false
```

重启服务器，再次测试。如果现在能正常输出 Markdown：
- 问题确实在提炼环节
- DeepSeek OCR 本身工作正常

### 步骤 4: 只使用 GLM 测试

如果 `.env` 中配置了 GLM：

```bash
GLM_API_KEY=your_glm_api_key_here
GLM_MODEL=glm-4.5-flash
OPENAI_ENABLED=false
```

查看日志中是否有：
```
✓ GLM 提炼完成
→ GLM 提炼输出长度: XXX 字符
```

如果输出长度为 0：
- GLM-4.5-Flash 模型可能有问题
- 尝试更换模型: `GLM_MODEL=glm-4-flash`

### 步骤 5: 测试不同模型

在 `.env` 中尝试不同的 GLM 模型：

```bash
# 选项 1: glm-4-flash
GLM_MODEL=glm-4-flash

# 选项 2: glm-4-air
GLM_MODEL=glm-4-air

# 选项 3: glm-4-plus
GLM_MODEL=glm-4-plus
```

## 快速修复方案

### 方案 1: 临时禁用提炼（最快）

编辑 `.env`:
```bash
# 不设置 GLM_API_KEY，或注释掉
# GLM_API_KEY=...

OPENAI_ENABLED=false
```

这样可以获得原始的 DeepSeek OCR 结果。

### 方案 2: 更换 GLM 模型

如果 `glm-4.5-flash` 有问题，尝试：
```bash
GLM_MODEL=glm-4-flash
```

### 方案 3: 使用 OpenAI 替代

如果配置了 OpenAI，确保配置正确：
```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

## 需要提供的信息

如果问题仍然存在，请提供：

1. **完整的处理日志**
   - 从 "开始调用 DeepSeek OCR API..." 到结束
   - 包括所有错误信息

2. **`.env` 配置**（隐藏敏感信息）
   ```bash
   GLM_API_KEY=sk-xxxxx...
   OPENAI_ENABLED=true/false
   OPENAI_BASE_URL=...
   OPENAI_MODEL=...
   ```

3. **图片信息**
   - 文件大小
   - 图片分辨率
   - 图片内容描述（文字、代码、表格等）

## 已知问题

### GLM-4.5-Flash 可能的问题
1. 对某些类型的图片（如纯代码、复杂表格）可能返回空结果
2. API 限流可能导致调用失败
3. 模型可能处于不稳定状态

### 解决方法
- 降级到 `glm-4-flash` 或 `glm-4-air`
- 使用 OpenAI API
- 临时禁用提炼，直接使用 DeepSeek OCR 结果
