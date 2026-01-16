import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import MarkdownRenderer from './MarkdownRenderer';
import './BatchImageOCR.css';

function BatchImageOCR() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const markdownRefs = useRef({});
  const resultItemRefs = useRef({});
  const previousResultsLength = useRef(0);
  const imagesGridRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setError('没有有效的图片文件');
      return;
    }

    if (validFiles.length < files.length) {
      setError(`${files.length - validFiles.length} 个文件被跳过（非图片或超过10MB）`);
    } else {
      setError('');
    }

    const newImages = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));

    setImages(prev => [...prev, ...newImages]);
    setResults({});

    // 上传后自动滚动到图片网格
    setTimeout(() => {
      if (imagesGridRef.current) {
        imagesGridRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleRemoveImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter(img => img.id !== id);
    });
    // 清理对应的 result 和 ref
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[id];
      return newResults;
    });
    delete markdownRefs.current[id];
    delete resultItemRefs.current[id];
  };

  // 自动滚动到新结果
  useEffect(() => {
    const currentResultsLength = Object.keys(results).length;

    // 只有当results数量增加时才触发滚动
    if (currentResultsLength > previousResultsLength.current) {
      let newResultId = null;

      // 从后往前遍历images，找到最后一个有结果的图片
      // 因为队列是顺序处理的，最后一个有结果的就是最新的
      for (let i = images.length - 1; i >= 0; i--) {
        const imageId = images[i].id;
        if (results[imageId] && resultItemRefs.current[imageId]) {
          newResultId = imageId;
          break;
        }
      }

      if (newResultId) {
        // 等待DOM更新完成
        const timeoutId = setTimeout(() => {
          const resultElement = resultItemRefs.current[newResultId];
          if (resultElement) {
            resultElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // 添加高亮动画效果
            resultElement.classList.add('result-highlight');

            const highlightTimeoutId = setTimeout(() => {
              if (resultElement) {
                resultElement.classList.remove('result-highlight');
              }
            }, 1500);

            // 清理函数
            return () => clearTimeout(highlightTimeoutId);
          }
        }, 100);

        // 清理函数
        return () => clearTimeout(timeoutId);
      }

      // 更新计数器
      previousResultsLength.current = currentResultsLength;
    }
  }, [results, images]);

  // 单个图片处理函数
  const processImage = async (image) => {
    setCurrentProcessing(image.id);
    setImages(prev => prev.map(img =>
      img.id === image.id ? { ...img, status: 'processing' } : img
    ));

    try {
      const formData = new FormData();
      formData.append('image', image.file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '处理失败');
      }

      if (data.success) {
        // 自动下载同名 MD 文件
        const fileName = image.file.name.replace(/\.[^/.]+$/, ''); // 去除扩展名
        autoDownloadSingleMarkdown(data.markdown, fileName);

        setResults(prev => ({
          ...prev,
          [image.id]: {
            success: true,
            markdown: data.markdown,
            filename: image.file.name,
          }
        }));

        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, status: 'success' } : img
        ));

        return { success: true };
      } else {
        throw new Error(data.error || '处理失败');
      }
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [image.id]: {
          success: false,
          error: err.message,
          filename: image.file.name,
        }
      }));

      setImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, status: 'error' } : img
      ));

      return { success: false, error: err.message };
    } finally {
      setCurrentProcessing(null);
    }
  };

  // 队列处理所有图片
  const handleProcessAll = async () => {
    if (images.length === 0) {
      setError('请先添加图片');
      return;
    }

    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) {
      setError('没有等待处理的图片');
      return;
    }

    setProcessing(true);
    setError('');

    // 顺序处理每张图片
    for (const image of pendingImages) {
      await processImage(image);
    }

    setProcessing(false);
    setCurrentProcessing(null);
  };

  // 截图下载单个结果
  const handleDownloadSingleHTML = useCallback(async (imageId) => {
    const ref = markdownRefs.current[imageId];
    if (!ref) return;

    try {
      const canvas = await html2canvas(ref, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const result = results[imageId];
          a.download = `${result?.filename || 'screenshot'}-${Date.now()}.png`;
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
  }, [results]);

  // 下载单个 Markdown
  const handleDownloadSingle = (imageId) => {
    const result = results[imageId];
    if (!result || !result.markdown) return;

    const blob = new Blob([result.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 自动下载同名 MD 文件
  const autoDownloadSingleMarkdown = (markdown, fileName) => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 下载全部 Markdown
  const handleDownloadAll = () => {
    const resultsArray = Object.values(results);
    if (resultsArray.length === 0) return;

    let combinedMarkdown = `# 批量 OCR 结果\n\n`;
    combinedMarkdown += `生成时间: ${new Date().toLocaleString()}\n\n`;
    combinedMarkdown += `---\n\n`;

    resultsArray.forEach((result) => {
      if (result.success) {
        combinedMarkdown += `## ${result.filename}\n\n`;
        combinedMarkdown += `${result.markdown}\n\n`;
        combinedMarkdown += `---\n\n`;
      }
    });

    const blob = new Blob([combinedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-ocr-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResults({});
    setError('');
    // 重置计数器，确保下次处理时自动滚动能正常工作
    previousResultsLength.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 计算统计
  const resultsArray = Object.values(results);
  const successCount = resultsArray.filter(r => r.success).length;
  const errorCount = resultsArray.filter(r => !r.success).length;
  const completedCount = successCount + errorCount;
  const pendingCount = images.filter(img => img.status === 'pending').length;

  return (
    <div className="batch-ocr">
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
          multiple
          directory=""
          webkitdirectory=""
          onChange={handleFileSelect}
          className="file-input"
          id="batch-image-upload"
          disabled={processing}
        />
        <motion.label
          htmlFor="batch-image-upload"
          className="upload-label"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="upload-icon"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
          >
            📚
          </motion.div>
          <div className="upload-text">选择图片或整个目录</div>
          <div className="upload-hint">支持选择多个文件或整个文件夹，无数量限制</div>
        </motion.label>

        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              className="batch-actions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.div
                className="batch-info"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
              >
                已选择 <span className="count-badge">{images.length}</span> 张图片
                {completedCount > 0 && (
                  <span className="progress-text">
                    ({successCount} 成功 / {errorCount} 失败 / {pendingCount} 等待中)
                  </span>
                )}
              </motion.div>

              {!processing ? (
                <div className="batch-buttons">
                  <motion.button
                    className="action-btn memphis-btn secondary"
                    onClick={handleReset}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    清空
                  </motion.button>
                  <motion.button
                    className="action-btn memphis-btn"
                    onClick={handleProcessAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    开始处理
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  className="processing-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <motion.div
                    className="spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙️
                  </motion.div>
                  <span>
                    处理中... ({completedCount}/{images.length})
                    {currentProcessing && ' - 当前处理中'}
                  </span>
                </motion.div>
              )}
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

      {/* Images Grid with Status */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            ref={imagesGridRef}
            className="images-grid-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="images-grid">
              {images.map((image, index) => {
                const result = results[image.id];
                return (
                  <motion.div
                    key={image.id}
                    className={`image-item ${currentProcessing === image.id ? 'processing' : ''} ${result ? 'has-result' : ''}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20
                    }}
                    whileHover={{ y: -5, rotate: 2 }}
                  >
                    <div className="image-preview">
                      <img src={image.preview} alt={image.file.name} />
                      <motion.button
                        className="remove-btn"
                        onClick={() => handleRemoveImage(image.id)}
                        disabled={processing}
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        whileTap={{ scale: 0.8 }}
                      >
                        ✕
                      </motion.button>
                      <div className={`status-badge ${image.status}`}>
                        {image.status === 'processing' && '⏳ 处理中'}
                        {image.status === 'success' && '✓ 完成'}
                        {image.status === 'error' && '✗ 失败'}
                        {image.status === 'pending' && '等待中'}
                      </div>
                      {/* 快速操作按钮 */}
                      {result && result.success && (
                        <div className="quick-actions">
                          <motion.button
                            className="quick-action-btn"
                            onClick={() => handleDownloadSingle(image.id)}
                            title="下载 Markdown"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            📄
                          </motion.button>
                          <motion.button
                            className="quick-action-btn"
                            onClick={() => handleDownloadSingleHTML(image.id)}
                            title="下载截图"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            🖼️
                          </motion.button>
                        </div>
                      )}
                    </div>
                    <div className="image-name">{image.file.name}</div>
                    {/* 在卡片下方显示预览 */}
                    {result && result.success && (
                      <motion.div
                        className="card-preview"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className="card-preview-content"
                          ref={(el) => (markdownRefs.current[image.id] = el)}
                        >
                          <MarkdownRenderer content={result.markdown} />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Live Preview Results */}
            <div className="results-list">
              {images.map((image) => {
                const result = results[image.id];
                if (!result) return null;

                return (
                  <motion.div
                    key={image.id}
                    ref={(el) => (resultItemRefs.current[image.id] = el)}
                    className={`result-item ${result.success ? 'success' : 'error'}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="result-header">
                      <div className="result-filename">
                        <span className={`status-icon ${result.success ? 'success' : 'error'}`}>
                          {result.success ? '✓' : '✗'}
                        </span>
                        {result.filename}
                      </div>
                      <div className="result-actions">
                        {result.success && (
                          <>
                            <motion.button
                              className="download-btn memphis-btn secondary"
                              onClick={() => handleDownloadSingle(image.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              📄 MD
                            </motion.button>
                            <motion.button
                              className="download-btn memphis-btn accent"
                              onClick={() => handleDownloadSingleHTML(image.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              🖼️ 截图
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                    {result.success ? (
                      <div className="result-content">
                        <div
                          ref={(el) => (markdownRefs.current[image.id] = el)}
                          className="markdown-capture-area"
                        >
                          <MarkdownRenderer content={result.markdown} />
                        </div>
                      </div>
                    ) : (
                      <div className="result-error">
                        错误: {result.error}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download All Button */}
      <AnimatePresence>
        {successCount > 0 && (
          <motion.button
            className="download-all-btn memphis-btn"
            onClick={handleDownloadAll}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💾 下载全部 Markdown ({successCount} 个文件)
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BatchImageOCR;
