"use client";
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/ai/chat',
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (messageText?: string) => {
    if (messageText) {
      // For predefined prompts, we need to append the message and send it
      // The useChat hook handles this automatically when we call append with the message
      const event = new Event('submit', { cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
      handleInputChange({ target: { value: messageText } } as React.ChangeEvent<HTMLInputElement>);
      setTimeout(() => handleSubmit(event), 0);
    } else {
      handleSubmit();
    }
  };

  const prompts = [
    "Explain the privacy policy",
    "What are the terms of service?",
    "How does data handling comply with GDPR?",
    "What are the user agreement clauses?"
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
      <div ref={chatContainerRef} className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
            </div>
          </div>
        ))}
        {status === 'streaming' && <div className="text-center text-gray-500">LegalPal is typing...</div>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask a legal question..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={status === 'streaming'}
        />
        <button
          onClick={() => sendMessage()}
          disabled={status === 'streaming' || !input.trim()}
          className="px-6 py-2 bg-gray-800 text-white rounded-2xl hover:bg-gray-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Predefined Prompts */}
      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3 font-inter">Quick questions:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt)}
              disabled={status === 'streaming'}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 text-sm font-inter transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;