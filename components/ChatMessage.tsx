import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Sparkles } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <div className={`flex w-full mb-2 ${isUser ? 'justify-end' : 'justify-start'} group/message`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Author Label (Optional, for bot mostly) */}
        {!isUser && (
            <div className="flex items-center gap-2 mb-1 ml-4 opacity-80">
                <Sparkles size={12} className="text-[#a8c7fa]" />
                <span className="text-xs font-bold text-[#c4c7c5]">Analyst AI</span>
            </div>
        )}

        {/* Bubble */}
        <div className={`relative px-5 py-3.5 rounded-[24px] text-sm md:text-base leading-relaxed group/bubble transition-all shadow-sm ${
          isUser 
            ? 'bg-[#303030] text-[#e3e3e3] rounded-br-sm' 
            : 'bg-transparent text-[#e3e3e3] pl-0 md:pl-4' // Bot message blends into background more
        }`}>
          
          {/* Copy Button (Floating Top Right - Visible on Hover) */}
          <button 
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover/bubble:opacity-100 z-10 ${
                isUser 
                ? 'bg-[#444746] text-[#e3e3e3] hover:bg-[#5e5e5e]' 
                : 'bg-[#303030] text-[#c4c7c5] hover:text-white hover:bg-[#444746]'
            }`}
            title="Copiar texto"
          >
            {isCopied ? <Check size={12} className="text-[#6dd58c]" /> : <Copy size={12} />}
          </button>

          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:bg-[#1e1f20] prose-pre:border prose-pre:border-[#444746] prose-pre:rounded-xl">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        wrapLines={true}
                        wrapLongLines={true}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} bg-[#303030] text-[#e3e3e3] px-1.5 py-0.5 rounded text-xs md:text-sm font-mono break-all whitespace-pre-wrap border border-[#444746]`} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};