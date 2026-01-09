import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { Send, Sparkles, MessageSquareQuote, Trash2, StopCircle } from 'lucide-react';
import { queryGeneralChat } from '../services/geminiService';

export const GeneralChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Olá. Estou pronto para ajudar com qualquer tarefa geral fora do escopo de auditoria. O que você precisa?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [showSystemPrompt, setShowSystemPrompt] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await queryGeneralChat(userMsg.content, messages, systemPrompt);
            const botMsg: Message = { role: 'model', content: response, timestamp: Date.now() };
            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "Erro de conexão.", timestamp: Date.now() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClear = () => {
        setMessages([{ role: 'model', content: 'Chat limpo.', timestamp: Date.now() }]);
    };

    return (
        <div className="flex flex-col h-full bg-[#131314] relative">
            {/* Header / Config Bar */}
            <div className="p-4 border-b border-[#444746] bg-[#1e1f20] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-[#a8c7fa]" size={18} />
                    <h2 className="font-bold text-[#e3e3e3]">General AI Assistant</h2>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                        className={`p-2 rounded-full transition-colors ${showSystemPrompt ? 'bg-[#a8c7fa] text-[#001d35]' : 'bg-[#303030] text-[#c4c7c5]'}`}
                        title="Configurar Tom/Framework"
                     >
                        <MessageSquareQuote size={18} />
                     </button>
                     <button 
                        onClick={handleClear}
                        className="p-2 rounded-full bg-[#303030] text-[#c4c7c5] hover:bg-red-900/30 hover:text-red-400 transition-colors"
                        title="Limpar Chat"
                     >
                        <Trash2 size={18} />
                     </button>
                </div>
            </div>

            {/* System Prompt Config Area */}
            {showSystemPrompt && (
                <div className="p-4 bg-[#1e1f20] border-b border-[#444746] animate-fade-in">
                    <label className="text-xs font-bold text-[#8e918f] uppercase mb-2 block">System Prompt / Framework Persona</label>
                    <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Ex: Você é um especialista em Python sênior. Responda sempre com exemplos de código..."
                        className="w-full h-20 bg-[#131314] border border-[#444746] rounded-xl p-3 text-sm text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] resize-none"
                    />
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-4">
                {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} />
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                         <div className="bg-[#1e1f20] px-4 py-3 rounded-2xl rounded-tl-none border border-[#444746] text-[#c4c7c5] text-sm flex gap-2 items-center">
                            <span className="w-2 h-2 bg-[#a8c7fa] rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-[#a8c7fa] rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-[#a8c7fa] rounded-full animate-bounce delay-150"></span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#1e1f20] border-t border-[#444746]">
                <div className="max-w-4xl mx-auto relative">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem..."
                        className="w-full bg-[#131314] border border-[#444746] rounded-full py-3.5 pl-5 pr-12 text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] transition-colors"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-2 p-1.5 bg-[#a8c7fa] text-[#001d35] rounded-full hover:bg-[#8ab4f8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};