// ./components/CodeBlock.jsx
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((err) => {
      console.error('复制失败:', err);
    });
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden my-4">
      <div className="flex justify-between items-center px-3 py-1 bg-gray-800 text-gray-200 text-xs">
        <span className="font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors duration-200"
        >
          {isCopied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '0.75rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
