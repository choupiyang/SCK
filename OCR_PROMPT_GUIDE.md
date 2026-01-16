# 📝 OCR 提示词配置指南

## 概述

本应用使用 DeepSeek OCR API 将图片转换为 Markdown 格式。提示词决定了 AI 如何处理和输出内容。

## 默认提示词说明

默认提示词经过优化，具有以下特点：

### ✅ 优势
- **纯输出**: 只输出 Markdown 内容，无任何额外文字
- **结构保留**: 准确识别标题、列表、代码块、表格
- **格式规范**: 使用标准 Markdown 语法
- **多语言支持**: 支持中英文混合识别

### 🎯 核心要求
1. **直接输出**: 从 Markdown 内容开始，不要有 "以下是..." 等开场白
2. **无解释**: 不要有 "我已经识别了..."、"如果不清楚..." 等解释
3. **无道歉**: 不要有 "抱歉"、"如果出错" 等内容
4. **无元注释**: 不要有 "这是 OCR 结果" 等说明

## 自定义提示词

### 在 .env 文件中配置

```bash
# 单行版本（推荐）
OCR_PROMPT=You are an OCR assistant. Output ONLY Markdown content. No explanations, no introductions. Start directly with the content.

# 或者使用多行（需要特定格式）
OCR_PROMPT="Line 1\nLine 2\nLine 3"
```

### 提示词设计原则

#### ✅ 好的提示词特征
```
- 明确要求"只输出 Markdown"
- 强调"不要有额外文字"
- 给出具体示例
- 使用强制性语言（STRICT, MUST, REQUIREMENT）
```

#### ❌ 避免的提示词特征
```
- "请帮我识别..."（太客气，会得到礼貌性回复）
- "如果..."（会让 AI 添加条件性说明）
- "尽量..."（不够强硬，AI 可能仍会添加解释）
- 过于复杂的多步骤指令
```

## 示例提示词

### 示例 1: 简洁版（推荐用于快速测试）
```bash
OCR_PROMPT=Extract all text from this image and convert to Markdown format. Output ONLY the Markdown content with no additional text, explanations, or formatting. Start directly with the content.
```

### 示例 2: 中文优化版
```bash
OCR_PROMPT=你是OCR助手。将图片内容转换为Markdown格式。严格要求：1. 只输出Markdown内容，不要任何额外文字 2. 直接从内容开始，不要"以下是"等开场白 3. 保持原有格式：标题、列表、代码块、表格 4. 不要解释、不要道歉、不要说明
```

### 示例 3: 代码识别优化版
```bash
OCR_PROMPT=Convert image to Markdown. Focus on code recognition: use proper syntax highlighting with language tags. Preserve indentation and structure. Output ONLY the Markdown, nothing else.
```

### 示例 4: 表格识别优化版
```bash
OCR_PROMPT=Extract and convert to Markdown. Pay special attention to tables - use proper Markdown table syntax with | separators. Output ONLY the Markdown content, no explanations.
```

## 测试你的提示词

### 测试步骤
1. 修改 `.env` 文件中的 `OCR_PROMPT`
2. 重启后端服务器
3. 上传测试图片
4. 检查输出是否符合预期

### 评估标准
- ✅ 输出是否直接从内容开始（无 "以下是"）
- ✅ 是否没有 "我已经识别了" 等说明
- ✅ 是否没有 "抱歉" 等道歉
- ✅ Markdown 格式是否正确
- ✅ 特殊元素（代码、表格）是否正确识别

## 常见问题

### Q: AI 仍然输出 "以下是识别结果..."
**A**: 提示词不够强硬，尝试添加 "STRICT REQUIREMENT" 或使用大写强调。

### Q: 想要更好的代码识别
**A**: 在提示词中明确提到 "code blocks with language tags" 和 "preserve indentation"。

### Q: 想要更好的表格识别
**A**: 强调 "use proper Markdown table syntax" 和 "preserve table structure"。

### Q: 中文识别不准确
**A**: 可以在提示词中添加 "Special attention to Chinese characters"。

## 默认提示词（完整版）

如果不设置 `OCR_PROMPT` 环境变量，系统将使用以下默认提示词：

```
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

## 技术细节

- **环境变量名**: `OCR_PROMPT`
- **读取位置**: `server/index.js`
- **默认值**: 见上文"默认提示词（完整版）"
- **字符编码**: UTF-8
- **特殊字符**: 需要转义换行符 `\n`（如果在 .env 中使用多行）

## 更新日志

### v1.0 (2025-01-14)
- ✅ 添加 OCR_PROMPT 环境变量支持
- ✅ 提供优化的默认提示词
- ✅ 添加详细的配置文档
- ✅ 修复 AI 输出额外文字的问题

## 反馈与建议

如果你发现了更好的提示词，欢迎分享！可以通过以下方式反馈：
- 在项目 Issues 中提交
- 贡献你的提示词配置
- 分享你的使用经验
