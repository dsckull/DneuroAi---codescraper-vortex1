import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, ShieldCheck, Activity, Wifi, Lock, Zap } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

const SYSTEM_LOGS = [
  { id: 'kernel', msg: 'INITIALIZING VÓRTEX KERNEL v4.0.1-alpha', type: 'info', delay: 200 },
  { id: 'bios', msg: 'READING SYSTEM BIOS... OK', type: 'info', delay: 100 },
  { id: 'cpu', msg: `DETECTED CPU THREADS: ${navigator.hardwareConcurrency || 4} CORES`, type: 'info', delay: 300 },
  { id: 'mem', msg: 'ALLOCATING LINEAR MEMORY (WASM HEAP)... 0x000000 -> 0xFFFFFF', type: 'process', delay: 500 },
  { id: 'mem_ok', msg: 'HEAP ALLOCATION SUCCESSFUL (2048MB)', type: 'success', delay: 100 },
  { id: 'react', msg: 'REHYDRATING REACT FIBER TREE...', type: 'process', delay: 400 },
  { id: 'fs', msg: 'MOUNTING VIRTUAL FILESYSTEM (/home/user)... RWX', type: 'info', delay: 300 },
  { id: 'dom', msg: 'INJECTING SHADOW DOM PIERCER HOOKS...', type: 'warning', delay: 400 },
  { id: 'cors', msg: 'ESTABLISHING CORS TUNNEL (PROXY: ALLORIGINS)...', type: 'process', delay: 600 },
  { id: 'cors_ok', msg: 'SECURE TUNNEL ESTABLISHED [TLS 1.3]', type: 'success', delay: 100 },
  { id: 'llm', msg: 'PINGING NEURAL ENGINE (GEMINI/OPENAI)...', type: 'process', delay: 500 },
  { id: 'llm_ok', msg: 'NEURAL UPLINK ACTIVE. LATENCY: <50ms', type: 'success', delay: 200 },
  { id: 'sec', msg: 'LOADING TAINT ANALYSIS MODULES...', type: 'process', delay: 400 },
  { id: 'sec_ok', msg: 'SECURITY SUB-SYSTEMS: GREEN', type: 'success', delay: 100 },
  { id: 'final', msg: 'SYSTEM READY. STARTING GUI...', type: 'info', delay: 800 }
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<{msg: string, type: string, timestamp: string}[]>([]);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    let mounted = true;

    const runSequence = async () => {
      while (currentIndex < SYSTEM_LOGS.length && mounted) {
        const log = SYSTEM_LOGS[currentIndex];
        
        // Randomize delay slightly for realism
        const actualDelay = log.delay + Math.random() * 150;
        await new Promise(r => setTimeout(r, actualDelay));

        if (!mounted) break;

        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.ms
        
        setLogs(prev => [...prev, {
            msg: log.msg,
            type: log.type,
            timestamp
        }]);

        setProgress(Math.round(((currentIndex + 1) / SYSTEM_LOGS.length) * 100));
        currentIndex++;

        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }

      if (mounted) {
        await new Promise(r => setTimeout(r, 500));
        onComplete();
      }
    };

    runSequence();

    return () => { mounted = false; };
  }, [onComplete]);

  const getColor = (type: string) => {
      switch(type) {
          case 'success': return 'text-[#6dd58c]';
          case 'warning': return 'text-[#ffd8b4]';
          case 'process': return 'text-[#a8c7fa]';
          default: return 'text-[#c4c7c5]';
      }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] text-[#e3e3e3] font-mono z-[100] flex flex-col p-4 md:p-10 cursor-wait">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-[#1e1f20] pb-4 mb-4">
            <div>
                <h1 className="text-2xl font-black tracking-tighter text-[#e3e3e3] mb-1">
                    VÓRTEX <span className="text-[#a8c7fa]">OS</span>
                </h1>
                <p className="text-[10px] text-[#8e918f]">KERNEL: 4.0.1-ALPHA | MEM: OK | SEC: HIGH</p>
            </div>
            <div className="text-right">
                <div className="text-4xl font-black text-[#303030]">{progress}%</div>
            </div>
        </div>

        {/* Main Terminal Output */}
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar space-y-1">
                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs md:text-sm">
                        <span className="text-[#444746] select-none">[{log.timestamp}]</span>
                        <span className={`${getColor(log.type)} font-bold tracking-wide`}>{log.msg}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>

        {/* Footer Grid */}
        <div className="h-32 border-t-2 border-[#1e1f20] mt-4 pt-4 grid grid-cols-4 gap-4">
            <div className="bg-[#0f172a] rounded p-2 flex flex-col justify-between border border-[#1e1f20]">
                 <Cpu size={16} className="text-[#a8c7fa]" />
                 <div className="text-[10px] text-[#8e918f]">CPU LOAD</div>
                 <div className="h-1 bg-[#1e1f20] w-full rounded-full overflow-hidden">
                     <div className="h-full bg-[#a8c7fa] animate-pulse" style={{ width: '45%' }}></div>
                 </div>
            </div>
            <div className="bg-[#0f172a] rounded p-2 flex flex-col justify-between border border-[#1e1f20]">
                 <Activity size={16} className="text-[#6dd58c]" />
                 <div className="text-[10px] text-[#8e918f]">MEMORY INTEGRITY</div>
                 <div className="text-xs font-bold text-[#6dd58c]">VERIFIED</div>
            </div>
            <div className="bg-[#0f172a] rounded p-2 flex flex-col justify-between border border-[#1e1f20]">
                 <Wifi size={16} className="text-[#d0bcff]" />
                 <div className="text-[10px] text-[#8e918f]">UPLINK STATUS</div>
                 <div className="text-xs font-bold text-[#d0bcff]">CONNECTED</div>
            </div>
            <div className="bg-[#0f172a] rounded p-2 flex flex-col justify-between border border-[#1e1f20]">
                 <ShieldCheck size={16} className="text-[#ffb4ab]" />
                 <div className="text-[10px] text-[#8e918f]">SECURITY LEVEL</div>
                 <div className="text-xs font-bold text-[#ffb4ab]">LEVEL 4</div>
            </div>
        </div>
    </div>
  );
};