const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ==================== API 统计数据 ====================
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  ocrRequests: 0,
  batchOcrRequests: 0,
  startTime: new Date(),
  requestsByHour: {},
};

// ==================== 标准化响应格式 ====================
class ApiResponse {
  static success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message, code = 'INTERNAL_ERROR', details = null) {
    return {
      success: false,
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}

// ==================== API Key 认证中间件 ====================
function validateApiKey(req, res, next) {
  // 如果未设置 API Keys,则跳过验证(开发模式)
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(k => k.trim()) : [];

  if (validApiKeys.length === 0) {
    // 未配置 API Keys,允许所有请求
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey) {
    return res.status(401).json(ApiResponse.error('Missing API Key. Please provide X-API-Key header or api_key query parameter.', 'MISSING_API_KEY'));
  }

  if (!validApiKeys.includes(providedKey)) {
    return res.status(403).json(ApiResponse.error('Invalid API Key.', 'INVALID_API_KEY'));
  }

  next();
}

// ==================== 请求统计中间件 ====================
function updateStats(req, res, next) {
  apiStats.totalRequests++;

  const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  if (!apiStats.requestsByHour[currentHour]) {
    apiStats.requestsByHour[currentHour] = 0;
  }
  apiStats.requestsByHour[currentHour]++;

  // 记录原始的 res.json
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success === false) {
      apiStats.failedRequests++;
    } else {
      apiStats.successfulRequests++;
    }
    return originalJson.call(this, data);
  };

  next();
}

// ==================== 中间件配置 ====================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(updateStats); // 添加统计中间件

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  },
});

// 从环境变量获取 OCR 提示词
const OCR_PROMPT = process.env.OCR_PROMPT ||
  `你是一个专业的 OCR（光学字符识别）助手。你的任务是从图片中精确提取文字内容并转换为 Markdown 格式。

核心原则：准确优先于完整，宁可遗漏也不编造。

字符识别规则：
1. 精确识别每个字符，特别是数字、标点符号、特殊字符
2. 区分相似字符：0（数字零）vs O（字母O），1（数字一）vs l（小写L）vs I（大写i）
3. 保持字符原样，不要修正拼写错误，不要添加遗漏字符
4. 遇到模糊不清的字符时：
   - 如果可以合理推测，输出推测结果
   - 如果完全无法识别，跳过该字符但保持句子连贯
   - 绝对不要编造或随机生成字符
5. 处理多语言内容：
   - 中文：准确识别每个汉字，注意简繁体
   - 英文：保持大小写，识别标点和特殊符号
   - 数字：仔细识别 0-9，不要混淆 1 和 l、0 和 O
   - 代码：保持缩进、特殊字符、换行符
6. 特殊符号处理：
   - 正确识别各种引号（""''「」『』）
   - 正确识别括号（()[]{}（）【】）
   - 正确识别标点（，。！？：；、）
   - 正确识别数学符号（+-×÷=<>≤≥）
   - 正确识别货币符号（$¥€£）
   - 正确识别箭头和其他特殊字符（→←↑↓★◆●）

格式要求：
1. 只输出 Markdown 内容本身 - 不要任何解释、开场白、"以下是内容"、"我已经识别"、道歉等额外文字
2. 直接从 Markdown 内容开始（例如：# 标题，或直接是文字内容）
3. 保持原有结构：标题、列表、代码块、表格、强调、链接等
4. 使用正确的 Markdown 语法：# 表示标题，* 表示列表，\` 表示代码，** 表示粗体
5. 如果图片包含代码，使用正确的代码块语法并标注语言标签，保持精确的缩进和空格
6. 如果图片包含表格，使用 Markdown 表格语法，准确对齐列
7. 代码块中的所有字符必须原样保留，包括空格、制表符、特殊符号
8. 不要添加任何原图片中没有的内容

质量控制：
- 每个字符都要有依据，不要凭想象添加
- 不要"修正"原文，即使看起来有错误
- 代码和命令必须逐字符精确，不能有任何偏差
- URL、邮箱、文件名等必须完全准确

记住：只输出精确识别的 Markdown 内容，不要任何对话填充词或解释。准确性比完整性更重要。`;

// GLM 提炼提示词
const GLM_REFINE_PROMPT = process.env.GLM_REFINE_PROMPT ||
  `你是一个 Markdown 内容提炼专家。你的任务是从 OCR 识别结果中提取纯净的 Markdown 内容。

严格要求：
1. 只输出纯净的 Markdown 内容 - 移除所有开场白、解释、道歉、说明性文字
2. 保持原有的 Markdown 结构和格式
3. 保留所有标题、列表、代码块、表格、链接等元素
4. 修正明显的格式错误（如列表符号、代码块标记）
5. 不要添加任何原内容中没有的新信息
6. 如果原内容已经是纯净的 Markdown，直接原样输出
7. 绝对不要添加"以下是提炼后的内容"等开场白
8. 直接从 Markdown 内容开始输出

记住：只输出提炼后的纯净 Markdown，不要任何额外文字。`;

// 获取 GLM 模型名称（可配置）
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.5-flash';

// OCR 模型选择（可配置）
const OCR_MODEL = process.env.OCR_MODEL || 'deepseek-ai/DeepSeek-OCR';

// OCR 服务选择（textin 或 siliconflow）
const OCR_SERVICE = process.env.OCR_SERVICE || 'textin';

// Textin API 配置
const TEXTIN_APP_ID = process.env.TEXTIN_APP_ID;
const TEXTIN_SECRET_CODE = process.env.TEXTIN_SECRET_CODE;

// OpenAI 兼容 API 配置
const OPENAI_ENABLED = process.env.OPENAI_ENABLED === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// 智谱 GLM 提炼 API 调用
async function callGLMRefineAPI(markdownContent) {
  const apiKey = process.env.GLM_API_KEY;

  if (!apiKey) {
    // 如果没有设置 GLM API Key，直接返回原内容
    console.log('未设置 GLM_API_KEY，跳过提炼步骤');
    return markdownContent;
  }

  // 检查内容是否为空或过短
  if (!markdownContent || markdownContent.trim().length < 10) {
    console.log('OCR 内容为空或过短，跳过提炼步骤');
    return markdownContent;
  }

  try {
    console.log('→ GLM 提炼输入长度:', markdownContent.length, '字符');
    console.log('→ 使用模型:', GLM_MODEL);

    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: GLM_MODEL,
        messages: [
          {
            role: 'system',
            content: GLM_REFINE_PROMPT
          },
          {
            role: 'user',
            content: `请提炼以下 OCR 识别结果，输出纯净的 Markdown 内容：\n\n${markdownContent}`
          }
        ],
        temperature: 0.3,
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      }
    );

    // 详细的响应日志
    console.log('→ GLM API 响应状态:', response.status);
    console.log('→ GLM 响应数据键:', Object.keys(response.data));

    const refinedContent = response.data.choices[0]?.message?.content;

    if (!refinedContent || refinedContent.trim().length === 0) {
      console.log('⚠️  GLM 返回内容为空或无效');
      console.log('→ response.data.choices:', JSON.stringify(response.data.choices).substring(0, 200));
      console.log('→ 使用原始 OCR 结果');
      return markdownContent;
    }

    // 检查提炼后的内容是否过短（可能被过度删除）
    if (refinedContent.length < markdownContent.length * 0.3) {
      console.log('⚠️  GLM 提炼后内容过短 (', refinedContent.length, '/', markdownContent.length, ')');
      console.log('→ 可能被过度删除，使用原始 OCR 结果');
      return markdownContent;
    }

    console.log('✓ GLM 提炼完成');
    console.log('→ GLM 提炼输出长度:', refinedContent.length, '字符');
    console.log('→ 内容变化率:', ((refinedContent.length / markdownContent.length) * 100).toFixed(1) + '%');

    return refinedContent;
  } catch (error) {
    console.error('❌ GLM 提炼 API 调用失败');
    console.error('   错误类型:', error.code || 'UNKNOWN');
    console.error('   错误信息:', error.response?.data || error.message);

    // 如果提炼失败，返回原内容
    console.log('→ 提炼失败，使用原始 OCR结果');
    return markdownContent;
  }
}

// OpenAI 兼容 API 提炼调用
async function callOpenAIRefineAPI(markdownContent) {
  if (!OPENAI_ENABLED || !OPENAI_API_KEY) {
    console.log('OpenAI API 未启用或未配置 API Key');
    return null;
  }

  // 检查内容是否为空或过短
  if (!markdownContent || markdownContent.trim().length < 10) {
    console.log('OCR 内容为空或过短，跳过 OpenAI 提炼步骤');
    return null;
  }

  try {
    console.log('→ OpenAI 提炼输入长度:', markdownContent.length, '字符');
    console.log('→ 使用模型:', OPENAI_MODEL);
    console.log('→ API 端点:', OPENAI_BASE_URL);

    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: GLM_REFINE_PROMPT
          },
          {
            role: 'user',
            content: `请提炼以下 OCR 识别结果，输出纯净的 Markdown 内容：\n\n${markdownContent}`
          }
        ],
        temperature: 0.3,
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      }
    );

    const refinedContent = response.data.choices[0]?.message?.content;

    if (!refinedContent) {
      console.log('⚠️  OpenAI 返回内容为空');
      return null;
    }

    console.log('✓ OpenAI 提炼完成');
    console.log('→ OpenAI 提炼输出长度:', refinedContent.length, '字符');
    console.log('→ 内容变化率:', ((refinedContent.length / markdownContent.length) * 100).toFixed(1) + '%');

    return refinedContent;
  } catch (error) {
    console.error('❌ OpenAI 提炼 API 调用失败');
    console.error('   错误类型:', error.code || 'UNKNOWN');
    console.error('   错误信息:', error.response?.data || error.message);

    // 如果提炼失败，返回 null 表示使用其他方法
    console.log('→ OpenAI 提炼失败');
    return null;
  }
}

// Textin OCR API 调用
async function callTextinAPI(imageBuffer) {
  if (!TEXTIN_APP_ID || !TEXTIN_SECRET_CODE) {
    throw new Error('未设置 TEXTIN_APP_ID 或 TEXTIN_SECRET_CODE 环境变量');
  }

  try {
    console.log('→ 开始调用 Textin OCR API...');

    const response = await axios.post(
      'https://api.textin.com/ai/service/v1/pdf_to_markdown',
      imageBuffer,
      {
        headers: {
          'x-ti-app-id': TEXTIN_APP_ID,
          'x-ti-secret-code': TEXTIN_SECRET_CODE,
          'Content-Type': 'application/octet-stream',
        },
        params: {
          // 使用 scan 模式进行 OCR 识别
          parse_mode: 'scan',
          // 生成 Markdown 表格（而不是 HTML）
          table_flavor: 'md',
          // 生成标题层级
          apply_document_tree: 1,
          // 不返回图片
          get_image: 'none',
          // 不进行图表识别
          apply_chart: 0,
        },
        timeout: 60000, // 60秒超时
      }
    );

    if (response.data.code !== 200) {
      throw new Error(`Textin API 返回错误: ${response.data.message} (code: ${response.data.code})`);
    }

    const markdown = response.data.result?.markdown || '';

    console.log('✓ Textin OCR 调用成功');
    console.log('→ Textin 识别内容长度:', markdown.length, '字符');
    console.log('→ 引擎版本:', response.data.version);
    console.log('→ 处理耗时:', response.data.duration, 'ms');

    if (markdown.length === 0) {
      console.log('⚠️  警告: Textin 识别结果为空');
    } else if (markdown.length < 50) {
      console.log('⚠️  警告: Textin 识别内容过短 (', markdown.length, '字符)');
      console.log('→ 内容预览:', markdown.substring(0, 100));
    } else {
      console.log('→ 内容预览 (前150字符):', markdown.substring(0, 150) + '...');
    }

    return {
      choices: [{
        message: {
          content: markdown
        }
      }]
    };
  } catch (error) {
    console.error('❌ Textin OCR API 调用失败');
    console.error('   错误类型:', error.code || 'UNKNOWN');
    console.error('   错误信息:', error.response?.data || error.message);

    if (error.response?.data?.code) {
      console.error('   Textin 错误码:', error.response.data.code);
      console.error('   Textin 错误信息:', error.response.data.message);
    }

    throw new Error(error.response?.data?.message || error.message);
  }
}

// 硅基流动 OCR API 调用
async function callOCRAPI(base64Image) {
  const apiKey = process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    throw new Error('未设置 SILICONFLOW_API_KEY 环境变量');
  }

  try {
    console.log('→ 开始调用 OCR API...');
    console.log('→ 使用模型:', OCR_MODEL);

    const response = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: OCR_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                },
              },
              {
                type: 'text',
                text: OCR_PROMPT,
              },
            ],
          },
        ],
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      }
    );

    const markdown = response.data.choices[0]?.message?.content || '';

    console.log('✓ OCR 调用成功');
    console.log('→ OCR 识别内容长度:', markdown.length, '字符');

    if (markdown.length === 0) {
      console.log('⚠️  警告: OCR 识别结果为空');
    } else if (markdown.length < 50) {
      console.log('⚠️  警告: OCR 识别内容过短 (', markdown.length, '字符)');
      console.log('→ 内容预览:', markdown.substring(0, 100));
    } else {
      console.log('→ 内容预览 (前150字符):', markdown.substring(0, 150) + '...');
    }

    return response.data;
  } catch (error) {
    console.error('❌ OCR API 调用失败');
    console.error('   错误类型:', error.code || 'UNKNOWN');
    console.error('   错误信息:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
}

// 单张图片 OCR API
app.post('/api/ocr', validateApiKey, upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  apiStats.ocrRequests++;

  try {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('请上传图片文件', 'NO_IMAGE'));
    }

    let result;

    // 根据 OCR_SERVICE 选择使用哪个 OCR 服务
    if (OCR_SERVICE === 'textin') {
      console.log('使用 Textin OCR 服务');
      result = await callTextinAPI(req.file.buffer);
    } else if (OCR_SERVICE === 'siliconflow') {
      console.log('使用硅基流动 OCR 服务');
      // 将图片转换为 base64
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      result = await callOCRAPI(base64Image);
    } else {
      return res.status(500).json(ApiResponse.error(`未知的 OCR 服务类型: ${OCR_SERVICE}`, 'INVALID_OCR_SERVICE'));
    }

    // 提取 Markdown 内容
    let markdown = result.choices[0]?.message?.content || '';
    console.log('OCR 识别完成，内容长度:', markdown.length);

    // 优先使用 OpenAI 提炼（如果启用）
    if (OPENAI_ENABLED && OPENAI_API_KEY) {
      console.log('开始调用 OpenAI API 提炼...');
      const openaiRefined = await callOpenAIRefineAPI(markdown);
      if (openaiRefined) {
        markdown = openaiRefined;
        console.log('OpenAI 提炼完成，最终内容长度:', markdown.length);
      } else {
        console.log('OpenAI 提炼失败，尝试使用 GLM 提炼...');
        // OpenAI 失败，尝试 GLM
        if (process.env.GLM_API_KEY) {
          markdown = await callGLMRefineAPI(markdown);
          console.log('GLM 提炼完成，最终内容长度:', markdown.length);
        }
      }
    } else if (process.env.GLM_API_KEY) {
      // 未启用 OpenAI，使用 GLM 提炼
      console.log('开始调用 GLM 提炼...');
      markdown = await callGLMRefineAPI(markdown);
      console.log('GLM 提炼完成，最终内容长度:', markdown.length);
    } else {
      console.log('未配置任何提炼 API，使用原始 OCR 结果');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✓ OCR 请求完成，耗时: ${processingTime}ms`);

    res.json(ApiResponse.success({
      markdown,
      usage: result.usage,
      processingTime,
    }, 'OCR 处理成功'));
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`✗ OCR 请求失败，耗时: ${processingTime}ms`, error.message);

    res.status(500).json(ApiResponse.error(error.message, 'OCR_ERROR', {
      processingTime,
    }));
  }
});

// 批量图片 OCR API（顺序处理，避免 API 并发限制）
app.post('/api/ocr/batch', validateApiKey, upload.array('images'), async (req, res) => {
  const startTime = Date.now();
  apiStats.batchOcrRequests++;
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(ApiResponse.error('请上传图片文件', 'NO_IMAGES'));
    }

    console.log(`开始处理 ${req.files.length} 张图片（顺序处理）...`);

    const results = [];

    // 顺序处理每张图片，避免 API 并发限制
    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      try {
        let result;

        // 根据 OCR_SERVICE 选择使用哪个 OCR 服务
        if (OCR_SERVICE === 'textin') {
          console.log(`[${index + 1}/${req.files.length}] 使用 Textin OCR: ${file.originalname}`);
          result = await callTextinAPI(file.buffer);
        } else if (OCR_SERVICE === 'siliconflow') {
          console.log(`[${index + 1}/${req.files.length}] 使用硅基流动 OCR: ${file.originalname}`);
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          result = await callOCRAPI(base64Image);
        } else {
          throw new Error(`未知的 OCR 服务类型: ${OCR_SERVICE}`);
        }
        let markdown = result.choices[0]?.message?.content || '';
        console.log(`[${index + 1}/${req.files.length}] OCR 识别完成: ${file.originalname}`);

        // 使用提炼 API（优先 OpenAI，其次 GLM）
        if (OPENAI_ENABLED && OPENAI_API_KEY) {
          console.log(`[${index + 1}/${req.files.length}] 开始 OpenAI 提炼: ${file.originalname}`);
          const openaiRefined = await callOpenAIRefineAPI(markdown);
          if (openaiRefined) {
            markdown = openaiRefined;
            console.log(`[${index + 1}/${req.files.length}] OpenAI 提炼完成: ${file.originalname}`);
          } else {
            console.log(`[${index + 1}/${req.files.length}] OpenAI 提炼失败，尝试 GLM: ${file.originalname}`);
            if (process.env.GLM_API_KEY) {
              markdown = await callGLMRefineAPI(markdown);
              console.log(`[${index + 1}/${req.files.length}] GLM 提炼完成: ${file.originalname}`);
            }
          }
        } else if (process.env.GLM_API_KEY) {
          console.log(`[${index + 1}/${req.files.length}] 开始 GLM 提炼: ${file.originalname}`);
          markdown = await callGLMRefineAPI(markdown);
          console.log(`[${index + 1}/${req.files.length}] GLM 提炼完成: ${file.originalname}`);
        }

        results.push({
          index,
          filename: file.originalname,
          success: true,
          markdown,
          usage: result.usage,
        });
      } catch (error) {
        console.error(`[${index + 1}/${req.files.length}] 处理失败: ${file.originalname}`, error.message);
        results.push({
          index,
          filename: file.originalname,
          success: false,
          error: error.message,
        });
      }
    }

    // 统计
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const processingTime = Date.now() - startTime;

    console.log(`✓ 批量 OCR 完成，成功: ${successCount}, 失败: ${failCount}, 耗时: ${processingTime}ms`);

    res.json(ApiResponse.success({
      total: req.files.length,
      successCount,
      failCount,
      results,
      processingTime,
    }, `批量处理完成: ${successCount}/${req.files.length} 成功`));
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`✗ 批量 OCR 失败，耗时: ${processingTime}ms`, error.message);

    res.status(500).json(ApiResponse.error(error.message, 'BATCH_OCR_ERROR', {
      processingTime,
    }));
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json(ApiResponse.success({
    status: 'ok',
    uptime: Math.floor((Date.now() - apiStats.startTime) / 1000), // 秒
  }, '服务运行正常'));
});

// API 统计信息（需要认证）
app.get('/api/stats', validateApiKey, (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - apiStats.startTime) / 1000);
  const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

  res.json(ApiResponse.success({
    uptime: {
      seconds: uptimeSeconds,
      hours: uptimeHours,
      startTime: apiStats.startTime,
    },
    requests: {
      total: apiStats.totalRequests,
      successful: apiStats.successfulRequests,
      failed: apiStats.failedRequests,
      successRate: apiStats.totalRequests > 0
        ? ((apiStats.successfulRequests / apiStats.totalRequests) * 100).toFixed(2) + '%'
        : 'N/A',
    },
    ocr: {
      single: apiStats.ocrRequests,
      batch: apiStats.batchOcrRequests,
      total: apiStats.ocrRequests + apiStats.batchOcrRequests,
    },
    requestsByHour: apiStats.requestsByHour,
  }, '统计信息获取成功'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`\n=== 配置信息 ===`);

  // OCR 服务配置
  if (OCR_SERVICE === 'textin') {
    if (TEXTIN_APP_ID && TEXTIN_SECRET_CODE) {
      console.log(`OCR 服务: Textin（专业 OCR 服务）`);
      console.log(`   App ID: ${TEXTIN_APP_ID.substring(0, 8)}...`);
    } else {
      console.log(`OCR 服务: Textin（未配置）`);
      console.log(`   ⚠️  请设置 TEXTIN_APP_ID 和 TEXTIN_SECRET_CODE`);
    }
  } else if (OCR_SERVICE === 'siliconflow') {
    console.log(`OCR 服务: 硅基流动 AI 模型`);
    console.log(`   模型: ${OCR_MODEL}`);
    console.log(`   Prompt: ${OCR_PROMPT ? '使用自定义提示词' : '使用默认中文提示词'}`);
    console.log(`   Prompt Length: ${OCR_PROMPT.length} 字符`);
  } else {
    console.log(`OCR 服务: 未知 (${OCR_SERVICE})`);
  }

  // OpenAI 配置
  if (OPENAI_ENABLED && OPENAI_API_KEY) {
    console.log(`OpenAI Refine: ✓ 已启用`);
    console.log(`   模型: ${OPENAI_MODEL}`);
    console.log(`   端点: ${OPENAI_BASE_URL}`);
  } else {
    console.log(`OpenAI Refine: ✗ 未启用`);
  }

  // GLM 配置
  if (process.env.GLM_API_KEY) {
    if (OPENAI_ENABLED && OPENAI_API_KEY) {
      console.log(`GLM Refine: ○ 已配置 ${GLM_MODEL}（作为备用）`);
    } else {
      console.log(`GLM Refine: ✓ 已启用 ${GLM_MODEL} 提炼`);
    }
  } else {
    console.log(`GLM Refine: ✗ 未配置 GLM_API_KEY`);
  }

  // 总体状态
  if (!OPENAI_ENABLED && !process.env.GLM_API_KEY) {
    console.log(`\n⚠️  警告: 未配置任何提炼 API，将使用原始 OCR 结果`);
  }

  console.log(`================\n`);
});
