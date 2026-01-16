import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import MarkdownRenderer from './MarkdownRenderer';
import './SingleImageOCR.css';

function SingleImageOCR() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [styleMode, setStyleMode] = useState('magazine'); // 'magazine' 或 'simple'
  const fileInputRef = useRef(null);
  const markdownRef = useRef(null); // 用于截图的 ref（纯内容）
  const previewRef = useRef(null);
  const resultRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      triggerShake();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      triggerShake();
      return;
    }

    setError('');
    setShowResult(false);
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);

      // 上传后自动滚动到预览区域
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const triggerShake = () => {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        uploadSection.style.animation = '';
      }, 500);
    }
  };

  const handleOCR = async () => {
    if (!image) {
      setError('请先选择图片');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    setMarkdown('');

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '处理失败');
      }

      if (data.success) {
        setMarkdown(data.markdown);
        setShowResult(true);

        // 自动下载同名 MD 文件
        const fileName = image.name.replace(/\.[^/.]+$/, ''); // 去除扩展名
        autoDownloadMarkdown(data.markdown, fileName);

        // 识别完成后自动滚动到结果区域
        setTimeout(() => {
          if (resultRef.current) {
            resultRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      } else {
        throw new Error(data.error || '处理失败');
      }
    } catch (err) {
      setError(err.message || '处理失败，请重试');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const autoDownloadMarkdown = async (content, fileName) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = async () => {
    if (!markdownRef.current) return;

    try {
      const canvas = await html2canvas(markdownRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高清晰度
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ocr-preview-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('截图失败:', error);
      setError('截图失败，请重试');
    }
  };

  const handleCopy = async () => {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      alert('已复制到剪贴板');
    } catch (err) {
      setError('复制失败');
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setMarkdown('');
    setError('');
    setShowResult(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="single-ocr">
      {/* Upload Section */}
      <motion.div
        className="upload-section memphis-card"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          id="image-upload"
        />
        <motion.label
          htmlFor="image-upload"
          className="upload-label"
          whileHover={{ scale: 1.02, borderColor: 'var(--color-primary)' }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="upload-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            📷
          </motion.div>
          <div className="upload-text">点击或拖拽上传图片</div>
          <div className="upload-hint">支持 JPG、PNG、WEBP 等格式，最大 10MB</div>
        </motion.label>

        <AnimatePresence>
          {preview && (
            <motion.div
              ref={previewRef}
              className="preview-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="preview-image-wrapper"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <img src={preview} alt="Preview" className="preview-image" />
                <motion.button
                  className="remove-btn"
                  onClick={handleReset}
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.8 }}
                >
                  ✕
                </motion.button>
              </motion.div>

              <motion.button
                className="ocr-btn memphis-btn"
                onClick={handleOCR}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    处理中...
                  </motion.span>
                ) : (
                  '开始识别'
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.span
              className="error-icon"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              ⚠️
            </motion.span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Section */}
      <AnimatePresence>
        {markdown && showResult && (
          <motion.div
            ref={resultRef}
            className="result-section memphis-card"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            <div className="result-header">
              <motion.h3
                initial={{ x: -50 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
              >
                识别结果
              </motion.h3>
              <motion.div
                className="result-actions"
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              >
                <motion.button
                  className="action-btn memphis-btn secondary"
                  onClick={handleCopy}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  📋 复制
                </motion.button>
                <motion.button
                  className="action-btn memphis-btn secondary"
                  onClick={handleDownload}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  📄 下载 MD
                </motion.button>
                <motion.button
                  className="action-btn memphis-btn accent"
                  onClick={handleDownloadHTML}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  🖼️ 下载截图
                </motion.button>
              </motion.div>
            </div>

            {/* 样式切换器 */}
            <motion.div
              className="style-switcher-wrapper"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="style-switcher">
                <button
                  className={`style-btn ${styleMode === 'magazine' ? 'active' : ''}`}
                  onClick={() => setStyleMode('magazine')}
                  title="杂志风格排版"
                >
                  📰 杂志风格
                </button>
                <button
                  className={`style-btn ${styleMode === 'simple' ? 'active' : ''}`}
                  onClick={() => setStyleMode('simple')}
                  title="简约风格排版"
                >
                  📄 简约风格
                </button>
              </div>
            </motion.div>

            <motion.div
              className="markdown-content-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div ref={markdownRef} className="markdown-capture-area">
                <MarkdownRenderer content={markdown} styleMode={styleMode} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SingleImageOCR;
