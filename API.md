# OCR API 使用文档

## 概述

这是一个强大的图片转 Markdown OCR API 服务,支持单张和批量图片识别,并可通过 AI 进行内容提炼。

## 基础信息

- **Base URL**: `http://localhost:3014` (或您配置的域名)
- **API 版本**: v1
- **认证方式**: API Key (Header 或 Query Parameter)

## 认证

如果服务器配置了 API Keys,所有请求都需要提供 API Key。

### 方式 1: Header (推荐)

```
X-API-Key: your-api-key-here
```

### 方式 2: Query Parameter

```
?api_key=your-api-key-here
```

---

## API 端点

### 1. 健康检查

检查服务是否正常运行。

**端点**: `GET /api/health`

**认证**: 不需要

**请求示例**:
```bash
curl http://localhost:3014/api/health
```

**响应示例**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "data": {
    "status": "ok",
    "uptime": 3600
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. 单张图片 OCR

对单张图片进行 OCR 识别并转换为 Markdown。

**端点**: `POST /api/ocr`

**认证**: 需要(如果配置了 API Keys)

**请求参数**:
- **Method**: `multipart/form-data`
- **Field**: `image` (文件)
- **文件限制**: 最大 10MB
- **支持格式**: 所有图片类型 (image/*)

**请求示例**:

```bash
curl -X POST http://localhost:3014/api/ocr \
  -H "X-API-Key: your-api-key" \
  -F "image=@/path/to/image.jpg"
```

**JavaScript (Fetch)**:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3014/api/ocr', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
  },
  body: formData,
});

const result = await response.json();
console.log(result.data.markdown);
```

**Python (requests)**:
```python
import requests

url = 'http://localhost:3014/api/ocr'
headers = {'X-API-Key': 'your-api-key'}
files = {'image': open('image.jpg', 'rb')}

response = requests.post(url, headers=headers, files=files)
result = response.json()

print(result['data']['markdown'])
```

**响应示例**:
```json
{
  "success": true,
  "message": "OCR 处理成功",
  "data": {
    "markdown": "# 标题\n\n这是识别的内容...",
    "usage": {
      "prompt_tokens": 1234,
      "completion_tokens": 567,
      "total_tokens": 1801
    },
    "processingTime": 2543
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "请上传图片文件",
  "code": "NO_IMAGE",
  "details": {
    "processingTime": 10
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. 批量图片 OCR

对多张图片进行批量 OCR 识别(顺序处理)。

**端点**: `POST /api/ocr/batch`

**认证**: 需要(如果配置了 API Keys)

**请求参数**:
- **Method**: `multipart/form-data`
- **Field**: `images` (多个文件)
- **文件数量**: 无硬性限制,建议不超过 20 张
- **单个文件限制**: 最大 10MB

**请求示例**:

```bash
curl -X POST http://localhost:3014/api/ocr/batch \
  -H "X-API-Key: your-api-key" \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  -F "images=@image3.jpeg"
```

**JavaScript (Fetch)**:
```javascript
const formData = new FormData();
for (let file of fileInput.files) {
  formData.append('images', file);
}

const response = await fetch('http://localhost:3014/api/ocr/batch', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
  },
  body: formData,
});

const result = await response.json();
result.data.results.forEach(item => {
  if (item.success) {
    console.log(`${item.filename}: ${item.markdown}`);
  }
});
```

**Python (requests)**:
```python
import requests

url = 'http://localhost:3014/api/ocr/batch'
headers = {'X-API-Key': 'your-api-key'}
files = [
    ('images', open('image1.jpg', 'rb')),
    ('images', open('image2.png', 'rb')),
    ('images', open('image3.jpeg', 'rb')),
]

response = requests.post(url, headers=headers, files=files)
result = response.json()

for item in result['data']['results']:
    if item['success']:
        print(f"{item['filename']}: {item['markdown']}")
```

**响应示例**:
```json
{
  "success": true,
  "message": "批量处理完成: 3/3 成功",
  "data": {
    "total": 3,
    "successCount": 3,
    "failCount": 0,
    "results": [
      {
        "index": 0,
        "filename": "image1.jpg",
        "success": true,
        "markdown": "# 图片1内容\n...",
        "usage": {...}
      },
      {
        "index": 1,
        "filename": "image2.png",
        "success": true,
        "markdown": "## 图片2内容\n...",
        "usage": {...}
      },
      {
        "index": 2,
        "filename": "image3.jpeg",
        "success": false,
        "error": "图片格式不支持"
      }
    ],
    "processingTime": 15234
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. API 统计信息

获取 API 使用统计信息。

**端点**: `GET /api/stats`

**认证**: 需要

**请求示例**:
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3014/api/stats
```

**响应示例**:
```json
{
  "success": true,
  "message": "统计信息获取成功",
  "data": {
    "uptime": {
      "seconds": 86400,
      "hours": "24.00",
      "startTime": "2024-01-14T10:30:00.000Z"
    },
    "requests": {
      "total": 1250,
      "successful": 1200,
      "failed": 50,
      "successRate": "96.00%"
    },
    "ocr": {
      "single": 1000,
      "batch": 50,
      "total": 1050
    },
    "requestsByHour": {
      "2024-01-15T10": 150,
      "2024-01-15T11": 200
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| `MISSING_API_KEY` | 缺少 API Key |
| `INVALID_API_KEY` | API Key 无效 |
| `NO_IMAGE` | 未上传图片 |
| `NO_IMAGES` | 未上传图片(批量) |
| `OCR_ERROR` | OCR 处理失败 |
| `BATCH_OCR_ERROR` | 批量 OCR 处理失败 |
| `INVALID_OCR_SERVICE` | 无效的 OCR 服务类型 |

---

## 环境变量配置

在 `.env` 文件中配置以下变量:

```env
# 服务器端口
PORT=3014

# API Keys (可选,多个用逗号分隔)
API_KEYS=key1,key2,key3

# OCR 服务选择 (textin 或 siliconflow)
OCR_SERVICE=textin

# Textin 配置
TEXTIN_APP_ID=your_app_id
TEXTIN_SECRET_CODE=your_secret_code

# 硅基流动配置
SILICONFLOW_API_KEY=your_api_key

# GLM 提炼配置
GLM_API_KEY=your_glm_api_key
GLM_MODEL=glm-4.5-flash

# OpenAI 提炼配置
OPENAI_ENABLED=false
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

---

## 集成示例

### React 集成

```jsx
import { useState } from 'react';

function OCRComponent() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOCR = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3014/api/ocr', {
        method: 'POST',
        headers: {
          'X-API-Key': 'your-api-key',
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setMarkdown(result.data.markdown);
      } else {
        console.error('OCR 失败:', result.message);
      }
    } catch (error) {
      console.error('请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleOCR(e.target.files[0])}
      />
      {loading && <p>处理中...</p>}
      <div>{markdown}</div>
    </div>
  );
}
```

### Node.js 集成

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function ocrImage(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  const response = await fetch('http://localhost:3014/api/ocr', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      ...form.getHeaders(),
    },
    body: form,
  });

  const result = await response.json();
  return result.data.markdown;
}

// 使用
ocrImage('./image.jpg')
  .then(markdown => console.log(markdown))
  .catch(err => console.error(err));
```

---

## 最佳实践

1. **错误处理**: 始终检查 `success` 字段并处理错误情况
2. **文件大小**: 确保图片不超过 10MB 限制
3. **批量处理**: 批量 API 会顺序处理,大量图片可能需要较长时间
4. **API Key 安全**: 不要在前端代码中硬编码 API Key
5. **超时设置**: OCR 处理可能需要几秒钟,建议设置适当的超时时间
6. **重试机制**: 实现指数退避的重试机制处理临时故障

---

## 性能指标

- **单张图片处理**: 通常 2-10 秒
- **批量图片**: 每张 2-10 秒(顺序处理)
- **并发支持**: 支持多个客户端同时请求
- **成功率**: 通常 >95%

---

## 支持

如有问题,请检查:
1. 服务器日志
2. API 认证配置
3. OCR 服务 API Key 配置
4. 网络连接状态
