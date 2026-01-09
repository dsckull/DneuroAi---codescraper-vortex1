import React, { useState } from 'react';
import { MessageSquare, X, Send, AlertCircle, CheckCircle2, Bug, Lightbulb, HelpCircle, Loader2 } from 'lucide-react';
import { FeedbackContextData } from '../types';

interface FeedbackWidgetProps {
  contextData: FeedbackContextData;
  trigger?: React.ReactNode; 
}

// Helper para codificar dados para x-www-form-urlencoded (Padrão Netlify)
const encode = (data: any) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
};

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ contextData, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [userContact, setUserContact] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'question'>('question');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateTechnicalReport = () => {
    const timestamp = new Date().toLocaleString();
    let report = `--- RELATÓRIO TÉCNICO AUTOMÁTICO ---\n`;
    report += `DATA: ${timestamp}\n`;
    report += `SEÇÃO: ${contextData.currentSection}\n`;
    report += `TOKENS SESSÃO: ${contextData.sessionUsage.totalTokens}\n`;
    report += `ARQUIVO: ${contextData.fileInfo || 'Nenhum'}\n`;
    
    report += `\n[LOGS RECENTES]\n`;
    if (contextData.logs && contextData.logs.length > 0) {
        contextData.logs.slice(-15).forEach(log => report += `${log}\n`);
    } else {
        report += `(Sem logs de agente)\n`;
    }

    report += `\n[CHAT SNIPPET]\n`;
    contextData.messages.slice(-3).forEach(m => {
        report += `[${m.role.toUpperCase()}]: ${m.content.substring(0, 150)}...\n`;
    });

    return report;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSending(true);
    setErrorMsg('');

    const technicalReport = generateTechnicalReport();

    try {
        await fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({
                "form-name": "feedback", // Deve bater com o 'name' no index.html
                "type": type,
                "contact": userContact,
                "message": message,
                "technical_report": technicalReport
            }),
        });

        setSentSuccess(true);
        setTimeout(() => {
            setSentSuccess(false);
            setIsOpen(false);
            setMessage('');
            setUserContact('');
        }, 3000);

    } catch (error) {
        console.error("Erro ao enviar feedback:", error);
        setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger || (
            <button className="p-2 text-[#c4c7c5] hover:text-[#a8c7fa] hover:bg-[#303030] rounded-full transition-colors" title="Reportar Problema">
                <Bug size={18} />
            </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in cursor-default">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

            <div className="bg-[#1e1f20] border border-[#444746] w-full max-w-sm rounded-[24px] shadow-2xl relative z-[101] flex flex-col overflow-hidden animate-slide-up">
                
                <div className="px-5 py-4 border-b border-[#444746] bg-[#131314] flex justify-between items-center">
                    <h3 className="font-bold text-[#e3e3e3] flex items-center gap-2 text-sm">
                        <MessageSquare size={16} className="text-[#a8c7fa]"/>
                        Fale Conosco
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-[#c4c7c5] hover:text-white p-1 rounded-full hover:bg-[#303030]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSend} className="p-5 space-y-4">
                    {!sentSuccess ? (
                        <>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setType('bug')}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${type === 'bug' ? 'bg-[#3a0b0b] border-red-500 text-red-200' : 'bg-[#131314] border-[#444746] text-[#8e918f] hover:bg-[#303030]'}`}
                                >
                                    <Bug size={16}/> Bug
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setType('feature')}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${type === 'feature' ? 'bg-[#0f2816] border-[#6dd58c] text-[#6dd58c]' : 'bg-[#131314] border-[#444746] text-[#8e918f] hover:bg-[#303030]'}`}
                                >
                                    <Lightbulb size={16}/> Ideia
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setType('question')}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${type === 'question' ? 'bg-[#004a77] border-[#a8c7fa] text-[#c2e7ff]' : 'bg-[#131314] border-[#444746] text-[#8e918f] hover:bg-[#303030]'}`}
                                >
                                    <HelpCircle size={16}/> Ajuda
                                </button>
                            </div>

                            <div>
                                <input
                                    type="email"
                                    name="contact"
                                    value={userContact}
                                    onChange={(e) => setUserContact(e.target.value)}
                                    placeholder="Seu e-mail (opcional)"
                                    className="w-full bg-[#131314] border border-[#444746] rounded-xl p-3 text-sm text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] placeholder-[#444746] mb-3"
                                />
                                <textarea
                                    name="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Como podemos ajudar?"
                                    required
                                    className="w-full h-24 bg-[#131314] border border-[#444746] rounded-xl p-3 text-sm text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] resize-none placeholder-[#444746]"
                                />
                            </div>

                            <div className="bg-[#131314] p-3 rounded-xl border border-[#444746] flex items-start gap-2">
                                <AlertCircle size={16} className="text-[#a8c7fa] shrink-0 mt-0.5" />
                                <p className="text-[10px] text-[#c4c7c5] leading-tight">
                                    Enviaremos automaticamente um log técnico anonimizado para agilizar a análise.
                                </p>
                            </div>

                            {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}

                            <button
                                type="submit"
                                disabled={!message.trim() || isSending}
                                className="w-full py-3 bg-[#a8c7fa] hover:bg-[#8ab4f8] text-[#001d35] font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Send size={16} /> Enviar Mensagem
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-[#0f2816] rounded-full flex items-center justify-center mb-4 border border-[#6dd58c]">
                                <CheckCircle2 size={32} className="text-[#6dd58c]" />
                            </div>
                            <h4 className="text-lg font-bold text-[#e3e3e3] mb-2">Mensagem Recebida!</h4>
                            <p className="text-sm text-[#c4c7c5]">
                                Nossa equipe analisará e responderá em breve.
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
      )}
    </>
  );
};