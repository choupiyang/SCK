import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './MarkdownRenderer.css';

/**
 * 全面清理 Markdown 内容中的 HTML 标签和格式问题
 * @param {string} markdown - 原始 Markdown 内容
 * @returns {string} - 清理后的 Markdown 内容
 */
function sanitizeMarkdown(markdown) {
  if (!markdown) return '';

  let cleaned = markdown;

  // 1. 移除 HTML 注释 <!-- XXXX -->
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 2. 处理各种换行标签
  // <BR>, <br>, <BR/>, <br/> 等变体转为换行符
  cleaned = cleaned.replace(/<\s*br\s*\/?>/gi, '\n');

  // 3. 移除其他常见的块级 HTML 标签(保留内容)
  cleaned = cleaned.replace(/<\s*(div|p|span)[^>]*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '$2');

  // 4. 移除自闭合的块级标签
  cleaned = cleaned.replace(/<\s*(div|p|span|hr)\s*\/?>/gi, '');

  // 5. 清理连续的空行(最多保留2个)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. 移除行首行尾的空白
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  return cleaned;
}

function MarkdownRenderer({ content, styleMode = 'magazine' }) {
  if (!content) return null;

  // 预处理 Markdown 内容
  const cleanedContent = sanitizeMarkdown(content);

  return (
    <div className={styleMode === 'magazine' ? 'markdown-magazine' : 'markdown-simple'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={getComponents(styleMode)}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}

// 根据样式模式返回不同的组件配置
function getComponents(mode) {
  const baseComponents = {
    // 标题
    h1: ({ children }) => (
      <h1 className={mode === 'magazine' ? 'magazine-h1' : 'simple-h1'}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={mode === 'magazine' ? 'magazine-h2' : 'simple-h2'}>
        {mode === 'magazine' && <span className="title-decoration">▸</span>}
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={mode === 'magazine' ? 'magazine-h3' : 'simple-h3'}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className={mode === 'magazine' ? 'magazine-h4' : 'simple-h4'}>{children}</h4>
    ),

    // 段落
    p: ({ children }) => {
      const text = String(children);
      // 仅在杂志模式下，对英文段落且首字母为 A-Z 的情况应用首字母大写效果
      const shouldApplyDropCap = mode === 'magazine' &&
                                    text.length > 0 &&
                                    /^[A-Za-z]/.test(text[0]);

      if (shouldApplyDropCap) {
        const firstChar = text[0];
        const restText = text.slice(1);
        return (
          <p className={mode === 'magazine' ? 'magazine-p' : 'simple-p'}>
            <span className="drop-cap">{firstChar}</span>
            {restText}
          </p>
        );
      }

      return <p className={mode === 'magazine' ? 'magazine-p' : 'simple-p'}>{children}</p>;
    },

    // 链接
    a: ({ href, children }) => (
      <a href={href} className={mode === 'magazine' ? 'magazine-link' : 'simple-link'} target="_blank" rel="noopener noreferrer">
        {children}
        {mode === 'magazine' && <span className="link-arrow">→</span>}
      </a>
    ),

    // 列表
    ul: ({ children }) => (
      <ul className={mode === 'magazine' ? 'magazine-ul' : 'simple-ul'}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={mode === 'magazine' ? 'magazine-ol' : 'simple-ol'}>{children}</ol>
    ),
    li: ({ children }) => (
      <li className={mode === 'magazine' ? 'magazine-li' : 'simple-li'}>{children}</li>
    ),

    // 代码块
    code: ({ inline, className, children }) => {
      if (inline) {
        return <code className={mode === 'magazine' ? 'magazine-inline-code' : 'simple-inline-code'}>{children}</code>;
      }
      const language = className?.replace(/language-/, '') || 'text';
      return (
        <div className={mode === 'magazine' ? 'magazine-code-block' : 'simple-code-block'}>
          {mode === 'magazine' && (
            <div className="code-header">
              <span className="code-language">{language}</span>
              <span className="code-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            className="code-content"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },

    // 引用块
    blockquote: ({ children }) => (
      <blockquote className={mode === 'magazine' ? 'magazine-blockquote' : 'simple-blockquote'}>
        {mode === 'magazine' && <div className="quote-icon">❝</div>}
        {children}
      </blockquote>
    ),

    // 表格
    table: ({ children }) => (
      <div className={mode === 'magazine' ? 'magazine-table-wrapper' : 'simple-table-wrapper'}>
        <table className={mode === 'magazine' ? 'magazine-table' : 'simple-table'}>{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={mode === 'magazine' ? 'magazine-thead' : 'simple-thead'}>{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className={mode === 'magazine' ? 'magazine-tbody' : 'simple-tbody'}>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className={mode === 'magazine' ? 'magazine-tr' : 'simple-tr'}>{children}</tr>
    ),
    th: ({ children }) => (
      <th className={mode === 'magazine' ? 'magazine-th' : 'simple-th'}>{children}</th>
    ),
    td: ({ children }) => (
      <td className={mode === 'magazine' ? 'magazine-td' : 'simple-td'}>{children}</td>
    ),

    // 分隔线
    hr: () => (
      <hr className={mode === 'magazine' ? 'magazine-hr' : 'simple-hr'} />
    ),

    // 图片
    img: ({ src, alt }) => (
      <div className={mode === 'magazine' ? 'magazine-image-wrapper' : 'simple-image-wrapper'}>
        <img src={src} alt={alt} className={mode === 'magazine' ? 'magazine-image' : 'simple-image'} />
        {alt && <div className={mode === 'magazine' ? 'image-caption' : 'image-caption-simple'}>{alt}</div>}
      </div>
    ),

    // 强调
    strong: ({ children }) => (
      <strong className={mode === 'magazine' ? 'magazine-strong' : 'simple-strong'}>{children}</strong>
    ),
    em: ({ children }) => (
      <em className={mode === 'magazine' ? 'magazine-em' : 'simple-em'}>{children}</em>
    ),
  };

  return baseComponents;
}

export default MarkdownRenderer;
