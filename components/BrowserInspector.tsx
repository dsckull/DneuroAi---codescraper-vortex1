import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Code, Eye, Lock, Shield, Cpu, AlertTriangle, Globe, Laptop2, Plug, ScanLine, FileText, UploadCloud, Edit, Search, ChevronDown, Layout, Play, X, Sparkles, Wand2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { UploadedFile } from '../types';

declare var chrome: any;

interface BrowserInspectorProps {
  initialUrl?: string;
  onAnalyze: (content: string, context: string) => void;
  isAttackerMode: boolean;
  currentFile: UploadedFile | null;
}

export const BrowserInspector: React.FC<BrowserInspectorProps> = ({ initialUrl, onAnalyze, isAttackerMode, currentFile }) => {
  const [url, setUrl] = useState(initialUrl || 'https://example.com');
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'audit' | 'smart'>('audit');
  
  const [isExtension, setIsExtension] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        setIsExtension(true);
        syncWithActiveTab();
    } else if (initialUrl && !initialUrl.startsWith('file://')) {
        fetchUrl();
    } else if (currentFile) {
        setHtmlContent(currentFile.content);
        setUrl(`file://${currentFile.name}`);
    }
  }, [currentFile]);

  const syncWithActiveTab = async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    setIsLoading(true);
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            setUrl(tab.url || 'chrome://page');
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => { return document.documentElement.outerHTML; }
            });
            if (result && result[0] && result[0].result) {
                setHtmlContent(result[0].result);
            }
        }
    } catch (error) {
        setHtmlContent("Erro ao ler a aba. Extensão precisa de permissão.");
    } finally {
        setIsLoading(false);
    }
  };

  const fetchUrl = async () => {
    if (isExtension) { syncWithActiveTab(); return; }
    if (!url || url.startsWith('file://')) return;
    
    setIsLoading(true);
    try {
      let target = url;
      if (!target.startsWith('http')) target = 'https://' + target;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Falha na requisição');
      const text = await res.text();
      setHtmlContent(text);
    } catch (e) {
      setHtmlContent(`<html><body>
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#131314; color:#94a3b8; font-family:sans-serif;">
        <div style="background:#1e1f20; padding:2rem; border-radius:1.5rem; border:1px solid #444746; text-align:center;">
            <h2 style="color:#f2b8b5; margin-bottom:1rem;">Bloqueio de CORS Detectado</h2>
            <p>O site <b>${url}</b> impede acesso direto via browser proxy.</p>
            <p style="margin-top:1rem; font-size:0.9rem;">Sugestão: Use a extensão ou copie o HTML manualmente.</p>
        </div>
      </div>
      </body></html>`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchUrl();
  };

  const loadManualContent = () => {
      if (manualInput.trim()) {
          setHtmlContent(manualInput);
          setIsManualMode(false);
          setUrl('source://manual-input');
      }
  };

  const loadFromUploadedFile = () => {
      if (currentFile) {
          setHtmlContent(currentFile.content);
          setUrl(`file://${currentFile.name}`);
          setIsManualMode(false);
      }
  };

  const runAiAudit = () => {
     onAnalyze(htmlContent, `Análise de Navegador: ${url}`);
  };

  const runSmartScrape = () => {
      const prompt = `
      [SMART SCRAPING - STAGEHAND MODE]
      Analise o HTML/JSON fornecido e gere uma estratégia de extração de dados resiliente.
      TAREFA: 1. Identifique a principal lista de dados. 2. Crie seletores CSS/XPath. 3. Gere um JSON Schema.
      `;
      onAnalyze(htmlContent, prompt);
  };

  // --- MANUAL INPUT MODE UI ---
  if (isManualMode) {
      return (
          <div className="flex flex-col h-full bg-[#131314] animate-fade-in relative z-20">
              <div className="h-16 flex items-center justify-between px-6 bg-[#131314]">
                  <h3 className="text-[#e3e3e3] font-bold flex items-center gap-2 font-sans text-lg"><Edit size={18} className="text-[#a8c7fa]"/> Editor de Código Manual</h3>
                  <button onClick={() => setIsManualMode(false)} className="p-2 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-white transition-colors">
                      <X size={24} />
                  </button>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-4">
                  <div className="bg-[#1e1f20] border border-[#444746] p-4 rounded-2xl flex gap-4 shadow-sm">
                      <div className="p-3 bg-[#004a77] rounded-xl h-fit text-[#c2e7ff]"><Code size={24}/></div>
                      <div>
                          <h4 className="text-base font-bold text-[#e3e3e3] mb-1">Injeção Direta de Source</h4>
                          <p className="text-sm text-[#c4c7c5] leading-relaxed">Cole HTML, JSON ou Logs brutos aqui para contornar bloqueios de WAF ou CORS. O conteúdo será renderizado em sandbox isolado.</p>
                      </div>
                  </div>
                  
                  <textarea 
                    className="flex-1 w-full bg-[#1e1f20] border border-[#444746] rounded-2xl p-6 font-mono text-sm text-[#e3e3e3] focus:border-[#a8c7fa] focus:ring-2 focus:ring-[#a8c7fa]/20 focus:outline-none resize-none custom-scrollbar"
                    placeholder="<!-- Cole seu código aqui -->"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                  
                  <div className="flex justify-end gap-3 pt-2">
                      {currentFile && (
                          <button onClick={loadFromUploadedFile} className="px-6 py-3 bg-[#1e1f20] hover:bg-[#303030] text-[#e3e3e3] rounded-full border border-[#444746] flex items-center gap-2 text-sm font-medium transition-all">
                              <UploadCloud size={18}/> Usar {currentFile.name.substring(0, 20)}...
                          </button>
                      )}
                      <button onClick={loadManualContent} disabled={!manualInput} className="px-8 py-3 bg-[#a8c7fa] hover:bg-[#8ab4f8] text-[#041e49] font-bold rounded-full shadow-lg flex items-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Play size={18}/> Renderizar
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN INSPECTOR UI (GEMINI STYLE) ---
  return (
    <div className="flex flex-col h-full bg-[#131314] font-sans">
      
      {/* 1. FLOATING HEADER */}
      <div className="p-4 bg-[#131314] shrink-0">
        <div className="bg-[#1e1f20] rounded-[24px] p-2 flex flex-col gap-3 shadow-md border border-[#444746]/50">
            
            {/* Top Row: Nav & Omnibox */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 pl-1">
                    <button onClick={() => isExtension ? syncWithActiveTab() : fetchUrl()} className="p-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#303030] rounded-full transition-colors group">
                         <RotateCcw size={18} className={`group-hover:-rotate-180 transition-transform duration-700 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="flex-1 h-12 bg-[#131314] border border-[#444746] rounded-full flex items-center px-4 gap-3 focus-within:border-[#a8c7fa] focus-within:ring-2 focus-within:ring-[#a8c7fa]/20 transition-all">
                    {isExtension ? <Plug size={18} className="text-[#d0bcff]" /> : <Lock size={16} className="text-[#6dd58c]" />}
                    <input 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-[#e3e3e3] placeholder-[#8e918f]"
                        readOnly={isExtension || url.startsWith('file://') || url.startsWith('source://')}
                        placeholder="https://site.com"
                    />
                     {htmlContent && (
                        <span className="text-[10px] font-medium text-[#c4c7c5] px-2 py-1 bg-[#303030] rounded-md hidden sm:block">
                            {(htmlContent.length / 1024).toFixed(1)} KB
                        </span>
                    )}
                </div>

                <button 
                    onClick={runAiAudit}
                    disabled={!htmlContent}
                    className={`h-12 px-5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md shrink-0 ${
                        isAttackerMode 
                        ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-red-500/20' 
                        : 'bg-gradient-to-r from-[#4c8df6] to-[#7cacf8] text-[#001d35] hover:shadow-blue-500/20'
                    } disabled:opacity-50 disabled:grayscale`}
                >
                    <Sparkles size={18} />
                    <span className="hidden xl:inline">Analyze</span>
                </button>
            </div>

            {/* Bottom Row: Tabs */}
            <div className="flex items-center justify-between px-2">
                 <div className="flex gap-1 bg-[#131314] p-1 rounded-full border border-[#444746]">
                     {[
                        { id: 'audit', label: 'Overview', icon: Layout },
                        { id: 'smart', label: 'AI Scraper', icon: ScanLine },
                        { id: 'source', label: 'Code', icon: Code },
                        { id: 'preview', label: 'View', icon: Eye },
                     ].map((tab) => (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                activeTab === tab.id 
                                ? 'bg-[#303030] text-[#e3e3e3]'
                                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]'
                            }`}
                         >
                            <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                         </button>
                     ))}
                 </div>
                 
                 <div className="flex gap-1">
                     <button onClick={() => { setIsManualMode(true); setManualInput(htmlContent); }} className="p-2 text-[#c4c7c5] hover:text-white hover:bg-[#303030] rounded-full transition-colors" title="Manual Edit">
                         <Edit size={16} />
                     </button>
                 </div>
            </div>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="flex-1 overflow-auto bg-[#131314] relative custom-scrollbar rounded-t-[24px] border-t border-[#444746]/30 mx-2">
         {htmlContent ? (
            <>
                {activeTab === 'source' && (
                    <SyntaxHighlighter
                        language="html"
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', background: 'transparent', lineHeight: '1.5' }}
                        showLineNumbers={true}
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {htmlContent}
                    </SyntaxHighlighter>
                )}

                {activeTab === 'preview' && (
                    <div className="w-full h-full bg-white flex flex-col rounded-t-[20px] overflow-hidden">
                        <div className="bg-[#f0f0f0] border-b border-[#e0e0e0] p-2 text-[10px] text-[#606060] flex justify-between px-4 font-mono">
                            <span>SANDBOXED RENDERER</span>
                            <span>{url}</span>
                        </div>
                        <iframe 
                            srcDoc={htmlContent} 
                            className="flex-1 w-full border-none"
                            title="Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                )}

                {activeTab === 'smart' && (
                    <div className="p-8 max-w-2xl mx-auto flex flex-col h-full justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#d0bcff]/10 to-[#4c8df6]/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-[#d0bcff]/20">
                           <Wand2 size={40} className="text-[#d0bcff]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#e3e3e3] mb-3">AI Smart Extraction</h3>
                        <p className="text-[#c4c7c5] text-sm mb-8 leading-relaxed max-w-md mx-auto">
                            O Gemini Vision analisará a estrutura DOM para identificar padrões de dados e gerar seletores resilientes.
                        </p>
                        <button 
                            onClick={runSmartScrape}
                            className="w-full py-4 bg-[#d0bcff] hover:bg-[#e8def8] text-[#381e72] font-bold rounded-[20px] transition-all flex items-center justify-center gap-3 text-sm group"
                        >
                            <Sparkles size={18} className="group-hover:animate-pulse" /> START AUTO-EXTRACTION
                        </button>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-[#e3e3e3] mb-1">
                                    {isAttackerMode ? 'Reconnaissance' : 'Site Overview'}
                                </h3>
                                <p className="text-xs text-[#8e918f] font-mono">
                                    {url.substring(0, 60)}{url.length > 60 ? '...' : ''}
                                </p>
                            </div>
                            <div className={`p-3 rounded-2xl ${isAttackerMode ? 'bg-red-500/10 text-red-400' : 'bg-[#a8c7fa]/10 text-[#a8c7fa]'}`}>
                                {isAttackerMode ? <AlertTriangle size={24} /> : <Shield size={24} />}
                            </div>
                        </div>

                        {/* Cards Grid - Material 3 Style */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Scripts', val: htmlContent.match(/<script/g)?.length || 0, icon: FileText, color: 'text-[#ffd8b4]', bg: 'bg-[#ffd8b4]/10' },
                                { label: 'Inputs', val: htmlContent.match(/<input/g)?.length || 0, icon: Edit, color: 'text-[#a8c7fa]', bg: 'bg-[#a8c7fa]/10' },
                                { label: 'Links', val: htmlContent.match(/href="http/g)?.length || 0, icon: Globe, color: 'text-[#6dd58c]', bg: 'bg-[#6dd58c]/10' },
                                { label: 'Secrets?', val: htmlContent.match(/<!--/g)?.length || 0, icon: Lock, color: 'text-[#d0bcff]', bg: 'bg-[#d0bcff]/10' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-[#1e1f20] p-4 rounded-[20px] border border-[#444746]/50 flex flex-col justify-between h-28 hover:bg-[#303030] transition-colors cursor-default">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={16} />
                                    </div>
                                    <div>
                                        <span className="text-2xl font-bold text-[#e3e3e3] block">{stat.val}</span>
                                        <span className="text-[10px] uppercase text-[#8e918f] font-bold tracking-wider">{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#1e1f20] border border-[#444746]/50 rounded-[20px] p-5">
                             <div className="flex items-center gap-2 mb-3 text-[#e3e3e3] font-bold text-sm">
                                <Search size={16} className="text-[#a8c7fa]"/>
                                <span>Quick Insights</span>
                             </div>
                             <div className="bg-[#131314] rounded-xl p-4 border border-[#444746] flex gap-3 items-start">
                                <div className="mt-1 w-2 h-2 rounded-full bg-[#a8c7fa] shrink-0"></div>
                                <p className="text-sm text-[#c4c7c5] leading-relaxed">
                                    A estrutura do documento está carregada na memória. Use a barra de chat lateral para interagir com o conteúdo, pedir extrações específicas ou buscar vulnerabilidades. O contexto do código fonte será injetado automaticamente na sua próxima mensagem.
                                </p>
                             </div>
                        </div>
                    </div>
                )}
            </>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#8e918f] gap-6 p-8 text-center animate-fade-in">
                <div className="w-32 h-32 rounded-[32px] bg-[#1e1f20] flex items-center justify-center shadow-lg border border-[#444746]">
                    <Laptop2 size={48} className="opacity-40" />
                </div>
                <div className="max-w-xs space-y-2">
                    <h3 className="text-[#e3e3e3] font-bold text-xl">Ready to Inspect</h3>
                    <p className="text-sm">Digite uma URL, faça upload de um arquivo ou cole código fonte.</p>
                </div>
                
                {currentFile ? (
                     <button onClick={loadFromUploadedFile} className="mt-2 px-6 py-3 bg-[#a8c7fa] hover:bg-[#8ab4f8] text-[#041e49] text-sm font-bold rounded-full transition-all flex items-center gap-2">
                         <FileText size={16}/> 
                         Load {currentFile.name}
                     </button>
                ) : (
                    <button onClick={() => setIsManualMode(true)} className="mt-2 text-sm text-[#a8c7fa] hover:text-[#d8e7ff] font-medium flex items-center gap-1 hover:underline">
                        Open Manual Editor
                    </button>
                )}
            </div>
         )}
      </div>
    </div>
  );
};