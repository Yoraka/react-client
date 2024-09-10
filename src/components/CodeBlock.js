import React, { useState } from 'react';

const CodeBlock = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    // 直接使用 value，不需要额外的处理
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // 不再需要将 value 转换为字符串，因为它应该已经是字符串了
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-700">
        <span className="text-sm text-gray-300">{language}</span>
        <button 
          onClick={handleCopy} 
          className="text-sm text-gray-300 hover:text-white transition-colors"
        >
          {isCopied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-gray-300 font-mono`}>
          {value}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;