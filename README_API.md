# OCR API 服务

这是一个强大的图片转 Markdown OCR API 服务,可以被其他项目轻松集成。

## 快速开始

### 1. 启动服务

```bash
# 安装依赖
npm install

# 启动服务(包含前端和后端)
npm run dev

# 仅启动 API 服务
npm run server
```

服务将在 `http://localhost:3014` 启动

### 2. 配置 API Key (可选)

编辑 `.env` 文件:

```env
# 设置一个或多个 API Keys,用逗号分隔
API_KEYS=your-secret-key-1,your-secret-key-2
```

如果不设置,API 将允许所有请求(开发模式)

### 3. 调用 API

详细的 API 文档请查看 [API.md](./API.md)

**快速测试**:

```bash
# 健康检查
curl http://localhost:3014/api/health

# 单张图片 OCR
curl -X POST http://localhost:3014/api/ocr \
  -H "X-API-Key: your-api-key" \
  -F "image=@test.jpg"

# 批量 OCR
curl -X POST http://localhost:3014/api/ocr/batch \
  -H "X-API-Key: your-api-key" \
  -F "images=@img1.jpg" \
  -F "images=@img2.png"
```

## 客户端示例

### JavaScript/Node.js

查看 [examples/api-client.js](examples/api-client.js)

```javascript
const { ocrImage, ocrImages } = require('./examples/api-client.js');

// 单张图片
const markdown = await ocrImage('image.jpg');
console.log(markdown);

// 批量图片
const results = await ocrImages(['img1.jpg', 'img2.png']);
```

### Python

查看 [examples/api_client.py](examples/api_client.py)

```python
from api_client import OCRClient

client = OCRClient(api_key='your-api-key')

# 单张图片
result = client.ocr_image('image.jpg')
print(result['markdown'])

# 批量图片
results = client.ocr_images(['img1.jpg', 'img2.png'])
```

## API 端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | 不需要 |
| `/api/ocr` | POST | 单张图片 OCR | 需要 |
| `/api/ocr/batch` | POST | 批量图片 OCR | 需要 |
| `/api/stats` | GET | API 统计信息 | 需要 |

## 响应格式

所有 API 响应都遵循统一格式:

### 成功响应

```json
{
  "success": true,
  "message": "操作成功描述",
  "data": {
    // 实际数据
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 功能特性

- ✅ **单张图片 OCR** - 快速准确的图片识别
- ✅ **批量处理** - 支持多张图片顺序处理
- ✅ **Markdown 输出** - 自动转换为 Markdown 格式
- ✅ **AI 内容提炼** - 可选的 GLM/OpenAI 提炼
- ✅ **API Key 认证** - 保护您的 API
- ✅ **统计信息** - 实时监控 API 使用情况
- ✅ **标准化响应** - 统一的响应格式
- ✅ **错误处理** - 详细的错误信息

## 部署建议

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
# 使用 PM2
npm install -g pm2
pm2 start server/index.js --name ocr-api

# 或使用 Docker (需要创建 Dockerfile)
docker build -t ocr-api .
docker run -p 3014:3014 --env-file .env ocr-api
```

### 反向代理配置 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3014;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 文件上传大小限制
        client_max_body_size 10M;
    }
}
```

## 性能优化

1. **使用批量 API** - 一次处理多张图片,减少请求次数
2. **启用内容提炼** - 提升 Markdown 质量
3. **配置超时** - 根据网络情况设置合适的超时时间
4. **实现重试** - 使用指数退避策略处理临时故障

## 安全建议

1. **生产环境必须设置 API Keys**
2. **使用 HTTPS** - 保护数据传输
3. **限制请求频率** - 防止滥用
4. **定期更新依赖** - 保持安全性
5. **监控日志** - 及时发现异常

## 故障排查

### API Key 错误

```
错误: Missing API Key
解决: 在请求中添加 X-API-Key header
```

### 图片上传失败

```
错误: 请上传图片文件
解决: 确保使用 multipart/form-data 格式
```

### OCR 处理失败

```
错误: OCR_ERROR
解决: 检查 OCR 服务配置(TEXTIN_APP_ID, SILICONFLOW_API_KEY 等)
```

## 更多资源

- [完整 API 文档](./API.md)
- [JavaScript 客户端示例](./examples/api-client.js)
- [Python 客户端示例](./examples/api_client.py)
- [环境配置说明](./.env)

## 技术支持

如有问题,请检查:
1. 服务器控制台日志
2. API 统计信息 `/api/stats`
3. 网络连接状态
4. OCR 服务 API Key 配置

## 许可证

根据您的项目许可证使用
