/**
 * OCR API 客户端示例
 * 演示如何从其他项目调用 OCR API
 */

const API_BASE_URL = 'http://localhost:3014';
const API_KEY = 'your-api-key-here'; // 替换为您的 API Key

/**
 * 单张图片 OCR
 * @param {string|File} image - 图片路径或 File 对象
 * @returns {Promise<string>} Markdown 内容
 */
async function ocrImage(image) {
  const formData = new FormData();

  if (typeof image === 'string') {
    // Node.js 环境: 读取文件
    const fs = require('fs');
    formData.append('image', fs.createReadStream(image));
  } else {
    // 浏览器环境: 直接使用 File 对象
    formData.append('image', image);
  }

  const response = await fetch(`${API_BASE_URL}/api/ocr`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`OCR 失败: ${result.message}`);
  }

  console.log(`处理耗时: ${result.data.processingTime}ms`);
  return result.data.markdown;
}

/**
 * 批量图片 OCR
 * @param {string[]|FileList} images - 图片路径数组或 FileList 对象
 * @returns {Promise<Array>} 处理结果数组
 */
async function ocrImages(images) {
  const formData = new FormData();

  if (Array.isArray(images)) {
    // Node.js 环境
    const fs = require('fs');
    images.forEach(path => {
      formData.append('images', fs.createReadStream(path));
    });
  } else {
    // 浏览器环境
    for (let file of images) {
      formData.append('images', file);
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/ocr/batch`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`批量 OCR 失败: ${result.message}`);
  }

  console.log(`成功: ${result.data.successCount}/${result.data.total}, 耗时: ${result.data.processingTime}ms`);
  return result.data.results;
}

/**
 * 获取 API 统计信息
 * @returns {Promise<Object>} 统计信息
 */
async function getStats() {
  const response = await fetch(`${API_BASE_URL}/api/stats`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`获取统计失败: ${result.message}`);
  }

  return result.data;
}

/**
 * 检查服务健康状态
 * @returns {Promise<boolean>} 是否健康
 */
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result = await response.json();
    return result.success && result.data.status === 'ok';
  } catch (error) {
    return false;
  }
}

// ==================== 使用示例 ====================

// 示例 1: 单张图片 OCR
async function example1() {
  try {
    const markdown = await ocrImage('image.jpg');
    console.log('识别结果:', markdown);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// 示例 2: 批量图片 OCR
async function example2() {
  try {
    const results = await ocrImages(['img1.jpg', 'img2.png', 'img3.jpeg']);

    results.forEach(item => {
      if (item.success) {
        console.log(`✓ ${item.filename}:`);
        console.log(item.markdown.substring(0, 100) + '...');
      } else {
        console.error(`✗ ${item.filename}: ${item.error}`);
      }
    });
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// 示例 3: 获取统计信息
async function example3() {
  try {
    const stats = await getStats();
    console.log('API 统计:', {
      运行时间: stats.uptime.hours + '小时',
      总请求数: stats.requests.total,
      成功率: stats.requests.successRate,
      OCR 处理: stats.ocr.total + ' 次',
    });
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// 示例 4: 带重试的 OCR
async function ocrWithRetry(image, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ocrImage(image);
    } catch (error) {
      console.log(`尝试 ${i + 1}/${maxRetries} 失败:`, error.message);

      if (i === maxRetries - 1) {
        throw error;
      }

      // 指数退避: 2秒, 4秒, 8秒...
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 导出函数供其他模块使用
module.exports = {
  ocrImage,
  ocrImages,
  getStats,
  checkHealth,
  ocrWithRetry,
};

// 如果直接运行此文件,执行示例
if (require.main === module) {
  console.log('OCR API 客户端示例');
  console.log('====================\n');

  // 运行示例
  (async () => {
    // 取消注释以运行示例
    // await example1();
    // await example2();
    // await example3();
  })();
}
