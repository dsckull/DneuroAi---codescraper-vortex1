import React, { useState } from 'react';
import { UploadCloud, FileCode, FileJson, FileText, X, Loader2, FileType, Link as LinkIcon, Globe } from 'lucide-react';
import { UploadedFile } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Handle potential ESM default export mismatch for pdfjs-dist
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface FileUploaderProps {
  onFileLoaded: (file: UploadedFile) => void;
  currentFile: UploadedFile | null;
  onClearFile: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, currentFile, onClearFile }) => {
  const [isReading, setIsReading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReading(true);

    try {
      let content = '';
      const fileType = file.name.toLowerCase();

      if (fileType.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }
          content = fullText;
        } catch (pdfError) {
          console.error(pdfError);
          alert("Erro ao ler PDF. Verifique se o arquivo é válido.");
          setIsReading(false);
          // Important: return here to stop processing
          return;
        }
      } else {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      }

      onFileLoaded({
        name: file.name,
        content: content,
        type: file.type || 'text/plain',
        size: file.size
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao ler arquivo.");
    } finally {
      setIsReading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setIsReading(true);
    
    let targetUrl = urlInput;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Falha no download');
        const text = await response.text();
        onFileLoaded({
            name: targetUrl,
            content: text,
            type: 'text/html',
            size: text.length
        });
    } catch (err) {
        alert("Erro ao acessar URL (CORS ou Bloqueio). Tente salvar o arquivo localmente.");
    } finally {
        setIsReading(false);
    }
  };

  const getIcon = (fileName: string) => {
    if (fileName.startsWith('http')) return <Globe className="w-6 h-6 text-[#6dd58c]" />;
    if (fileName.endsWith('.json')) return <FileJson className="w-6 h-6 text-[#ffd8b4]" />;
    if (fileName.endsWith('.pdf')) return <FileType className="w-6 h-6 text-[#ffb4ab]" />;
    return <FileCode className="w-6 h-6 text-[#a8c7fa]" />;
  };

  if (currentFile) {
    return (
      <div className="w-full bg-[#1e1f20] border border-[#444746] rounded-[20px] p-4 flex items-center justify-between mb-2 shadow-sm animate-fade-in group">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#303030] rounded-full">
            {getIcon(currentFile.name)}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-[#e3e3e3] font-medium truncate max-w-[200px] md:max-w-md text-sm">{currentFile.name}</h3>
            <p className="text-[#c4c7c5] text-xs font-mono">{(currentFile.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
        <button onClick={onClearFile} className="p-2 hover:bg-[#303030] rounded-full text-[#c4c7c5] hover:text-[#e3e3e3] transition-colors">
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      <div className="flex gap-2 mb-3">
         <button onClick={() => setUploadMode('file')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${uploadMode === 'file' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#8e918f] hover:text-[#c4c7c5]'}`}>Arquivo Local</button>
         <button onClick={() => setUploadMode('url')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${uploadMode === 'url' ? 'bg-[#303030] text-[#e3e3e3]' : 'text-[#8e918f] hover:text-[#c4c7c5]'}`}>URL / Link</button>
      </div>

      {uploadMode === 'file' ? (
        <label className={`flex flex-col items-center justify-center w-full h-32 border border-[#444746] border-dashed rounded-[20px] cursor-pointer bg-[#1e1f20] hover:bg-[#303030] hover:border-[#a8c7fa] transition-all group ${isReading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isReading ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 mb-2 text-[#a8c7fa] animate-spin" />
                    <p className="text-xs text-[#c4c7c5]">Lendo bits...</p>
                </div>
            ) : (
                <>
                <div className="p-3 bg-[#303030] rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-[#a8c7fa]" />
                </div>
                <p className="mb-1 text-sm text-[#e3e3e3] font-medium">Clique para enviar</p>
                <p className="text-xs text-[#8e918f]">PDF, TXT, JSON, CODE</p>
                </>
            )}
            </div>
            <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.xml,.yml,.yaml,.env" 
                onChange={handleFileChange} 
                disabled={isReading} 
            />
        </label>
      ) : (
        <div className="w-full bg-[#1e1f20] border border-[#444746] rounded-[20px] p-2 flex gap-2 shadow-sm focus-within:border-[#a8c7fa] transition-colors">
            <input 
                type="text" 
                placeholder="https://exemplo.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-transparent py-2 pl-4 text-[#e3e3e3] placeholder-[#8e918f] outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
            />
            <button onClick={handleUrlFetch} disabled={isReading || !urlInput} className="bg-[#303030] hover:bg-[#444746] text-[#e3e3e3] px-4 rounded-[16px] flex items-center justify-center transition-colors">
                {isReading ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16} />}
            </button>
        </div>
      )}
    </div>
  );
};