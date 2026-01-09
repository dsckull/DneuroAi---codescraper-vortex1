import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Server, Cpu, Key, Globe, ShieldCheck, Sliders, BrainCircuit, Activity, Lock, Coins, History, BarChart3, AlertTriangle, ChevronDown, Sparkles, Zap, Box, Link } from 'lucide-react';
import { AppSettings, LLMProvider, TokenUsage } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportReport: () => void;
  sessionUsage?: TokenUsage;
}

const PROVIDERS: { id: LLMProvider; name: string; icon: any }[] = [
  { id: 'google', name: 'Google Gemini', icon: Globe },
  { id: 'openai', name: 'OpenAI / Compatible', icon: Cpu },
  { id: 'anthropic', name: 'Anthropic', icon: ShieldCheck },
  { id: 'groq', name: 'Groq (LPU)', icon: Server },
  { id: 'ollama', name: 'Ollama (Local)', icon: Box },
];

interface ModelOption {
    id: string;
    name: string;
    description: string;
    badge?: string;
}

const MODEL_CATALOG: Record<LLMProvider, ModelOption[]> = {
  google: [
    { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking', description: 'Raciocínio avançado (CoT). O melhor para lógica complexa e Red Team.', badge: 'NEW' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Multimodal, extremamente rápido e eficiente. Uso geral.' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Janela de contexto massiva (2M). Essencial para ler PDFs grandes ou muitos arquivos.' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Opção econômica e rápida para tarefas simples.' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'O modelo carro-chefe. Rápido e inteligente.' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Versão anterior robusta com boa janela de contexto.' },
    { id: 'o1-preview', name: 'o1 Preview', description: 'Raciocínio profundo. Lento, mas excelente para matemática e código complexo.', badge: 'EXPENSIVE' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Alternativa de baixo custo para tarefas rápidas.' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'O melhor para Coding e nuances de texto atualmente.', badge: 'BEST FOR CODE' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Alta capacidade literária e criativa.' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Resposta instantânea.' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Modelo open-source de ponta rodando em LPU (Hyper Fast).' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Mistura de especialistas (MoE). Bom balanceamento.' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Modelo leve do Google.' }
  ],
  ollama: [
    { id: 'llama3', name: 'Llama 3', description: 'Standard local model.' },
    { id: 'mistral', name: 'Mistral', description: 'Eficiente para máquinas menores.' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'Raciocínio avançado local (se instalado).' }
  ]
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportReport,
  sessionUsage
}) => {
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showModelList, setShowModelList] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings);
      setIsSaved(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(tempSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleKeyChange = (provider: LLMProvider, key: string) => {
    setTempSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key }
    }));
    setIsSaved(false);
  };

  const currentProvider = tempSettings.provider;
  const availableModels = MODEL_CATALOG[currentProvider] || [];

  // Generic Cost Estimation (Roughly based on Gemini 1.5 Flash/Pro Blended)
  const estimateCost = (usage: TokenUsage | undefined) => {
      if (!usage) return "0.0000";
      // Assuming a blend or worst case 'Pro' pricing for awareness
      const inputCost = (usage.promptTokens / 1000000) * 3.50; 
      const outputCost = (usage.completionTokens / 1000000) * 10.50;
      return (inputCost + outputCost).toFixed(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-[#131314] border border-[#444746] rounded-[28px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#444746] bg-[#1e1f20] rounded-t-[28px]">
          <h2 className="text-xl font-mono font-bold text-[#e3e3e3] flex items-center gap-3">
            <Server size={20} className="text-[#a8c7fa]" />
            SISTEMA :: CONFIGURAÇÃO DE IA
          </h2>
          <button onClick={onClose} className="text-[#c4c7c5] hover:text-[#e3e3e3] p-2 hover:bg-[#303030] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-[#131314] grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Coluna Esquerda: Provedores e Modelos */}
          <div className="space-y-6">
             {/* COST MONITOR */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-[#6dd58c]">
                    <Coins size={64} />
                </div>
                <div className="flex items-center gap-2 mb-4 text-[#e3e3e3] font-bold text-sm uppercase tracking-wider">
                    <BarChart3 size={16} className="text-[#6dd58c]"/> Monitor de Consumo (Sessão)
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] text-[#8e918f] uppercase">Total Tokens</div>
                        <div className="text-xl font-mono text-[#e3e3e3]">{sessionUsage?.totalTokens.toLocaleString() || 0}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[#8e918f] uppercase">Custo Est. (USD)</div>
                        <div className="text-xl font-mono text-[#6dd58c]">${estimateCost(sessionUsage)}</div>
                    </div>
                </div>
                {sessionUsage && sessionUsage.totalTokens > 100000 && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-yellow-400 bg-yellow-900/20 p-2 rounded">
                        <AlertTriangle size={12}/>
                        <span>Alto consumo detectado.</span>
                    </div>
                )}
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} /> Provedor de IA
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTempSettings(prev => ({ ...prev, provider: p.id, model: MODEL_CATALOG[p.id][0]?.id || '' }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            tempSettings.provider === p.id 
                            ? 'bg-[#004a77] border-[#7cacf8] text-[#c2e7ff]' 
                            : 'bg-[#1e1f20] border-[#444746] text-[#c4c7c5] hover:bg-[#303030]'
                        }`}
                      >
                         <p.icon size={14} /> {p.name}
                      </button>
                   ))}
                </div>
             </div>

             {/* Enhanced Model Selection */}
             <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider block">Modelo Selecionado</label>
                    <button 
                        onClick={() => setShowModelList(!showModelList)} 
                        className="text-[10px] text-[#a8c7fa] hover:underline flex items-center gap-1"
                    >
                        {showModelList ? 'Ocultar Lista' : 'Mostrar Lista'} <ChevronDown size={10} className={`transform transition-transform ${showModelList ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showModelList && (
                    <div className="bg-[#1e1f20] border border-[#444746] rounded-xl max-h-[220px] overflow-y-auto custom-scrollbar mb-3 shadow-inner">
                        {availableModels.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setTempSettings(prev => ({ ...prev, model: m.id }))}
                                className={`w-full text-left p-3 border-b border-[#444746]/50 last:border-0 hover:bg-[#303030] transition-colors flex items-start justify-between group ${tempSettings.model === m.id ? 'bg-[#303030] ring-1 ring-[#a8c7fa] inset-0' : ''}`}
                            >
                                <div>
                                    <div className={`font-mono text-sm font-bold flex items-center gap-2 ${tempSettings.model === m.id ? 'text-[#a8c7fa]' : 'text-[#e3e3e3]'}`}>
                                        {m.name}
                                        {m.badge && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#444746] text-[#c4c7c5] font-sans font-bold group-hover:bg-[#a8c7fa] group-hover:text-[#001d35] transition-colors">
                                                {m.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-[#8e918f] mt-1 leading-tight group-hover:text-[#c4c7c5]">
                                        {m.description}
                                    </div>
                                    <div className="text-[9px] text-[#444746] mt-1 font-mono">{m.id}</div>
                                </div>
                                {tempSettings.model === m.id && <CheckCircle size={16} className="text-[#a8c7fa] shrink-0 mt-1" />}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Fallback Manual Input */}
                <div className="relative">
                    <input 
                    value={tempSettings.model}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Ou digite o ID do modelo manualmente..."
                    className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-3 text-[#e3e3e3] text-sm focus:border-[#a8c7fa] focus:outline-none font-mono placeholder-[#444746]"
                    />
                    <div className="absolute right-3 top-3.5 text-[#444746]">
                        <Cpu size={14}/>
                    </div>
                </div>
             </div>

             {/* API Key Input */}
             <div>
                <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider block mb-2 flex items-center gap-2">
                   <Key size={14} /> Chave de API ({PROVIDERS.find(p => p.id === currentProvider)?.name})
                </label>
                <input 
                   type="password"
                   value={tempSettings.apiKeys[currentProvider] || ''}
                   onChange={(e) => handleKeyChange(currentProvider, e.target.value)}
                   placeholder={`sk-... (${currentProvider})`}
                   className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-4 text-[#e3e3e3] text-sm focus:border-[#a8c7fa] focus:outline-none placeholder-[#444746] font-mono"
                />
             </div>

             {/* Base URL Input (Optional) */}
             <div>
                <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider block mb-2 flex items-center gap-2">
                   <Link size={14} /> Base URL (Opcional)
                </label>
                <input 
                   type="text"
                   value={tempSettings.baseUrl || ''}
                   onChange={(e) => setTempSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                   placeholder="Ex: http://localhost:11434/v1 ou https://api.openai.com/v1"
                   className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-4 text-[#e3e3e3] text-sm focus:border-[#a8c7fa] focus:outline-none placeholder-[#444746] font-mono"
                />
                <p className="text-[10px] text-[#8e918f] mt-1 ml-1">
                   Útil para Ollama, LM Studio ou Endpoints OpenAI-Compatible customizados.
                </p>
             </div>
          </div>

          {/* Coluna Direita: Controles Avançados */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 pb-2 border-b border-[#444746] mb-4">
                 <Sliders size={18} className="text-[#a8c7fa]" />
                 <h3 className="text-sm font-bold text-[#e3e3e3]">Controles Avançados & Limites</h3>
             </div>

            {/* History Depth */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-[#8e918f] uppercase flex items-center gap-2"><History size={12}/> Profundidade de Histórico</label>
                    <span className="text-xs font-mono text-[#6dd58c]">{tempSettings.historyDepth || 5} msgs</span>
                </div>
                <input 
                    type="range" min="0" max="20" step="1"
                    value={tempSettings.historyDepth || 5}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, historyDepth: parseInt(e.target.value) }))}
                    className="w-full accent-[#6dd58c] h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-[#8e918f] mt-1">
                    Controla quantas mensagens passadas são enviadas. "0" envia apenas a atual.
                </p>
             </div>

             {/* Temperature */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-[#8e918f] uppercase flex items-center gap-2"><Activity size={12}/> Temperatura</label>
                    <span className="text-xs font-mono text-[#a8c7fa]">{tempSettings.temperature}</span>
                </div>
                <input 
                    type="range" min="0" max="2" step="0.1"
                    value={tempSettings.temperature}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-[#a8c7fa] h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer"
                />
             </div>

             {/* Max Tokens */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-[#8e918f] uppercase flex items-center gap-2"><Cpu size={12}/> Max Output Tokens</label>
                    <span className="text-xs font-mono text-[#a8c7fa]">{tempSettings.maxOutputTokens}</span>
                </div>
                <input 
                    type="range" min="128" max="65536" step="128"
                    value={tempSettings.maxOutputTokens}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, maxOutputTokens: parseInt(e.target.value) }))}
                    className="w-full accent-[#a8c7fa] h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer"
                />
             </div>

             {/* Thinking Budget */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-[#8e918f] uppercase flex items-center gap-2"><BrainCircuit size={12}/> Thinking Budget</label>
                    <span className="text-xs font-mono text-[#d0bcff]">{tempSettings.thinkingBudget}</span>
                </div>
                <input 
                    type="range" min="0" max="32000" step="1024"
                    value={tempSettings.thinkingBudget}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, thinkingBudget: parseInt(e.target.value) }))}
                    className="w-full accent-[#d0bcff] h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer"
                />
             </div>

             {/* Safety Level */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <label className="text-xs font-bold text-[#8e918f] uppercase block mb-2 flex items-center gap-2"><Lock size={12}/> Nível de Segurança</label>
                <select 
                    value={tempSettings.safetyLevel}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, safetyLevel: e.target.value as any }))}
                    className="w-full bg-[#131314] text-[#c4c7c5] text-xs p-2 rounded border border-[#444746] focus:outline-none"
                >
                    <option value="BLOCK_NONE">Nenhum Bloqueio (Unrestricted)</option>
                    <option value="BLOCK_ONLY_HIGH">Bloquear Apenas Alto Risco</option>
                    <option value="BLOCK_MEDIUM_AND_ABOVE">Médio e Alto (Padrão)</option>
                    <option value="BLOCK_LOW_AND_ABOVE">Máxima Segurança</option>
                </select>
             </div>

          </div>
        </div>
        
        <div className="p-6 border-t border-[#444746] bg-[#1e1f20] rounded-b-[28px] flex items-center justify-between">
           <button
                onClick={onExportReport}
                className="px-6 py-3 bg-[#303030] hover:bg-[#444746] rounded-xl text-[#c4c7c5] text-sm font-bold transition-all"
             >
                Exportar Logs
             </button>
             <button
                onClick={handleSave}
                className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                    isSaved ? 'bg-[#6dd58c] text-[#00391a]' : 'bg-[#a8c7fa] hover:bg-[#8ab4f8] text-[#001d35]'
                }`}
             >
                {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                {isSaved ? 'Salvar Configurações' : 'Aplicar Alterações'}
             </button>
        </div>
      </div>
    </div>
  );
};