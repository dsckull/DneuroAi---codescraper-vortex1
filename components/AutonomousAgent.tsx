import React, { useState, useEffect, useRef } from 'react';
import { UploadedFile } from '../types';
import { agentPlan, agentExecute, agentReflect } from '../services/geminiService';
import { Play, Square, Terminal, Network, GitBranch, CheckCircle2, AlertOctagon, Activity, ChevronRight, BrainCircuit, ScanSearch, Database, Code, Fingerprint, Layers, RefreshCw, Copy, Check, Download, FileText, ClipboardType } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AutonomousAgentProps {
  file: UploadedFile | null;
  isAttackerMode: boolean;
}

// Estados do Grafo do Agente
type AgentState = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'REFLECTING' | 'FINISHED' | 'FAILED';

interface AgentStep {
  id: string;
  type: 'recon' | 'execution' | 'analysis';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  critique?: string;
}

// Sub-componente para exibir resultados com Copy/Download
const AgentResultBlock: React.FC<{ title: string, content: string }> = ({ title, content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent_result_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="my-4 animate-fade-in border border-[#444746] rounded-xl overflow-hidden bg-[#131314] shadow-sm w-full max-w-full">
            <div className="flex items-center justify-between px-3 py-2 bg-[#1e1f20] border-b border-[#444746]">
                <div className="flex items-center gap-2 text-[#a8c7fa] font-bold text-xs uppercase">
                    <Code size={14} /> {title}
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleCopy} 
                        className="p-1.5 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-white transition-colors"
                        title="Copiar Resultado"
                    >
                        {copied ? <Check size={14} className="text-[#6dd58c]" /> : <Copy size={14} />}
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="p-1.5 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-white transition-colors"
                        title="Baixar .txt"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>
            <div className="p-0">
                 <SyntaxHighlighter
                    language="markdown"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1rem', fontSize: '12px', background: 'transparent' }}
                    wrapLines={true}
                    wrapLongLines={true}
                >
                    {content}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export const AutonomousAgent: React.FC<AutonomousAgentProps> = ({ file, isAttackerMode }) => {
  const [objective, setObjective] = useState('');
  const [manualReport, setManualReport] = useState(''); // Novo estado para relatório manual
  const [agentState, setAgentState] = useState<AgentState>('IDLE');
  const [strategyAnalysis, setStrategyAnalysis] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<string[]>([]);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll apenas se estiver rodando
    if (agentState === 'EXECUTING') {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, steps, agentState]);

  const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Helper para combinar contextos
  const getFullContext = () => {
      return `
      === ARQUIVO CARREGADO ===
      Nome: ${file?.name || "Nenhum arquivo"}
      Conteúdo:
      ${file?.content || "(Vazio)"}
      
      --------------------------------------------------

      === RELATÓRIO MANUAL / CONTEXTO ADICIONAL ===
      ${manualReport || "(Nenhum relatório fornecido)"}
      `;
  };

  const startGraph = async () => {
    if ((!file && !manualReport) && !objective) return;
    setAgentState('PLANNING');
    setSteps([]);
    setLogs([]);
    setStrategyAnalysis('');
    setCurrentStepIndex(-1);
    addLog("Inicializando Grafo Vórtex ΣX~...");

    try {
        // --- NÓ 1: PLANNER ---
        addLog("NÓ ATIVO: PLANNER (Gerando estratégia com base no contexto...)");
        
        const fullContext = getFullContext();
        const planJsonStr = await agentPlan(objective, fullContext, isAttackerMode ? 'RED' : 'BLUE');
        
        let planData;
        try {
            planData = JSON.parse(planJsonStr);
        } catch (e) {
            // Fallback parsing se o JSON vier sujo
            const match = planJsonStr.match(/\{[\s\S]*\}/);
            planData = match ? JSON.parse(match[0]) : { steps: [] };
        }

        setStrategyAnalysis(planData.strategy_analysis || "Estratégia definida.");
        const initialSteps = planData.steps?.map((s: any) => ({ ...s, status: 'pending' })) || [];
        
        if (initialSteps.length === 0) {
            throw new Error("Agente não conseguiu gerar passos válidos.");
        }

        setSteps(initialSteps);
        addLog(`Plano gerado com ${initialSteps.length} nós de execução.`);
        
        // Iniciar Execução do Grafo
        setAgentState('EXECUTING');
        setCurrentStepIndex(0);

    } catch (e: any) {
        addLog(`ERRO FATAL NO PLANEJAMENTO: ${e.message}`);
        setAgentState('FAILED');
    }
  };

  // Effect para gerenciar o loop de execução do grafo (State Machine Loop)
  useEffect(() => {
      if (agentState === 'EXECUTING' && currentStepIndex >= 0 && currentStepIndex < steps.length) {
          executeCurrentStep();
      } else if (agentState === 'EXECUTING' && currentStepIndex >= steps.length) {
          setAgentState('FINISHED');
          addLog("Grafo finalizado com sucesso.");
      }
  }, [agentState, currentStepIndex]);

  const executeCurrentStep = async () => {
      const step = steps[currentStepIndex];
      
      // Update step status to running
      setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'running' } : s));
      addLog(`NÓ ATIVO: EXECUTOR [${step.type.toUpperCase()}] -> ${step.description}`);

      try {
          // --- NÓ 2: EXECUTOR ---
          const fullContext = getFullContext();
          const result = await agentExecute(step.description, fullContext);
          
          // --- NÓ 3: REFLECTOR (Self-Correction) ---
          addLog("NÓ ATIVO: REFLECTOR (Validando resultado...)");
          const reflectionJsonStr = await agentReflect(step.description, result);
          let reflection;
          try {
             reflection = JSON.parse(reflectionJsonStr);
          } catch(e) {
             reflection = { status: 'SUCCESS', critique: 'Auto-reflexão falhou no parse.' };
          }

          const status = reflection.status === 'SUCCESS' ? 'completed' : 'completed'; // For MVP, we proceed even if correction needed, but log it.
          
          setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { 
              ...s, 
              status, 
              result,
              critique: reflection.critique
          } : s));

          addLog(`Reflexão: ${reflection.critique}`);
          
          // Move to next step
          setCurrentStepIndex(prev => prev + 1);

      } catch (e: any) {
          setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'failed', result: `Erro: ${e.message}` } : s));
          addLog(`Erro na execução do passo: ${e.message}`);
          setAgentState('FAILED');
      }
  };

  const stopGraph = () => {
      setAgentState('IDLE');
      addLog("Interrupção manual do grafo.");
  };

  const downloadReport = () => {
      const timestamp = new Date().toLocaleString();
      let mdContent = `# Relatório de Execução do Agente - CodeScraper AI\n`;
      mdContent += `**Data:** ${timestamp}\n`;
      mdContent += `**Objetivo:** ${objective}\n`;
      mdContent += `**Arquivo Analisado:** ${file?.name || 'N/A'}\n`;
      mdContent += `**Relatório Manual Inserido:** ${manualReport ? 'Sim' : 'Não'}\n`;
      mdContent += `**Estratégia Definida:** ${strategyAnalysis}\n\n`;
      
      mdContent += `## 🕒 Timeline de Eventos\n`;
      logs.forEach(log => {
          mdContent += `- ${log}\n`;
      });
      
      mdContent += `\n## 📋 Detalhamento da Execução\n`;
      steps.forEach((step, i) => {
          mdContent += `### Passo ${i+1}: ${step.type.toUpperCase()}\n`;
          mdContent += `**Descrição:** ${step.description}\n`;
          mdContent += `**Status:** ${step.status}\n`;
          if (step.result) {
              mdContent += `\n**Resultado Técnico:**\n\`\`\`\n${step.result}\n\`\`\`\n`;
          }
          if (step.critique) {
              mdContent += `\n> **Reflexão do Agente:** ${step.critique}\n`;
          }
          mdContent += `\n---\n`;
      });
      
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agent_Relatorio_${isAttackerMode ? 'RED' : 'BLUE'}_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleTemplateObjective = (type: string) => {
      let text = "";
      switch(type) {
          case 'full_pentest': text = "Realize um Teste de Intrusão completo (White Box). Mapeie todas as entradas, verifique SQLi, XSS, RCE e falhas de lógica."; break;
          case 'sqli_scan': text = "Faça uma varredura profunda focada APENAS em SQL Injection. Analise queries de banco e concatenações."; break;
          case 'code_audit': text = "Faça uma auditoria de qualidade (Blue Team). Verifique boas práticas, complexidade e possíveis bugs."; break;
      }
      setObjective(text);
  };

  return (
    <div className={`flex flex-col h-full ${isAttackerMode ? 'bg-[#131314]' : 'bg-[#131314]'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-[#444746] bg-[#1e1f20] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isAttackerMode ? 'bg-red-500/10 text-red-500' : 'bg-[#004a77] text-[#c2e7ff]'}`}>
                    <Network size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold font-sans tracking-tight text-[#e3e3e3] flex items-center gap-2">
                        AGENT GRAPH <span className="text-[10px] bg-[#303030] px-2 py-0.5 rounded-full text-[#c4c7c5]">LANG-GRAPH</span>
                    </h2>
                    <p className="text-xs text-[#8e918f] font-mono">
                        STATUS: <span className={agentState === 'EXECUTING' ? 'text-green-400 animate-pulse' : 'text-[#c4c7c5]'}>{agentState}</span>
                    </p>
                </div>
            </div>
            {agentState === 'EXECUTING' && <Activity className="text-green-500 animate-spin" size={20} />}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left: Configuration & Graph Visualizer */}
            <div className="w-full md:w-1/3 border-r border-[#444746] bg-[#1e1f20] p-5 flex flex-col h-full overflow-hidden">
                
                {/* Input Section */}
                <div className="mb-4 shrink-0 overflow-y-auto custom-scrollbar max-h-[50%]">
                    <label className="text-xs font-bold text-[#c4c7c5] uppercase mb-2 block tracking-wider">Definir Objetivo do Grafo</label>
                    <textarea 
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        disabled={agentState !== 'IDLE' && agentState !== 'FINISHED' && agentState !== 'FAILED'}
                        className={`w-full h-24 bg-[#131314] border rounded-2xl p-4 text-sm font-sans focus:outline-none resize-none mb-3 transition-colors ${isAttackerMode ? 'border-red-900/50 focus:border-red-500 text-[#e3e3e3]' : 'border-[#444746] focus:border-[#a8c7fa] text-[#e3e3e3]'}`}
                        placeholder="Descreva a missão complexa para o agente..."
                    />

                    {/* Novo Campo: Relatório Manual */}
                    <label className="text-xs font-bold text-[#c4c7c5] uppercase mb-2 flex items-center gap-2 tracking-wider mt-4">
                        <ClipboardType size={12} /> Contexto Adicional
                    </label>
                    <textarea 
                        value={manualReport}
                        onChange={(e) => setManualReport(e.target.value)}
                        disabled={agentState !== 'IDLE' && agentState !== 'FINISHED' && agentState !== 'FAILED'}
                        className={`w-full h-20 bg-[#131314] border border-[#444746] rounded-2xl p-4 text-xs font-mono focus:outline-none resize-none mb-3 placeholder-[#8e918f] focus:border-[#8e918f] text-[#c4c7c5]`}
                        placeholder="Logs de erro, relatórios anteriores..."
                    />
                    
                    {(agentState === 'IDLE' || agentState === 'FINISHED' || agentState === 'FAILED') ? (
                        <div className="space-y-3 mt-4">
                             <div className="flex gap-2">
                                <button onClick={() => handleTemplateObjective('full_pentest')} className="flex-1 py-2 bg-[#303030] hover:bg-[#444746] border border-[#444746] rounded-full text-xs font-bold text-[#c4c7c5] transition-colors">Pentest</button>
                                <button onClick={() => handleTemplateObjective('sqli_scan')} className="flex-1 py-2 bg-[#303030] hover:bg-[#444746] border border-[#444746] rounded-full text-xs font-bold text-[#c4c7c5] transition-colors">SQLi</button>
                                <button onClick={() => handleTemplateObjective('code_audit')} className="flex-1 py-2 bg-[#303030] hover:bg-[#444746] border border-[#444746] rounded-full text-xs font-bold text-[#c4c7c5] transition-colors">Audit</button>
                             </div>
                             <button 
                                onClick={startGraph}
                                disabled={!objective.trim()}
                                className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                                    isAttackerMode 
                                    ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                                    : 'bg-[#a8c7fa] text-[#001d35] hover:bg-[#8ab4f8] shadow-lg'
                                }`}
                            >
                                <Play size={16} fill="currentColor" /> INICIAR GRAFO
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={stopGraph}
                            className="w-full py-3 rounded-full font-bold bg-[#303030] hover:bg-red-900/30 text-red-400 border border-red-900/50 flex items-center justify-center gap-2 transition-all text-sm mt-4"
                        >
                            <Square size={16} fill="currentColor" /> PARAR AGENTE
                        </button>
                    )}
                </div>

                {/* Graph Visualization (Nodes) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-[#444746] pt-4">
                    <h3 className="text-xs font-bold text-[#8e918f] uppercase mb-4 flex items-center gap-2">
                        <GitBranch size={14} /> Execution Flow
                    </h3>
                    
                    {strategyAnalysis && (
                        <div className="mb-4 p-4 bg-[#303030] rounded-xl text-xs text-[#c4c7c5] italic leading-relaxed">
                            "{strategyAnalysis}"
                        </div>
                    )}

                    <div className="space-y-6 relative pl-2">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#444746] z-0"></div>

                        {steps.map((step, idx) => (
                            <div key={idx} className={`relative z-10 pl-10 transition-all ${step.status === 'running' ? 'scale-105' : ''}`}>
                                {/* Node Dot */}
                                <div className={`absolute left-1 top-0 w-8 h-8 rounded-full border-4 flex items-center justify-center bg-[#1e1f20] ${
                                    step.status === 'completed' ? 'border-[#6dd58c] text-[#6dd58c]' :
                                    step.status === 'running' ? 'border-[#a8c7fa] text-[#a8c7fa] animate-pulse' :
                                    step.status === 'failed' ? 'border-red-500 text-red-500' :
                                    'border-[#444746] text-[#8e918f]'
                                }`}>
                                    <Layers size={14} />
                                </div>
                                
                                <div className={`p-4 rounded-2xl border shadow-sm ${
                                    step.status === 'running' ? 'bg-[#303030] border-[#a8c7fa]/50' : 'bg-[#131314] border-[#444746]'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase text-[#8e918f] tracking-wider">{step.type}</span>
                                        {step.status === 'completed' && <CheckCircle2 size={14} className="text-[#6dd58c]"/>}
                                    </div>
                                    <p className="text-sm font-medium text-[#e3e3e3] leading-snug">{step.description}</p>
                                    {step.critique && (
                                        <div className="mt-3 pt-3 border-t border-[#444746] text-[10px] text-[#ffb4ab]">
                                            <span className="font-bold">CRITIC:</span> {step.critique}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Output Terminal */}
            <div className="w-full md:w-2/3 bg-[#131314] flex flex-col relative font-mono text-sm h-full overflow-hidden">
                 
                 {/* Terminal Header */}
                 <div className="flex items-center justify-between p-3 bg-[#1e1f20] border-b border-[#444746] z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-[#a8c7fa]" />
                        <span className="text-xs text-[#c4c7c5] font-bold">LOG OUTPUT</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {logs.length > 0 && (
                            <button 
                                onClick={downloadReport} 
                                className="flex items-center gap-1.5 text-[10px] bg-[#303030] hover:bg-[#444746] px-3 py-1.5 rounded-full text-[#e3e3e3] transition-colors font-sans font-bold"
                            >
                                <FileText size={12} /> Export Report
                            </button>
                        )}
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ffb4ab]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffd8b4]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#6dd58c]"></div>
                        </div>
                    </div>
                 </div>

                 {/* Logs Area with Explicit Scroll */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 relative z-0">
                    {logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-[#c4c7c5]">
                            <BrainCircuit size={64} className="mb-4" />
                            <p className="text-xs font-sans tracking-widest">AWAITING NEURAL LINK...</p>
                        </div>
                    )}
                    
                    {logs.map((log, idx) => (
                        <div key={idx} className="text-[#c4c7c5] text-xs border-l-2 border-[#444746] pl-3 py-1 hover:bg-[#1e1f20] font-mono break-all whitespace-pre-wrap transition-colors">
                            {log}
                        </div>
                    ))}
                    
                    {/* Render Results of Completed Steps Inline with Copy Buttons */}
                    {steps.map((step, idx) => step.result && (
                        <AgentResultBlock 
                            key={`res-${idx}`} 
                            title={`OUTPUT: ${step.type.toUpperCase()}`} 
                            content={step.result} 
                        />
                    ))}

                    <div ref={logsEndRef} className="h-4" />
                 </div>
            </div>

        </div>
    </div>
  );
};