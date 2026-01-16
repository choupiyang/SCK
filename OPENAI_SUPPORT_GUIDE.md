# OpenAI 兼容 API 配置指南

## 功能说明

现在支持任何兼容 OpenAI API 格式的服务来提炼 OCR 结果，包括：
- ✅ OpenAI (GPT-4, GPT-3.5)
- ✅ Azure OpenAI
- ✅ LocalAI
- ✅ Ollama
- ✅ vLLM
- ✅ 其他兼容 OpenAI API 的服务

## 配置步骤

### 1. 编辑 `.env` 文件

```bash
# ========================================
# OpenAI 兼容 API 配置
# ========================================

# 是否启用 OpenAI 兼容 API（true/false）
OPENAI_ENABLED=true

# OpenAI API 密钥
OPENAI_API_KEY=sk-your-api-key-here

# OpenAI Base URL（API 端点）
# 根据您使用的服务填写对应的端点
OPENAI_BASE_URL=https://api.openai.com/v1

# OpenAI 模型名称
OPENAI_MODEL=gpt-4o
```

### 2. 不同服务的配置示例

#### OpenAI 官方 API

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

**可用模型：**
- `gpt-4o` - 最新 GPT-4 Omni
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-4` - GPT-4
- `gpt-3.5-turbo` - GPT-3.5 Turbo

#### Azure OpenAI

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=your-azure-api-key
OPENAI_BASE_URL=https://your-resource-name.openai.azure.com/
OPENAI_MODEL=your-deployment-name
```

**注意：**
- `OPENAI_BASE_URL` 使用您的 Azure 资源端点
- `OPENAI_MODEL` 使用您的部署名称，而非模型名称

#### Ollama (本地运行)

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=ollama  # Ollama 不需要真实的 API Key
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3
```

**可用模型（取决于您下载的模型）：**
- `llama3` - Meta Llama 3
- `llama2` - Meta Llama 2
- `mistral` - Mistral AI
- `codellama` - Code Llama
- 其他 Ollama 支持的模型

#### LocalAI

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=localai
OPENAI_BASE_URL=http://localhost:8080/
OPENAI_MODEL=gpt-3.5-turbo
```

#### vLLM

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=vllm
OPENAI_BASE_URL=http://localhost:8000/v1
OPENAI_MODEL=meta-llama/Llama-3-8b
```

### 3. 重启服务器

```bash
npm run dev
```

启动时会显示配置信息：

```
=== 配置信息 ===
OCR Prompt: 使用自定义提示词
Prompt Length: 523 字符
OpenAI Refine: ✓ 已启用
   模型: gpt-4o
   端点: https://api.openai.com/v1
GLM Refine: ○ 已配置 glm-4.5-flash（作为备用）
================
```

## 提炼优先级

系统按以下优先级尝试提炼：

1. **OpenAI API**（如果 `OPENAI_ENABLED=true` 且配置了 API Key）
2. **GLM API**（如果 OpenAI 失败且配置了 GLM）
3. **原始 OCR 结果**（如果所有提炼都失败）

## 日志输出

处理时会显示详细日志：

```
OCR 识别完成，内容长度: 1234
开始调用 OpenAI API 提炼...
→ OpenAI 提炼输入长度: 1234 字符
→ 使用模型: gpt-4o
→ API 端点: https://api.openai.com/v1
✓ OpenAI 提炼完成
→ OpenAI 提炼输出长度: 1156 字符
→ 内容变化率: 93.7%
OpenAI 提炼完成，最终内容长度: 1156
```

## 常见问题

### Q: 如何禁用 OpenAI 提炼？

A: 在 `.env` 中设置：
```bash
OPENAI_ENABLED=false
```

### Q: OpenAI 和 GLM 可以同时使用吗？

A: 可以！OpenAI 作为主要提炼服务，GLM 作为备用。如果 OpenAI 调用失败，会自动降级到 GLM。

### Q: 如何使用本地模型（如 Ollama）？

A:
1. 安装 Ollama：https://ollama.ai/
2. 下载模型：`ollama pull llama3`
3. 配置 `.env`：
```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3
```

### Q: API 调用失败怎么办？

A:
1. 检查 API Key 是否正确
2. 检查 Base URL 是否可访问
3. 检查模型名称是否正确
4. 查看服务器日志获取详细错误信息
5. 系统会自动降级到 GLM 或使用原始 OCR 结果

### Q: 支持自定义提示词吗？

A: 支持！在 `.env` 中修改 `GLM_REFINE_PROMPT`，该提示词同样适用于 OpenAI API。

### Q: 如何测试配置是否正确？

A: 上传一张图片并处理，查看服务器日志。如果看到：
```
✓ OpenAI 提炼完成
```
说明配置成功。

## 费用说明

- **OpenAI API**: 按使用量计费，详见 [OpenAI 定价](https://openai.com/pricing)
- **Azure OpenAI**: 按使用量计费，详见 [Azure 定价](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- **LocalAI/Ollama/vLLM**: 完全免费，本地运行

## 技术细节

- API 格式：OpenAI Chat Completions API
- 超时时间：60 秒
- Temperature：0.3（低温度保证输出稳定性）
- 最大重试：无（失败立即降级）
- 并发控制：顺序处理，避免 API 限流

## 示例配置文件

### 使用 GPT-4o

```bash
# .env
SILICONFLOW_API_KEY=your_siliconflow_key

OPENAI_ENABLED=true
OPENAI_API_KEY=sk-your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

PORT=3014
```

### 使用本地 Ollama

```bash
# .env
SILICONFLOW_API_KEY=your_siliconflow_key

OPENAI_ENABLED=true
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3

PORT=3014
```

### 使用 Azure OpenAI

```bash
# .env
SILICONFLOW_API_KEY=your_siliconflow_key

OPENAI_ENABLED=true
OPENAI_API_KEY=your-azure-key
OPENAI_BASE_URL=https://my-openai-resource.openai.azure.com/
OPENAI_MODEL=my-gpt4-deployment

PORT=3014
```

## 更新日志

- 2026-01-16: 初始版本，支持 OpenAI 兼容 API
