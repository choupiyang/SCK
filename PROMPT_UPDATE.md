# 🎯 OCR 提示词优化更新

## 更新日期
2025-01-14

## 📋 更新内容

### 问题
之前使用的提示词：
```
请将这张图片中的内容转换为 Markdown 格式。保持原有的格式、标题、列表、代码块等结构。如果是文字文档图片，请准确识别所有文字内容。
```

**存在的问题**：
- ❌ AI 会输出额外文字，如 "以下是图片内容..."、"我已经识别了..."
- ❌ 会添加道歉或说明，如 "如果不清楚请告诉我"
- ❌ 输出不够纯净，影响直接使用

### 解决方案

#### 1. 新增环境变量 `OCR_PROMPT`
- 用户可以在 `.env` 文件中自定义提示词
- 如果不设置，使用优化的默认提示词
- 灵活可配置，适应不同使用场景

#### 2. 优化的默认提示词
```javascript
You are an OCR (Optical Character Recognition) assistant. Your task is to extract text from images and convert it to Markdown format.

STRICT REQUIREMENTS:
1. Output ONLY the Markdown content - no explanations, no introductions, no "Here is the content", no "I've identified", no apologies, NO additional text whatsoever
2. Start directly with the Markdown content (e.g., # Title, or text content)
3. Preserve the original structure: headings, lists, code blocks, tables, emphasis, links
4. Use proper Markdown syntax: # for headings, * for bullets, ` for code, ** for bold
5. If the image contains code, use proper code block syntax with language tags
6. If the image contains tables, use Markdown table syntax
7. If text is unclear, make your best effort but do not add placeholder notes
8. Do NOT include any conversational filler, meta-commentary, or explanations

Remember: OUTPUT THE RAW MARKDOWN CONTENT ONLY. Nothing else.
```

**优势**：
- ✅ 强调 "STRICT REQUIREMENTS"（严格要求）
- ✅ 明确 "NO additional text whatsoever"（绝对不要额外文字）
- ✅ 列举所有不想要的内容（explanations, introductions, apologies）
- ✅ 多次重复核心要求
- ✅ 包含技术细节（language tags, table syntax）

#### 3. 新增文档
- **OCR_PROMPT_GUIDE.md**: 详细的提示词配置指南
- **.env.example.zh**: 中文版配置文件示例

## 🚀 使用方法

### 快速开始（使用默认提示词）

1. 只需配置 API Key：
```bash
SILICONFLOW_API_KEY=your_api_key_here
```

2. 启动应用即可，系统自动使用优化的默认提示词

### 自定义提示词

在 `.env` 文件中添加：

```bash
# 方式1: 单行简洁版
OCR_PROMPT=Extract to Markdown. Output ONLY content, no explanations.

# 方式2: 完整版（单行）
OCR_PROMPT=You are an OCR assistant. STRICT: Output ONLY Markdown content. No intro, no explanations, no apologies. Start directly with content. Preserve headings, lists, code, tables.

# 方式3: 中文版
OCR_PROMPT=将图片转为Markdown。严格要求：只输出内容，不要"以下是"等开场白，不要任何解释、道歉或说明。直接从Markdown内容开始。
```

## 📊 效果对比

### 之前
```markdown
好的，我来帮您识别这张图片的内容：

# 标题
这是一段文字...

我已经识别完成，如果有什么不清楚的地方请告诉我。
```

### 现在
```markdown
# 标题
这是一段文字...
```

**纯 Markdown，无任何额外文字！**

## 📁 文件变更

### 修改的文件
- `server/index.js`: 添加 `OCR_PROMPT` 环境变量支持
- `.env.example`: 添加 `OCR_PROMPT` 配置说明

### 新增的文件
- `OCR_PROMPT_GUIDE.md`: 详细的提示词配置指南
- `.env.example.zh`: 中文版配置示例

## 🎯 技术实现

```javascript
// server/index.js

const OCR_PROMPT = process.env.OCR_PROMPT || `默认提示词...`;

async function callOCRAPI(base64Image) {
  const response = await axios.post(
    'https://api.siliconflow.cn/v1/chat/completions',
    {
      model: 'deepseek-ai/DeepSeek-OCR',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64Image } },
            { type: 'text', text: OCR_PROMPT }  // 使用配置的提示词
          ]
        }
      ]
    }
  );
}
```

## 🔧 配置建议

### 不同使用场景

#### 场景1: 日常文档识别
```bash
OCR_PROMPT=Convert document image to Markdown. Preserve structure and formatting. Output ONLY the Markdown content.
```

#### 场景2: 代码截图识别
```bash
OCR_PROMPT=Extract code from image to Markdown. Use proper syntax highlighting with language tags. Preserve indentation. Output ONLY Markdown.
```

#### 场景3: 表格识别
```bash
OCR_PROMPT=Convert table image to Markdown table format. Use | separators. Output ONLY the Markdown table.
```

#### 场景4: 中英混合
```bash
OCR_PROMPT=Convert image to Markdown. Handle mixed Chinese and English text. Output ONLY content, no explanations.
```

## ⚠️ 注意事项

1. **重启服务**: 修改 `.env` 后需要重启后端服务才能生效
2. **字符编码**: 确保使用 UTF-8 编码保存 `.env` 文件
3. **特殊字符**: 如果使用换行符，需要使用 `\n` 转义
4. **提示词长度**: 不宜过长，关键是要明确和强硬

## 📖 参考文档

- [OCR_PROMPT_GUIDE.md](./OCR_PROMPT_GUIDE.md) - 详细配置指南
- [.env.example.zh](./.env.example.zh) - 中文配置示例
- [.env.example](./.env.example) - 英文配置示例

## 🤝 贡献

如果你发现了更好的提示词配置，欢迎分享！

## 📝 更新日志

- **v1.0** (2025-01-14): 初始版本
  - 添加 OCR_PROMPT 环境变量支持
  - 优化默认提示词
  - 添加详细文档
