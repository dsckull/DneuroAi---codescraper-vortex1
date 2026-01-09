import React, { useState, useRef, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { ChatMessage } from './components/ChatMessage';
import { CodePreview } from './components/CodePreview';
import { SettingsModal } from './components/SettingsModal';
import { PayloadGeneratorModal } from './components/PayloadGeneratorModal';
import { BrowserInspector } from './components/BrowserInspector';
import { AutonomousAgent } from './components/AutonomousAgent';
import { PythonSandbox } from './components/PythonSandbox';
import { DocumentationHub } from './components/DocumentationHub';
import { BootSequence } from './components/BootSequence';
import { FeedbackWidget } from './components/FeedbackWidget';
import { UploadedFile, Message, AnalysisStatus, AppSettings, ViewMode, LLMProvider, TokenUsage } from './types';
import { analyzeContent } from './services/geminiService';
import { Send, Terminal, Loader2, PanelLeftClose, PanelLeftOpen, MessageSquare, ShieldAlert, Zap, Search, Settings as SettingsIcon, Skull, Swords, Code, MonitorPlay, Bot, Box, ArrowDown, RotateCcw, SplitSquareHorizontal, XCircle, BookOpen, Plus, ChevronRight, Sparkles, Database, ToggleLeft, ToggleRight, MessageCircle, Power, ArrowLeft, HelpCircle, Mail, Bug } from 'lucide-react';

const STORAGE_KEYS = {
  FILE: 'codeScraper_file',
  MESSAGES: 'codeScraper_messages',
  SETTINGS: 'codeScraper_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'google',
  model: 'gemini-3-flash-preview',
  apiKeys: {
      google: '',
      openai: '',
      anthropic: '',
      groq: '',
      ollama: ''
  },
  baseUrl: '',
  temperature: 0.5,
  maxOutputTokens: 8192,
  thinkingBudget: 0,
  safetyLevel: 'BLOCK_MEDIUM_AND_ABOVE',
  historyDepth: 5 // Default history depth
};

export const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true); // Inicializa com Boot
  const [file, setFile] = useState<UploadedFile | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Sistema inicializado. Núcleo Vórtex ativo.\n\nEstou pronto para atuar como seu **Assistente de Scraping e Engenharia**.\n\nTraga seus arquivos **PDF, JSON, TXT, Markdown ou Código** para análise estrutural, extração de dados ou auditoria de segurança.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [sessionUsage, setSessionUsage] = useState<TokenUsage>({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  
  // App Modes
  const [chatMode, setChatMode] = useState<'general' | 'analyst'>('general'); // Default to General
  const [useContextInGeneral, setUseContextInGeneral] = useState(false); // Toggle for context in general mode
  const [isAttackerMode, setIsAttackerMode] = useState(false); // Sub-mode of Analyst
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Modais e UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  
  // Live Browser Split View State
  const [showLiveBrowser, setShowLiveBrowser] = useState(false);
  
  // Desktop logic: showPreview toggles the split screen
  const [showPreview, setShowPreview] = useState(true);
  // Mobile logic: mobileTab switches between full screen chat or full screen code
  const [mobileTab, setMobileTab] = useState<'chat' | 'code'>('chat');
  
  // Scroll Logic
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Load from LocalStorage on Mount
  useEffect(() => {
    try {
      const savedFile = localStorage.getItem(STORAGE_KEYS.FILE);
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (savedFile) {
        setFile(JSON.parse(savedFile));
      }
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (e) {
      console.error("Erro ao carregar do localStorage", e);
      localStorage.clear();
    }
  }, []);

  // Save to LocalStorage on Change
  useEffect(() => {
    if (file) {
      try {
        localStorage.setItem(STORAGE_KEYS.FILE, JSON.stringify(file));
      } catch (e) {
        console.warn("Arquivo muito grande para o localStorage. A persistência foi ignorada.");
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.FILE);
    }
  }, [file]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Reset Split View quando mudar de aba
  useEffect(() => {
      setShowLiveBrowser(false);
  }, [viewMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 200;
        setShowScrollBottom(isNotAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, status, mobileTab]); 

  const handleFileLoaded = (uploadedFile: UploadedFile) => {
    setFile(uploadedFile);
    if (messages.length <= 1 || messages[messages.length - 1].role !== 'model') {
        const initialAnalysisMsg: Message = {
        role: 'model',
        content: `Arquivo **${uploadedFile.name}** reconhecido. 
        
No modo **Analista**, posso extrair estruturas de dados (JSON), resumir documentos (PDF/TXT) ou auditar código.
No modo **Geral**, posso conversar sobre o conteúdo do arquivo se você habilitar a opção "Usar Contexto".`,
        timestamp: Date.now()
        };
        setMessages(prev => [...prev, initialAnalysisMsg]);
    }
  };

  const updateUsage = (newUsage?: TokenUsage) => {
      if (newUsage) {
          setSessionUsage(prev => ({
              promptTokens: prev.promptTokens + newUsage.promptTokens,
              completionTokens: prev.completionTokens + newUsage.completionTokens,
              totalTokens: prev.totalTokens + newUsage.totalTokens
          }));
      }
  };

  const handleSystemReboot = () => {
    if (window.confirm("CONFIRMAR REINICIALIZAÇÃO DO SISTEMA?\nIsso limpará a sessão atual e recarregará o kernel.")) {
        setFile(null);
        setMessages([{
            role: 'model',
            content: 'Sistema inicializado. Núcleo Vórtex ativo.',
            timestamp: Date.now()
        }]);
        setInputValue('');
        setStatus(AnalysisStatus.IDLE);
        setIsSidebarOpen(false);
        setSessionUsage({ promptTokens: 0, completionTokens: 0, totalTokens: 0 }); // Reset usage stats
        setIsBooting(true); // Trigger Boot Sequence
    }
  };

  const clearFileOnly = () => {
     setFile(null);
     const sysMsg: Message = {role: 'model', content: 'Arquivo removido do contexto.', timestamp: Date.now()};
     setMessages(prev => [...prev, sysMsg]);
  }

  const handleCloseCode = () => {
      if (window.innerWidth < 768) {
          setMobileTab('chat');
      } else {
          setShowPreview(false);
      }
  };

  const handleExportReport = () => {
    if (messages.length === 0) return;
    const reportHeader = `# Relatório de Sessão CodeScraper\n**Data:** ${new Date().toLocaleDateString()}\n**Modo:** ${chatMode}\n**Total Tokens:** ${sessionUsage.totalTokens}\n---\n\n`;
    const reportContent = messages.map(m => `${m.role === 'user' ? '### 👤 Usuário' : '### 🤖 AI'}\n\n${m.content}`).join('\n\n---\n\n');
    const fullReport = reportHeader + reportContent;
    const blob = new Blob([fullReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sessao_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSettingsOpen(false);
  };

  // Funcao unificada de analise/chat
  const performAnalysis = async (content: string, contextPrompt: string) => {
    setStatus(AnalysisStatus.ANALYZING);
    if (!showLiveBrowser) setViewMode('chat');

    try {
        // Decide system instruction e content usage baseados no modo
        let systemOverride = undefined;
        let contentToUse = content;
        let sourceNameToUse = "Browser/Source";

        if (chatMode === 'general') {
             systemOverride = "Você é um assistente útil. Responda com base no contexto fornecido se houver.";
             // No modo geral, mantemos o contexto se passado, mas o prompt de sistema é amigavel
        } else {
             // Analyst Mode uses default strict system prompt
             const injectedContext = `PERFIL TÉCNICO: Modo: ${isAttackerMode ? 'RED TEAM' : 'BLUE TEAM'}\nSOLICITAÇÃO: ${contextPrompt}`;
             contextPrompt = injectedContext; // Append to prompt
        }

        const result = await analyzeContent(contentToUse, sourceNameToUse, contextPrompt, messages, systemOverride);
        const aiMsg: Message = { role: 'model', content: result.text, timestamp: Date.now() };
        updateUsage(result.usage);
        setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        console.error(e);
        alert("Erro na análise.");
    } finally {
        setStatus(AnalysisStatus.IDLE);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputValue;
    if (!textToSend.trim() && !file) return;
    
    // Se estiver em modo analista e sem arquivo, avisa
    if (chatMode === 'analyst' && !file && textToSend.trim()) {
        const errorMsg: Message = { role: 'model', content: '⚠️ **Modo Analista:** Por favor, carregue um arquivo, log ou URL para eu analisar.', timestamp: Date.now() };
        setMessages(prev => [...prev, errorMsg]);
        return;
    }

    const userMsg: Message = { role: 'user', content: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setStatus(AnalysisStatus.ANALYZING);
    setMobileTab('chat');

    try {
      let content = null;
      let sourceName = null;
      let prompt = userMsg.content;
      let systemPrompt = undefined; // Undefined usa o default (Analyst)

      // LOGICA DE DECISAO DE CONTEXTO E MODO
      if (chatMode === 'analyst') {
          // MODO ANALISTA: Sempre usa o arquivo se existir, System Prompt Rígido
          if (file) {
              content = file.content;
              sourceName = file.name;
              prompt = `CONTEXTO: Modo: ${isAttackerMode ? 'RED TEAM' : 'BLUE TEAM'}\nArtefato: ${file.name}\nSOLICITAÇÃO: ${userMsg.content}`;
          }
      } else {
          // MODO GERAL: Usa arquivo APENAS se o toggle estiver ligado
          if (useContextInGeneral && file) {
              content = file.content;
              sourceName = file.name;
              prompt = `O usuário está perguntando sobre o arquivo: ${file.name}.\nPergunta: ${userMsg.content}`;
          } else {
              // Sem contexto de arquivo, chat puro
              prompt = userMsg.content;
          }
          // System Prompt Amigável
          systemPrompt = "Você é um assistente de IA útil e versátil. Responda de forma clara e prestativa.";
      }

      const result = await analyzeContent(content, sourceName, prompt, messages, systemPrompt);
      const aiMsg: Message = { role: 'model', content: result.text, timestamp: Date.now() };
      updateUsage(result.usage);
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: 'Erro interno na comunicação com a IA.', timestamp: Date.now() }]);
    } finally {
      setStatus(AnalysisStatus.IDLE);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    switch(action) {
        case 'analyze': prompt = "Realize uma análise técnica executiva deste conteúdo."; break;
        case 'security': prompt = "Execute uma Auditoria de Segurança Estática (SAST)."; break;
        case 'bugs': prompt = "Revise o código buscando 'Code Smells' e erros lógicos."; break;
        case 'scraping': prompt = "Analise a estrutura de dados (DOM/JSON) para extração."; break;
        case 'exploit_sqli': prompt = "Analise vetores para SQL Injection."; break;
        case 'exploit_xss': prompt = "Identifique sinks de DOM (innerHTML, eval) vulneráveis."; break;
        case 'bypass_auth': prompt = "Analise o controle de acesso (IDOR, BAC)."; break;
        case 'rce_check': prompt = "Audite o código em busca de execução remota (RCE)."; break;
    }
    // Force switch to analyst mode for quick actions if not already
    if (chatMode === 'general') setChatMode('analyst');
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- MENU ITEM HELPER ---
  const MenuItem = ({ id, label, icon: Icon, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
        viewMode === id 
          ? 'bg-[#303030] text-[#e3e3e3] border border-[#444746]' 
          : 'text-[#c4c7c5] hover:bg-[#1e1f20] hover:text-white'
      }`}
    >
       <div className="flex items-center gap-4">
           <div className={`p-2 rounded-lg ${viewMode === id ? 'bg-[#a8c7fa] text-[#001d35]' : 'bg-[#303030] text-[#8e918f] group-hover:text-[#e3e3e3]'}`}>
               <Icon size={18} />
           </div>
           <span className="font-bold text-sm tracking-wide">{label}</span>
       </div>
       {viewMode === id && <ChevronRight size={16} className="text-[#a8c7fa]"/>}
    </button>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showCodePanel = file && ((!isMobile && showPreview && !showLiveBrowser) || (isMobile && mobileTab === 'code'));

  // Shared context for Feedback Widgets
  const sharedFeedbackContext = {
      messages,
      sessionUsage,
      currentSection: viewMode,
      fileInfo: file ? `${file.name} (${(file.size/1024).toFixed(1)}kb)` : null,
  };

  const renderChatInterface = () => (
    <div className="flex flex-col h-full w-full relative">
        <main 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto p-4 md:p-8 relative transition-colors duration-500 custom-scrollbar ${chatMode === 'analyst' && isAttackerMode ? 'bg-gradient-to-b from-[#131314] to-red-950/10' : ''}`}
        >
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-24">
            {!file && messages.length <= 1 && (
            <div className="my-auto animate-fade-in flex flex-col items-center select-none">
                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl bg-[#1e1f20] border border-[#444746]">
                   <span className="font-mono text-5xl font-black text-[#a8c7fa] tracking-tighter">&gt;_</span>
                </div>
                <div className="text-center mb-10 max-w-lg">
                    <h2 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter text-[#1e1f20] drop-shadow-[0_1px_1px_rgba(255,255,255,0.05)]">
                        CodeScraper
                    </h2>
                    <p className="text-2xl font-black tracking-[0.2em] text-[#252628] mb-6">
                        VsOtAi
                    </p>
                    <p className="text-[#c4c7c5] text-lg">
                        {chatMode === 'general' ? 'Assistente de IA Geral. Posso ajudar com dúvidas do dia a dia ou analisar arquivos.' : 'Modo Analista Técnico. Carregue artefatos para auditoria profunda.'}
                    </p>
                </div>
                <div className="w-full max-w-xl">
                     <FileUploader onFileLoaded={handleFileLoaded} currentFile={file} onClearFile={clearFileOnly} />
                </div>
            </div>
            )}
            
            {(file || messages.length > 1) && (
                <div className="flex-1 space-y-6">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} />
                    ))}
                    {status === AnalysisStatus.ANALYZING && (
                        <div className="flex justify-start w-full animate-fade-in">
                            <div className="flex items-center gap-3 bg-[#1e1f20] p-4 rounded-[20px] rounded-tl-none border border-[#444746]/50 shadow-sm">
                                <Loader2 className={`animate-spin ${chatMode === 'analyst' && isAttackerMode ? 'text-red-400' : 'text-[#a8c7fa]'}`} size={18} />
                                <span className="text-sm text-[#c4c7c5] font-medium animate-pulse">
                                  Processando dados...
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
        
        {showScrollBottom && (
            <button onClick={scrollToBottom} className="fixed bottom-32 right-8 bg-[#303030] text-[#e3e3e3] p-3 rounded-full shadow-lg z-40 hover:bg-[#444746] transition-colors">
                <ArrowDown size={20} />
            </button>
        )}
        </main>

        {/* Input Area */}
        <footer className="absolute bottom-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent z-20">
            <div className="max-w-3xl mx-auto">
                {/* Quick Actions (Only in Analyst Mode) */}
                {file && status !== AnalysisStatus.ANALYZING && chatMode === 'analyst' && (
                    <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-1 no-scrollbar justify-center">
                        {!isAttackerMode ? (
                            <>
                                <button onClick={() => handleQuickAction('analyze')} className="flex items-center gap-2 px-4 py-2 bg-[#1e1f20] hover:bg-[#303030] border border-[#444746] rounded-full text-xs font-bold text-[#a8c7fa] transition-all"> <Search size={14} /> Análise Geral </button>
                                <button onClick={() => handleQuickAction('security')} className="flex items-center gap-2 px-4 py-2 bg-[#1e1f20] hover:bg-[#303030] border border-[#444746] rounded-full text-xs font-bold text-[#ffb4ab] transition-all"> <ShieldAlert size={14} /> Segurança </button>
                                <button onClick={() => handleQuickAction('bugs')} className="flex items-center gap-2 px-4 py-2 bg-[#1e1f20] hover:bg-[#303030] border border-[#444746] rounded-full text-xs font-bold text-[#e3e3e3] transition-all"> <Code size={14} /> Code Quality </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleQuickAction('exploit_sqli')} className="flex items-center gap-2 px-4 py-2 bg-[#3a0b0b] hover:bg-[#580f0f] border border-red-900 rounded-full text-xs font-bold text-red-400 transition-all"> <Zap size={14} /> SQLi Scan </button>
                                <button onClick={() => handleQuickAction('exploit_xss')} className="flex items-center gap-2 px-4 py-2 bg-[#3a0b0b] hover:bg-[#580f0f] border border-red-900 rounded-full text-xs font-bold text-orange-400 transition-all"> <Code size={14} /> XSS Vectors </button>
                            </>
                        )}
                    </div>
                )}
                
                {/* Input Box */}
                <div className={`relative bg-[#1e1f20] rounded-[28px] border transition-all shadow-lg ${chatMode === 'analyst' && isAttackerMode ? 'border-red-900/50 focus-within:border-red-500' : 'border-[#444746] focus-within:border-[#a8c7fa]'}`}>
                    
                    {/* Context Toggle for General Mode */}
                    {chatMode === 'general' && file && (
                        <div className="absolute -top-10 left-0">
                             <button 
                                onClick={() => setUseContextInGeneral(!useContextInGeneral)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${useContextInGeneral ? 'bg-[#004a77] border-[#7cacf8] text-[#c2e7ff]' : 'bg-[#1e1f20] border-[#444746] text-[#8e918f]'}`}
                             >
                                <Database size={12} />
                                {useContextInGeneral ? "Usando Contexto do Arquivo" : "Ignorar Contexto"}
                                {useContextInGeneral ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                             </button>
                        </div>
                    )}

                    <div className="flex items-center px-2">
                        <button className="p-3 text-[#c4c7c5] hover:text-[#e3e3e3] rounded-full hover:bg-[#303030] transition-colors" title="Anexar">
                             <Plus size={20} />
                        </button>
                        <textarea 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            placeholder={chatMode === 'general' ? "Pergunte algo ao assistente..." : (isAttackerMode ? "Inserir comando de ataque..." : "Faça uma pergunta sobre o código...")} 
                            disabled={status === AnalysisStatus.ANALYZING || (chatMode === 'analyst' && !file)} 
                            className="w-full bg-transparent text-[#e3e3e3] py-4 px-2 focus:outline-none h-[60px] max-h-[150px] resize-none overflow-y-auto custom-scrollbar placeholder-[#8e918f] font-mono" 
                        />
                        <button 
                            onClick={() => handleSendMessage()} 
                            disabled={!inputValue.trim() || status === AnalysisStatus.ANALYZING || (chatMode === 'analyst' && !file)} 
                            className={`p-3 rounded-full transition-all ${
                                !inputValue.trim() 
                                ? 'text-[#444746]' 
                                : (chatMode === 'analyst' && isAttackerMode)
                                    ? 'text-white bg-red-600 hover:bg-red-500' 
                                    : 'text-[#001d35] bg-[#a8c7fa] hover:bg-[#8ab4f8]'
                            }`}
                        > 
                            <Send size={20} /> 
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2 flex items-center justify-center gap-2">
                    <p className="text-[10px] text-[#8e918f]">
                        {settings.model} • {chatMode === 'general' ? 'General Mode' : 'Analyst Mode'} • Tokens: {sessionUsage.totalTokens}
                    </p>
                </div>
            </div>
        </footer>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden font-sans">
      
      {/* BOOT SEQUENCE OVERLAY */}
      {isBooting && (
          <BootSequence onComplete={() => setIsBooting(false)} />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))} 
        onExportReport={handleExportReport} 
        sessionUsage={sessionUsage}
      />
      <PayloadGeneratorModal isOpen={isPayloadModalOpen} onClose={() => setIsPayloadModalOpen(false)} themeColor={isAttackerMode ? 'rose' : 'blue'} />
      
      {/* SIDEBAR NAVIGATION - FIX FOR MOBILE Z-INDEX */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <aside 
        className={`fixed top-0 left-0 h-full w-80 bg-[#1e1f20] border-r border-[#444746] z-[70] transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-[#444746] flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#e3e3e3] flex items-center gap-2">
                <span className="font-mono text-xl tracking-tighter">Code<span className="text-[#a8c7fa]">Scraper</span></span>
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-[#c4c7c5] hover:text-white rounded-full hover:bg-[#303030]">
                <PanelLeftClose size={20} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
            <div className="space-y-2">
                <p className="px-4 text-xs font-bold text-[#8e918f] uppercase tracking-wider">Workspace</p>
                <MenuItem id="chat" label="Unified Chat" icon={MessageSquare} onClick={() => { setViewMode('chat'); setIsSidebarOpen(false); }} />
                <MenuItem id="browser" label="Browser Inspector" icon={MonitorPlay} onClick={() => { setViewMode('browser'); setIsSidebarOpen(false); }} />
                <MenuItem id="agent" label="Autonomous Agent" icon={Bot} onClick={() => { setViewMode('agent'); setIsSidebarOpen(false); }} />
                <MenuItem id="sandbox" label="Python Sandbox" icon={Box} onClick={() => { setViewMode('sandbox'); setIsSidebarOpen(false); }} />
            </div>

            <div className="h-px bg-[#444746] mx-4" />
            
            <div className="space-y-2">
                <p className="px-4 text-xs font-bold text-[#8e918f] uppercase tracking-wider">Red Team Tools</p>
                <button 
                  onClick={() => { setIsPayloadModalOpen(true); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[#c4c7c5] hover:bg-[#1e1f20] hover:text-white transition-all group"
                >
                    <div className="p-2 rounded-lg bg-[#303030] text-[#ffb4ab] group-hover:text-[#ffdad6]">
                        <Skull size={18} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">Payload Generator</span>
                </button>
                 <button 
                  onClick={() => { setViewMode('docs'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${viewMode === 'docs' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#c4c7c5]'}`}
                >
                    <div className="p-2 rounded-lg bg-[#303030] text-[#a8c7fa]">
                        <BookOpen size={18} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">Knowledge Base</span>
                </button>
            </div>

            {/* SIDEBAR SUPPORT BUTTON */}
            <div className="h-px bg-[#444746] mx-4" />
            <div className="px-4 py-2">
                 <p className="text-xs font-bold text-[#8e918f] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <HelpCircle size={12}/> Suporte
                 </p>
                 <FeedbackWidget 
                    contextData={sharedFeedbackContext} 
                    trigger={
                        <button className="w-full mt-1 py-2 bg-[#303030] hover:bg-[#444746] text-[#c4c7c5] hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                            <Mail size={12}/> Reportar Problema
                        </button>
                    }
                 />
            </div>
        </div>

        <div className="p-4 border-t border-[#444746] bg-[#131314] space-y-2">
            <button 
                onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#303030] text-[#c4c7c5] hover:text-white transition-all"
            >
                <SettingsIcon size={18} />
                <span className="font-medium text-sm">Configuração de IA</span>
            </button>
            <button 
                onClick={handleSystemReboot} 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#3a0b0b] text-[#ffb4ab] hover:text-[#ffdad6] transition-all"
            >
                <Power size={18} />
                <span className="font-medium text-sm">System Reboot</span>
            </button>
        </div>
      </aside>

      {/* Code Sidebar */}
      <div className={`${!showLiveBrowser && showCodePanel && viewMode === 'chat' ? 'flex' : 'hidden'} w-full md:w-5/12 flex-col border-r border-[#444746] bg-[#1e1f20] transition-all duration-300 relative z-30`}>
         {file && <CodePreview content={file.content} fileName={file.name} onClose={handleCloseCode} />}
      </div>

      <div className={`flex flex-col h-full transition-all duration-300 w-full ${!showLiveBrowser && showCodePanel && viewMode === 'chat' ? 'md:w-7/12' : 'md:w-full'}`}>
        
        {/* Main App Header */}
        <header className="h-16 px-4 flex items-center justify-between shrink-0 bg-[#131314] border-b border-[#444746]/30">
          <div className="flex items-center gap-3 shrink-0">
             
             {/* TOGGLE SIDEBAR (HAMBURGER) */}
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-[#1e1f20] hover:bg-[#303030] text-[#a8c7fa] rounded-full transition-colors border border-[#444746] shadow-sm group"
                title="Menu"
             >
                <Terminal size={20} className="group-hover:scale-110 transition-transform" />
             </button>

             {/* BACK BUTTON (Visible only when not in chat mode) */}
             {viewMode !== 'chat' && (
                 <button 
                    onClick={() => setViewMode('chat')}
                    className="p-2.5 bg-[#303030] hover:bg-[#444746] text-[#e3e3e3] rounded-full transition-colors border border-[#444746] shadow-sm flex items-center gap-2 animate-fade-in"
                    title="Voltar ao Chat"
                 >
                    <ArrowLeft size={20} />
                    <span className="hidden md:inline text-xs font-bold">Voltar</span>
                 </button>
             )}

             {/* Mode Switcher */}
             <div className="hidden md:flex items-center bg-[#1e1f20] rounded-full p-1 border border-[#444746]">
                <button 
                    onClick={() => setChatMode('general')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatMode === 'general' ? 'bg-[#a8c7fa] text-[#001d35]' : 'text-[#8e918f] hover:text-[#c4c7c5]'}`}
                >
                    <MessageCircle size={14} /> General
                </button>
                <button 
                    onClick={() => setChatMode('analyst')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatMode === 'analyst' ? 'bg-[#303030] text-[#e3e3e3] shadow-inner' : 'text-[#8e918f] hover:text-[#c4c7c5]'}`}
                >
                    <ShieldAlert size={14} /> Analyst
                </button>
             </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Context Feedback Switch (Small Button) */}
            <FeedbackWidget 
                contextData={sharedFeedbackContext}
                trigger={
                    <button className="p-2.5 bg-[#1e1f20] hover:bg-[#303030] text-[#a8c7fa] rounded-full transition-colors border border-[#444746] shadow-sm" title="Feedback / Reportar Bug">
                         <Bug size={16} />
                    </button>
                }
            />

            {/* Mobile Mode Switcher (Compact) */}
            <button 
                onClick={() => setChatMode(prev => prev === 'general' ? 'analyst' : 'general')}
                className="md:hidden flex items-center justify-center p-2 rounded-full border border-[#444746] bg-[#1e1f20] text-[#c4c7c5]"
            >
                {chatMode === 'general' ? <MessageCircle size={20}/> : <ShieldAlert size={20}/>}
            </button>
            
            {/* SPLIT VIEW TOGGLE - ONLY IN BROWSER MODE */}
            {viewMode === 'browser' && (
                <button 
                    onClick={() => setShowLiveBrowser(!showLiveBrowser)} 
                    className={`p-2 rounded-full transition-colors ${showLiveBrowser ? 'bg-[#a8c7fa] text-[#001d35]' : 'text-[#c4c7c5] hover:bg-[#303030]'}`} 
                    title={showLiveBrowser ? "Fechar Split View" : "Abrir Chat Lateral"}
                >
                    {showLiveBrowser ? <XCircle size={20} /> : <SplitSquareHorizontal size={20} />}
                </button>
            )}
            
            {/* Red Team Toggle (Only visible in Analyst Mode) - AGORA COM TEXTO PARA CONFIRMAÇÃO */}
            {chatMode === 'analyst' && (
                <button onClick={() => setIsAttackerMode(!isAttackerMode)} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isAttackerMode ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-[#303030] border-transparent text-[#c4c7c5]'}`} title={isAttackerMode ? "Desativar Red Team" : "Ativar Red Team"}>
                    {isAttackerMode ? <Swords size={14} /> : <ShieldAlert size={14} />}
                    <span className="hidden sm:inline">{isAttackerMode ? "RED TEAM" : "BLUE TEAM"}</span>
                </button>
            )}
            
            {file && viewMode === 'chat' && !showLiveBrowser && (
              <button onClick={() => setShowPreview(!showPreview)} className="hidden md:flex p-2 text-[#c4c7c5] hover:bg-[#303030] rounded-full"> {showPreview ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>} </button>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
            <div className={`flex flex-col h-full transition-all duration-300 ${showLiveBrowser ? 'w-1/2 border-r border-[#444746]' : 'w-full'}`}>
                {showLiveBrowser ? (
                    renderChatInterface()
                ) : (
                    <>
                        {viewMode === 'browser' ? (
                            <BrowserInspector initialUrl={file?.name.startsWith('http') ? file.name : undefined} onAnalyze={performAnalysis} isAttackerMode={isAttackerMode} currentFile={file} />
                        ) : viewMode === 'agent' ? (
                            <AutonomousAgent file={file} isAttackerMode={isAttackerMode} />
                        ) : viewMode === 'sandbox' ? (
                            <PythonSandbox isAttackerMode={isAttackerMode} />
                        ) : viewMode === 'docs' ? (
                            <DocumentationHub />
                        ) : (
                            renderChatInterface()
                        )}
                    </>
                )}
            </div>
            {showLiveBrowser && (
                <div className="w-1/2 h-full bg-[#131314] animate-slide-in-right">
                     <BrowserInspector initialUrl={file?.name.startsWith('http') ? file.name : undefined} onAnalyze={performAnalysis} isAttackerMode={isAttackerMode} currentFile={file} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};