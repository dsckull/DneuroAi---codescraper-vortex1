import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, AlertTriangle, Eraser, Download, Box } from 'lucide-react';

interface PythonSandboxProps {
  initialCode?: string;
  isAttackerMode: boolean;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export const PythonSandbox: React.FC<PythonSandboxProps> = ({ initialCode, isAttackerMode }) => {
  const [code, setCode] = useState(initialCode || "# Escreva seu script Python aqui\nprint('Iniciando Sandbox...')\nimport sys\nprint(sys.version)");
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);

  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initPyodide() {
      if (!window.loadPyodide) {
        setOutput(prev => [...prev, "Erro: Pyodide script não carregado."]);
        return;
      }
      
      try {
        const py = await window.loadPyodide();
        setPyodide(py);
        setIsReady(true);
        setOutput(prev => [...prev, "Ambiente Python pronto (WebAssembly)."]);
      } catch (err) {
        console.error(err);
        setOutput(prev => [...prev, "Falha ao inicializar o Pyodide."]);
      }
    }
    initPyodide();
  }, []);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const runCode = async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setOutput(prev => [...prev, `\n> Executando script...`]);

    try {
      // Redirecionar stdout
      pyodide.setStdout({ batched: (msg: string) => setOutput(prev => [...prev, msg]) });
      pyodide.setStderr({ batched: (msg: string) => setOutput(prev => [...prev, `Erro: ${msg}`]) });

      await pyodide.runPythonAsync(code);
      
    } catch (err: any) {
      setOutput(prev => [...prev, `Traceback:\n${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => setOutput([]);

  return (
    <div className="flex flex-col h-full bg-[#1e1f20] text-[#e3e3e3]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-[#1e1f20] border-b border-[#444746]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ffd8b4]/20 text-[#ffd8b4] rounded-xl">
             <Box size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#e3e3e3]">Python Sandbox</h2>
            <p className="text-xs text-[#c4c7c5]">WebAssembly Environment</p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={clearConsole}
                className="p-2 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#303030] rounded-full transition-colors"
                title="Limpar Console"
            >
                <Eraser size={20} />
            </button>
            <button 
                onClick={runCode}
                disabled={!isReady || isRunning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all ${
                    isReady && !isRunning 
                        ? 'bg-[#6dd58c] hover:bg-[#85e0a3] text-[#00391a] shadow-md' 
                        : 'bg-[#303030] text-[#8e918f] cursor-not-allowed'
                }`}
            >
                {isRunning ? <RotateCcw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                {isRunning ? 'RODANDO...' : 'EXECUTAR'}
            </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Code Editor */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-[#444746] bg-[#1e1f20]">
            <div className="text-xs font-bold text-[#8e918f] px-5 py-3 bg-[#1e1f20] flex justify-between items-center border-b border-[#444746]">
                <span className="font-mono">main.py</span>
                {isAttackerMode && <span className="text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Unrestricted</span>}
            </div>
            <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full bg-[#131314] text-[#e3e3e3] font-mono text-sm p-6 resize-none focus:outline-none custom-scrollbar leading-loose"
                spellCheck={false}
                placeholder="Escreva seu código Python aqui..."
            />
        </div>

        {/* Console Output */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#131314]">
             <div className="text-xs font-bold text-[#8e918f] px-5 py-3 bg-[#131314] border-b border-[#444746] flex items-center gap-2">
                <Terminal size={14} />
                <span>STDOUT / STDERR</span>
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto custom-scrollbar space-y-1.5">
                {!isReady && (
                    <div className="text-[#ffd8b4] animate-pulse">Initializing Pyodide Kernel...</div>
                )}
                {output.map((line, idx) => (
                    <div key={idx} className={`whitespace-pre-wrap break-words ${line.startsWith('Erro') || line.startsWith('Traceback') ? 'text-[#ffb4ab]' : line.startsWith('>') ? 'text-[#a8c7fa]' : 'text-[#c4c7c5]'}`}>
                        {line}
                    </div>
                ))}
                <div ref={outputEndRef} />
            </div>
        </div>

      </div>
    </div>
  );
};