import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X } from 'lucide-react';

interface CodePreviewProps {
  content: string;
  fileName: string;
  onClose: () => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ content, fileName, onClose }) => {
  const getLanguage = (name: string) => {
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
    if (name.endsWith('.py')) return 'python';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.md')) return 'markdown';
    return 'text';
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1f20] border-r border-[#444746]">
      <div className="p-3 border-b border-[#444746] bg-[#1e1f20] flex justify-between items-center sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-mono text-[#c4c7c5] uppercase truncate">PREVIEW: {fileName}</span>
            <span className="text-[10px] text-[#8e918f] bg-[#303030] px-2 py-0.5 rounded-full shrink-0">{getLanguage(fileName)}</span>
        </div>
        <button 
            onClick={onClose}
            className="p-1 hover:bg-[#303030] text-[#c4c7c5] hover:text-white rounded-full transition-colors"
            title="Fechar Visualização"
        >
            <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <SyntaxHighlighter
          language={getLanguage(fileName)}
          style={vscDarkPlus}
          showLineNumbers={true}
          customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', lineHeight: '1.5', background: 'transparent' }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};