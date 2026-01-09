import React, { useState } from 'react';
import { Terminal, Shield, Lock, ChevronRight, Hexagon, Activity } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulação de delay de rede
    setTimeout(() => {
      // Simulação simples: qualquer login funciona por enquanto
      if (email && password) {
        onLogin();
      } else {
        setError('Credenciais inválidas. (Dica: Preencha qualquer coisa para testar)');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Header Visual */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600"></div>
        
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center shadow-lg relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-xl group-hover:bg-blue-500/40 transition-all"></div>
                <Terminal size={32} className="text-white relative z-10" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2 font-mono">
                _<span className="text-blue-500">DnAi</span>&gt;_ 
                <span className="text-red-500 text-xs align-top font-sans ml-2">VÓRTEX</span>
            </h1>
            <p className="text-slate-400 text-sm">Acesso restrito a operadores autorizados.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Identificação</label>
              <div className="relative group">
                <Hexagon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@vortex.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Chave de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2 text-red-400 text-xs animate-fade-in">
                <Activity size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  INICIAR SESSÃO <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-600">
              <Shield size={10} className="inline mr-1" />
              Conexão segura via Vórtex Security Protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};