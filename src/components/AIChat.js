const MAX_MESSAGE_SIZE = 65536;
const TIMEOUT_SECONDS = 30;

let socket = null;
let isConnected = false;
let currentMessageController = null;

// 直接指定服务器地址
const SERVER_ADDRESS = 'wss://gpt.bluedotmars.xyz';

const AIChat = {
  connect: () => {
    return new Promise((resolve, reject) => {
      socket = new WebSocket(SERVER_ADDRESS);

      socket.onopen = () => {
        console.log('WebSocket 连接已建立');
        isConnected = true;
        resolve();
      };

      socket.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        isConnected = false;
        reject(error);
      };

      socket.onclose = () => {
        console.log('WebSocket 连接已关闭');
        isConnected = false;
      };
    });
  },

  disconnect: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    isConnected = false;
    console.log('已断开与服务器的连接');
  },

  sendMessage: (message, onUpdate, onComplete) => {
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        reject(new Error('未连接到服务器'));
        return;
      }

      if (message.trim()) {
        console.log('发送消息到服务器:', message);
        socket.send(message);

        let fullResponse = '';
        currentMessageController = new AbortController();
        const signal = currentMessageController.signal;

        socket.onmessage = (event) => {
          if (signal.aborted) {
            return;
          }

          const data = event.data;
          console.log('收到服务器响应片段:', data);

          // 检查是否是结束信号
          if (data.includes('"finish_reason":"stop"')) {
            onComplete(fullResponse);
            resolve(fullResponse);
            currentMessageController = null;
            return;
          }

          // 将接收到的文本添加到响应中，替换 [object Object]
          const cleanedData = data.replace(/\[object Object\]/g, '');
          fullResponse += cleanedData;
          onUpdate(fullResponse);
        };

        signal.addEventListener('abort', () => {
          console.log('消息生成被中断');
          onComplete(fullResponse);
          resolve(fullResponse);
        });

      } else {
        reject(new Error('消息为空'));
      }
    });
  },

  stopGeneration: () => {
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        reject(new Error('未连接到服务器'));
        return;
      }

      console.log('发送停止生成信号');
      socket.send(JSON.stringify({ type: 'stop_generation' }));
      
      if (currentMessageController) {
        currentMessageController.abort();
        currentMessageController = null;
      }

      resolve();
    });
  },

  clearConversation: () => {
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        reject(new Error('未连接到服务器'));
        return;
      }

      console.log('发送清空对话信号');
      socket.send(JSON.stringify({ type: 'clear_conversation' }));
      resolve();
    });
  }
};

export default AIChat;