import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Server, Cpu, Key, Globe, ShieldCheck, Sliders, BrainCircuit, Activity, Lock } from 'lucide-react';
import { AppSettings, LLMProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportReport: () => void;
}

const PROVIDERS: { id: LLMProvider; name: string; icon: any }[] = [
  { id: 'google', name: 'DeepMind / Gemini', icon: Globe },
  { id: 'openai', name: 'OpenAI', icon: Cpu },
  { id: 'anthropic', name: 'Anthropic', icon: ShieldCheck },
  { id: 'groq', name: 'Groq (LPU)', icon: Server },
  { id: 'ollama', name: 'Ollama (Local)', icon: Server },
];

const MODELS: Record<LLMProvider, string[]> = {
  google: [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-2.5-flash-preview',
    'gemini-2.5-pro-preview',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ],
  openai: [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  groq: [
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it'
  ],
  ollama: [
    'llama3',
    'mistral',
    'codellama',
    'phi3'
  ]
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportReport
}) => {
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

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
             <div className="space-y-2">
                <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} /> Provedor de IA
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTempSettings(prev => ({ ...prev, provider: p.id, model: MODELS[p.id][0] }))}
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

             {/* Model Selection (Input + Datalist for flexibility) */}
             <div>
                <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider block mb-2">Modelo Selecionado</label>
                <input 
                   list="model-options"
                   value={tempSettings.model}
                   onChange={(e) => setTempSettings(prev => ({ ...prev, model: e.target.value }))}
                   placeholder="Selecione ou digite um modelo..."
                   className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-4 text-[#e3e3e3] text-sm focus:border-[#a8c7fa] focus:outline-none font-mono placeholder-[#444746]"
                />
                <datalist id="model-options">
                   {MODELS[currentProvider]?.map(m => (
                       <option key={m} value={m} />
                   ))}
                </datalist>
                <p className="text-[10px] text-[#8e918f] mt-1 ml-1">
                   Você pode digitar um nome de modelo personalizado se ele não estiver na lista.
                </p>
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

             {/* Base URL (Optional) */}
             {(currentProvider === 'ollama' || currentProvider === 'openai') && (
                 <div>
                    <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider block mb-2">Endpoint URL (Opcional)</label>
                    <input 
                       type="text"
                       value={tempSettings.baseUrl || ''}
                       onChange={(e) => setTempSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                       placeholder={currentProvider === 'ollama' ? "http://localhost:11434/v1" : "https://api.openai.com/v1"}
                       className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-4 text-[#e3e3e3] text-sm focus:border-[#a8c7fa] focus:outline-none font-mono"
                    />
                 </div>
             )}
          </div>

          {/* Coluna Direita: Controles Avançados */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 pb-2 border-b border-[#444746] mb-4">
                 <Sliders size={18} className="text-[#a8c7fa]" />
                 <h3 className="text-sm font-bold text-[#e3e3e3]">Controles Avançados</h3>
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
                <p className="text-[10px] text-[#8e918f] mt-1">Valores altos = mais criatividade. Valores baixos = mais determinismo.</p>
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
                <p className="text-[10px] text-[#8e918f] mt-1">Apenas para modelos Gemini 2.5/3. Use 0 para desativar.</p>
             </div>

             {/* Safety Level */}
             <div className="bg-[#1e1f20] p-4 rounded-xl border border-[#444746]">
                <label className="text-xs font-bold text-[#8e918f] uppercase block mb-2 flex items-center gap-2"><Lock size={12}/> Nível de Segurança (Block Level)</label>
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