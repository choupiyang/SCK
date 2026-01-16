# 图片转 Markdown OCR 工具

> 一个强大的图片转 Markdown OCR 解决方案，提供 Web 界面和独立的 API 服务

基于 React 的移动端友好 Web 应用，使用专业的 OCR API 将图片转换为 Markdown 文档，支持单张和批量处理。项目还提供企业级 API 服务，可被其他项目轻松集成。

## ✨ 功能特性

### Web 应用
- 📱 **移动端优化** - 响应式设计，完美适配手机浏览器
- 🖼️ **单张图片识别** - 快速将单张图片转换为 Markdown
- 📚 **批量处理** - 支持多张图片批量处理
- 💾 **多格式导出** - 支持单个下载或批量合并下载
- 📋 **一键复制** - 方便复制识别结果到剪贴板
- ⚡ **实时预览** - 上传后立即预览图片
- 🎨 **精美渲染** - 杂志风格和简洁风格两种 Markdown 渲染模式

### API 服务
- 🔌 **RESTful API** - 标准化的 API 接口
- 🔐 **API Key 认证** - 保护您的服务
- 📊 **使用统计** - 实时监控 API 使用情况
- 🌐 **跨域支持** - 支持跨域调用
- 📝 **完整文档** - 详细的多语言集成示例
- ⚡ **高性能** - 批量处理和错误重试机制

## 技术栈

### 前端
- React 18
- Vite
- CSS3 (响应式设计)

### 后端
- Express.js
- Multer (文件上传)
- Axios (HTTP 请求)

### OCR 服务
- **Textin** - 专业 OCR 服务(推荐)
- **硅基流动** - DeepSeek OCR / Qwen2.5 模型
- **AI 提炼** - GLM-4.5 / OpenAI GPT-4 可选提炼

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件，添加你的 API 密钥：

```env
# Textin OCR (推荐)
TEXTIN_APP_ID=your_app_id
TEXTIN_SECRET_CODE=your_secret_code
OCR_SERVICE=textin

# 或使用硅基流动
SILICONFLOW_API_KEY=your_api_key
OCR_SERVICE=siliconflow

# 可选: AI 提炼
GLM_API_KEY=your_glm_api_key

# 服务器端口
PORT=3014
VITE_PORT=5173

# 可选: API 认证
API_KEYS=your-secret-key-1,your-secret-key-2
```

### 3. 获取 API 密钥

#### Textin (推荐)
1. 访问 [Textin 官网](https://www.textin.com/)
2. 注册/登录账号
3. 在控制台获取 App ID 和 Secret Code
4. 将密钥填入 `.env` 文件

#### 硅基流动(可选)
1. 访问 [硅基流动官网](https://cloud.siliconflow.cn/)
2. 注册/登录账号
3. 在控制台获取 API Key
4. 将 API Key 填入 `.env` 文件

### 4. 启动开发服务器

```bash
npm run dev
```

这将同时启动前端和后端服务：
- 前端: http://localhost:5173
- 后端: http://localhost:3014

**局域网访问**: 前端已配置支持局域网访问,可通过 `http://your-ip:5173` 访问

### 5. 生产环境部署

构建前端：

```bash
npm run build
```

启动生产服务器：

```bash
npm start
```

## 使用说明

### 单张图片识别

1. 点击 "单张图片" 标签
2. 点击上传区域选择图片，或直接拖拽图片
3. 预览图片后点击 "开始识别"
4. 等待处理完成，查看 Markdown 结果
5. 点击 "复制" 或 "下载" 保存结果

### 批量图片处理

1. 点击 "批量处理" 标签
2. 点击上传区域选择多张图片（最多 20 张）
3. 查看已选择的图片列表
4. 点击 "开始处理" 按钮批量识别
5. 查看处理结果统计和详细内容
6. 点击 "下载全部结果" 获取合并的 Markdown 文件

## 支持的图片格式

- JPG / JPEG
- PNG
- WEBP
- GIF
- BMP
- 其他浏览器支持的图片格式

## 📚 文档

- **[API 完整文档](./API.md)** - 详细的 API 使用说明
- **[API 快速指南](./README_API.md)** - 快速开始使用 API
- **[功能增强说明](./API_ENHANCEMENTS.md)** - API 功能详解
- **[JavaScript 客户端示例](./examples/api-client.js)**
- **[Python 客户端示例](./examples/api_client.py)**

## 🌐 API 集成

本项目可作为独立 API 服务供其他项目调用。

### 快速示例

```bash
# 健康检查
curl http://localhost:3014/api/health

# 单张图片 OCR
curl -X POST http://localhost:3014/api/ocr \
  -H "X-API-Key: your-key" \
  -F "image=@test.jpg"

# 获取统计
curl http://localhost:3014/api/stats
```

### JavaScript

```javascript
import { ocrImage } from './examples/api-client.js';
const markdown = await ocrImage('image.jpg');
```

### Python

```python
from api_client import OCRClient
client = OCRClient(api_key='your-key')
result = client.ocr_image('image.jpg')
```

详细文档请查看 [API.md](./API.md)

## 限制

- 单张图片最大 10MB
- 批量处理无硬性限制,建议不超过 20 张
- API 请求超时时间 60 秒

## 项目结构

```
SCK/
├── server/                    # 后端服务
│   └── index.js              # Express 服务器和 API 路由
├── src/                      # 前端源码
│   ├── components/           # React 组件
│   │   ├── SingleImageOCR.jsx    # 单张图片处理
│   │   ├── BatchImageOCR.jsx     # 批量图片处理
│   │   ├── MarkdownRenderer.jsx  # Markdown 渲染组件
│   │   └── *.css                 # 组件样式
│   ├── App.jsx              # 主应用组件
│   ├── App.css              # 主样式
│   ├── main.jsx             # 入口文件
│   └── index.css            # 全局样式
├── examples/                # API 客户端示例
│   ├── api-client.js        # JavaScript/Node.js 客户端
│   └── api_client.py        # Python 客户端
├── index.html               # HTML 模板
├── vite.config.js           # Vite 配置
├── package.json             # 项目依赖
├── .env                     # 环境变量(需自行创建)
├── .gitignore               # Git 忽略文件
├── LICENSE                  # MIT 许可证
├── API.md                   # API 完整文档
├── README_API.md            # API 快速指南
├── API_ENHANCEMENTS.md      # 功能增强说明
└── README.md                # 项目说明(本文件)
```

## 📡 API 接口

### 核心端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | ❌ |
| `/api/ocr` | POST | 单张图片 OCR | ✅ |
| `/api/ocr/batch` | POST | 批量图片 OCR | ✅ |
| `/api/stats` | GET | API 统计信息 | ✅ |

完整的 API 文档请查看 [API.md](./API.md)

## 开发注意事项

### 移动端优化
- 使用触摸友好的按钮尺寸（至少 44x44px）
- 响应式布局适配各种屏幕尺寸
- 优化图片加载和预览性能
- 防止页面缩放（viewport 设置）

### 性能优化
- 图片预览使用 `URL.createObjectURL`
- 批量处理使用 Promise.all 并发请求
- 组件卸载时释放 Object URL 避免内存泄漏

### 错误处理
- 文件类型验证
- 文件大小限制
- API 请求超时处理
- 用户友好的错误提示

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 🌟 Star History

如果这个项目对你有帮助,请给它一个 Star!

## 📧 联系方式

- 作者: choupiyang
- GitHub: [@choupiyang](https://github.com/choupiyang)

如有问题或建议，请通过 [Issue](https://github.com/choupiyang/SCK/issues) 联系。

---

<div align="center">

**如果觉得这个项目有用,请给个 ⭐️ Star 支持一下!**

Made with ❤️ by choupiyang

</div>
