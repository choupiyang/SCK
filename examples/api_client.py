"""
OCR API Python 客户端示例
演示如何从 Python 项目调用 OCR API
"""

import requests
from typing import List, Dict, Optional
import time


class OCRClient:
    """OCR API 客户端"""

    def __init__(self, base_url: str = "http://localhost:3014", api_key: str = None):
        """
        初始化客户端

        Args:
            base_url: API 基础 URL
            api_key: API Key (可选,如果服务器配置了认证)
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()

        if api_key:
            self.session.headers.update({'X-API-Key': api_key})

    def ocr_image(self, image_path: str) -> Dict:
        """
        单张图片 OCR

        Args:
            image_path: 图片文件路径

        Returns:
            包含 markdown 和元数据的字典

        Raises:
            Exception: OCR 处理失败
        """
        url = f"{self.base_url}/api/ocr"

        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = self.session.post(url, files=files)

        result = response.json()

        if not result.get('success'):
            raise Exception(f"OCR 失败: {result.get('message')}")

        data = result.get('data', {})
        print(f"✓ 处理耗时: {data.get('processingTime', 0)}ms")

        return {
            'markdown': data.get('markdown'),
            'usage': data.get('usage'),
            'processing_time': data.get('processingTime'),
        }

    def ocr_images(self, image_paths: List[str]) -> List[Dict]:
        """
        批量图片 OCR

        Args:
            image_paths: 图片文件路径列表

        Returns:
            处理结果列表
        """
        url = f"{self.base_url}/api/ocr/batch"

        files = [('images', open(path, 'rb')) for path in image_paths]
        response = self.session.post(url, files=files)

        # 关闭所有文件
        for _, f in files:
            f.close()

        result = response.json()

        if not result.get('success'):
            raise Exception(f"批量 OCR 失败: {result.get('message')}")

        data = result.get('data', {})
        print(f"✓ 成功: {data.get('successCount')}/{data.get('total')}, 耗时: {data.get('processingTime', 0)}ms")

        return data.get('results', [])

    def get_stats(self) -> Dict:
        """
        获取 API 统计信息

        Returns:
            统计信息字典
        """
        url = f"{self.base_url}/api/stats"
        response = self.session.get(url)
        result = response.json()

        if not result.get('success'):
            raise Exception(f"获取统计失败: {result.get('message')}")

        return result.get('data', {})

    def check_health(self) -> bool:
        """
        检查服务健康状态

        Returns:
            是否健康
        """
        try:
            url = f"{self.base_url}/api/health"
            response = self.session.get(url)
            result = response.json()
            return result.get('success') and result.get('data', {}).get('status') == 'ok'
        except Exception:
            return False

    def ocr_with_retry(self, image_path: str, max_retries: int = 3) -> Dict:
        """
        带重试的 OCR

        Args:
            image_path: 图片路径
            max_retries: 最大重试次数

        Returns:
            OCR 结果
        """
        for attempt in range(max_retries):
            try:
                return self.ocr_image(image_path)
            except Exception as e:
                print(f"尝试 {attempt + 1}/{max_retries} 失败: {e}")

                if attempt == max_retries - 1:
                    raise

                # 指数退避
                delay = 2 ** attempt
                print(f"等待 {delay} 秒后重试...")
                time.sleep(delay)


# ==================== 使用示例 ====================

def example1_single_image():
    """示例 1: 单张图片 OCR"""
    client = OCRClient(api_key='your-api-key')

    try:
        result = client.ocr_image('image.jpg')
        print("识别结果:")
        print(result['markdown'][:200] + '...')

    except Exception as e:
        print(f"错误: {e}")


def example2_batch_images():
    """示例 2: 批量图片 OCR"""
    client = OCRClient(api_key='your-api-key')

    try:
        results = client.ocr_images(['image1.jpg', 'image2.png', 'image3.jpeg'])

        for item in results:
            if item['success']:
                print(f"✓ {item['filename']}:")
                print(f"  {item['markdown'][:100]}...")
            else:
                print(f"✗ {item['filename']}: {item['error']}")

    except Exception as e:
        print(f"错误: {e}")


def example3_get_stats():
    """示例 3: 获取统计信息"""
    client = OCRClient(api_key='your-api-key')

    try:
        stats = client.get_stats()
        print("API 统计:")
        print(f"  运行时间: {stats['uptime']['hours']} 小时")
        print(f"  总请求数: {stats['requests']['total']}")
        print(f"  成功率: {stats['requests']['successRate']}")
        print(f"  OCR 处理: {stats['ocr']['total']} 次")

    except Exception as e:
        print(f"错误: {e}")


def example4_with_retry():
    """示例 4: 带重试的 OCR"""
    client = OCRClient(api_key='your-api-key')

    try:
        result = client.ocr_with_retry('image.jpg', max_retries=3)
        print("识别结果:")
        print(result['markdown'][:200] + '...')

    except Exception as e:
        print(f"错误: {e}")


def example5_save_to_file():
    """示例 5: 保存结果到文件"""
    client = OCRClient(api_key='your-api-key')

    try:
        result = client.ocr_image('image.jpg')

        # 保存 Markdown 到文件
        with open('output.md', 'w', encoding='utf-8') as f:
            f.write(result['markdown'])

        print("✓ 结果已保存到 output.md")

    except Exception as e:
        print(f"错误: {e}")


if __name__ == '__main__':
    print("OCR API Python 客户端示例")
    print("=" * 40 + "\n")

    # 取消注释以运行示例
    # example1_single_image()
    # example2_batch_images()
    # example3_get_stats()
    # example4_with_retry()
    # example5_save_to_file()
