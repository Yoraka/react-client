import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DotPatternDemo } from './components/DotPatternDemo';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import AIChat from './components/AIChat';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import CodeBlock from './components/CodeBlock'; // 确保路径正确

function App() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatContainerRef = useRef(null);
  const autoScrollTimeoutRef = useRef(null);

  const setError = (title, description, details) => {
    setConnectionError({ title, description, details });
    setIsConnected(false);
  };

  const setInfo = (title, description, details) => {
    setConnectionError({ title, description, details, type: 'info' });
  };

  const connectToServer = useCallback(() => {
    setConnectionError(null);
    AIChat.connect()
      .then(() => {
        setIsConnected(true);
        setConnectionError(null);
      })
      .catch(error => {
        console.error('连接失败:', error);
        setError('无法连接到服务器', '请检查网络连接或稍后重试。', error.message);
      });
  }, []);

  useEffect(() => {
    connectToServer();
    return () => AIChat.disconnect();
  }, [connectToServer]);

  const handleSend = async () => {
    if (!isConnected) {
      console.error('未连接到服务器，无法发送消息');
      setError('未连接到服务器', '请重新连接后再试。', '当前状态：未连接');
      return;
    }

    if (input.trim()) {
      const userMessage = { type: 'user', content: input.trim() };
      const aiMessage = { type: 'ai', content: '' };
      setChatHistory(prev => [...prev, userMessage, aiMessage]);
      setInput('');
      setIsGenerating(true);

      try {
        await AIChat.sendMessage(
          input.trim(),
          (partialContent) => {
            setChatHistory(prev => {
              const newHistory = [...prev];
              const lastMessage = newHistory[newHistory.length - 1];
              if (lastMessage.type === 'ai') {
                // 替换最后一条 AI 消息的内容，而不是追加
                lastMessage.content = partialContent;
              }
              return newHistory;
            });
          },
          (fullContent) => {
            console.log('完整的 AI 响应:', fullContent);
            setChatHistory(prev => {
              const newHistory = [...prev];
              const lastMessage = newHistory[newHistory.length - 1];
              if (lastMessage.type === 'ai') {
                // 确保最后一条消息包含完整的响应
                lastMessage.content = fullContent;
              }
              return newHistory;
            });
            setIsGenerating(false);
          }
        );
      } catch (error) {
        console.error('发送消息失败:', error);
        setError('发送消息失败', '请重试。', error.message);
        setIsGenerating(false);
      }
    }
  };

  const handleStopGeneration = async () => {
    try {
      await AIChat.stopGeneration();
      setIsGenerating(false);
    } catch (error) {
      console.error('停止生成失败:', error);
      setError('停止生成失败', '请重试。', error.message);
    }
  };

  const handleClearConversation = async () => {
    try {
      await AIChat.clearConversation();
      setChatHistory([]);
    } catch (error) {
      console.error('清空对话失败:', error);
      setError('清空对话失败', '请重试。', error.message);
    }
  };

  const handleConfirmFrontend = () => {
    setInfo('前端状态', '确认正常', '前端功能正常运行');
  };

  const handlePing = async () => {
    try {
      const response = await fetch('/api/ping');
      const result = await response.text();
      setInfo('Ping 结果', '成功', result);
    } catch (error) {
      console.error('Ping 失败:', error);
      setError('Ping 失败', '无法完成 ping 操作', error.message);
    }
  };

  const renderMessage = (message) => {
    if (typeof message !== 'string') {
      console.error('Invalid message type:', message);
      return <span>Error: Invalid message format</span>;
    }
    return (
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // 使用 extractTextContent 函数处理每个 child
            const value = extractTextContent(children);
            
            return !inline && language ? (
              <CodeBlock language={language} value={value} />
            ) : (
              <code className={className} {...props}>
                {value}
              </code>
            );
          },
          // 自定义有序列表渲染
          ol: ({node, ...props}) => {
            return <ol className="list-decimal list-inside" {...props} />;
          },
          // 自定义列表项渲染
          li: ({node, ...props}) => {
            return <li className="mb-2" {...props} />;
          }
        }}
        remarkPlugins={[
          () => (tree) => {
            const inlineMathRegex = /\$([^\$]+)\$/g;
            const blockMathRegex = /\$\$([^\$]+)\$\$/g;
            
            function visit(node) {
              if (node.type === 'text') {
                const inlineMatches = node.value.match(inlineMathRegex);
                const blockMatches = node.value.match(blockMathRegex);
                
                if (inlineMatches) {
                  const parts = node.value.split(inlineMathRegex);
                  const newChildren = [];
                  parts.forEach((part, index) => {
                    if (index % 2 === 0) {
                      if (part) newChildren.push({ type: 'text', value: part });
                    } else {
                      newChildren.push({ type: 'inlineMath', value: part });
                    }
                  });
                  node.type = 'paragraph';
                  node.children = newChildren;
                } else if (blockMatches) {
                  const parts = node.value.split(blockMathRegex);
                  const newChildren = [];
                  parts.forEach((part, index) => {
                    if (index % 2 === 0) {
                      if (part) newChildren.push({ type: 'text', value: part });
                    } else {
                      newChildren.push({ type: 'math', value: part });
                    }
                  });
                  node.type = 'paragraph';
                  node.children = newChildren;
                }
              }
              
              if (node.children) {
                node.children.forEach(visit);
              }
            }
            
            visit(tree);
          }
        ]}
      >
        {message}
      </ReactMarkdown>
    );
  };

  const extractTextContent = (child) => {
    if (typeof child === 'string') {
      return child;
    } else if (typeof child === 'number' || typeof child === 'boolean') {
      return String(child);
    } else if (React.isValidElement(child)) {
      if (typeof child.props.children === 'string') {
        return child.props.children;
      } else if (Array.isArray(child.props.children)) {
        return child.props.children.map(extractTextContent).join('');
      }
    } else if (Array.isArray(child)) {
      return child.map(extractTextContent).join('');
    } else if (child && typeof child === 'object') {
      return JSON.stringify(child);
    }
    return '';
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (chatHistory.length > 0 && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
      
      if (isScrolledToBottom || isAutoScrolling) {
        scrollToBottom();
        setIsAutoScrolling(true);
        
        // 清除之前的超时
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
        
        // 设置新的超时
        autoScrollTimeoutRef.current = setTimeout(() => {
          setIsAutoScrolling(false);
        }, 1000);
      }
    }
  }, [chatHistory]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
      
      if (!isScrolledToBottom) {
        setIsAutoScrolling(false);
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-screen">
      <DotPatternDemo />
      <div className="absolute inset-y-10 left-10 right-10 flex">
        {/* 左侧的新 Box */}
        <div className="bg-white rounded-lg shadow-xl mr-3 w-[120px] min-w-[24px] flex-shrink-0 flex flex-col">
          {/* 连接状态按钮 */}
          <div className="p-2 flex justify-center">
            <Button 
              onClick={connectToServer} 
              className={`w-full shadow-md ${isConnected && !connectionError ? 'bg-green-500 hover:bg-green-500 cursor-default' : ''}`}
              disabled={isConnected && !connectionError}
            >
              {isConnected && !connectionError ? '已连接' : '重新连接'}
            </Button>
          </div>
          
          {/* 清空对话按钮 */}
          <div className="p-2 flex justify-center">
            <Button 
              onClick={handleClearConversation} 
              className="w-full shadow-md"
              disabled={!isConnected}
            >
              清空对话
            </Button>
          </div>
          
          {/* 确认前端正常按钮 */}
          <div className="p-2 flex justify-center">
            <Button 
              onClick={handleConfirmFrontend} 
              className="w-full shadow-md"
            >
              确认前端
            </Button>
          </div>
          
          {/* Ping 按钮 */}
          <div className="p-2 flex justify-center">
            <Button 
              onClick={handlePing} 
              className="w-full shadow-md"
            >
              Ping
            </Button>
          </div>
          
          <div className="p-4 flex-grow">
            <h3 className="text-lg font-semibold mb-2">侧边栏</h3>
            <p className="text-sm text-gray-600">这里可以放置一些额外的信息或控件。</p>
          </div>
        </div>

        {/* 右侧的两个 Box */}
        <div className="flex-grow flex flex-col">
          {/* 上方的 box */}
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="bg-white rounded-lg shadow-xl p-8 mb-3 flex-grow overflow-auto relative flex flex-col"
          >
            {/* 聊天历史 */}
            <div className="flex-grow">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`mb-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg shadow-md ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {renderMessage(msg.content)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* 连接状态提示 */}
            {connectionError && (
              <Alert variant={connectionError.type === 'info' ? 'default' : 'destructive'} className="mt-4 shadow-md">
                <AlertTitle>{connectionError.title}</AlertTitle>
                <AlertDescription>
                  {connectionError.description}
                  {connectionError.details && (
                    <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
                      <strong>详细信息：</strong> {connectionError.details}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* 下方的 box */}
          <div className="bg-white rounded-lg shadow-xl min-h-[120px] flex items-stretch p-2">
            <div className="flex-grow pr-3">
              <Textarea 
                className="w-full h-full resize-none shadow-inner"
                placeholder="在这里输入文本..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isGenerating}
              />
            </div>
            <div className="flex items-center">
              {isGenerating ? (
                <Button onClick={handleStopGeneration} disabled={!isConnected} className="shadow-md">
                  停止生成
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!isConnected} className="shadow-md">
                  发送
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
