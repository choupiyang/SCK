import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SingleImageOCR from './components/SingleImageOCR';
import BatchImageOCR from './components/BatchImageOCR';
import './App.css';

function App() {
  const [mode, setMode] = useState('single'); // 'single' or 'batch'

  return (
    <div className="app">
      {/* 背景几何装饰 */}
      <div className="background-decorations">
        <motion.div
          className="geo-decoration geo-circle"
          style={{ top: '10%', left: '5%' }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="geo-decoration geo-square"
          style={{ top: '20%', right: '10%' }}
          animate={{
            y: [0, 20, 0],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="geo-decoration geo-triangle"
          style={{ bottom: '15%', left: '8%' }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="geo-decoration geo-circle"
          style={{ bottom: '25%', right: '5%' }}
          animate={{
            y: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        <div className="header-content">
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <span className="title-main">图片转</span>
            <span className="title-accent"> Markdown </span>
            <span className="title-main">OCR</span>
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            DeepSeek OCR 驱动的智能识别工具
          </motion.p>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="app-main">
        {/* Mode Selector */}
        <motion.div
          className="mode-selector"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.button
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">📷</span>
            <span className="btn-text">单张图片</span>
          </motion.button>
          <motion.button
            className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => setMode('batch')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">📚</span>
            <span className="btn-text">批量处理</span>
          </motion.button>
        </motion.div>

        {/* Content with 3D Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="content-wrapper"
            initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -90, scale: 0.8 }}
            transition={{
              duration: 0.8,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            style={{
              perspective: 2000,
              transformStyle: 'preserve-3d',
            }}
          >
            {mode === 'single' ? <SingleImageOCR /> : <BatchImageOCR />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        className="app-footer"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="footer-content">
          <div className="footer-text">
            <span className="footer-icon">⚡</span>
            Powered by 硅基流动 DeepSeek OCR API
          </div>
          <div className="footer-decoration">
            <span className="deco-dot"></span>
            <span className="deco-line"></span>
            <span className="deco-dot"></span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;
