import React, { useState } from 'react';
import { Book, Cpu, Shield, Globe, Terminal, Network, Code, FileText, ChevronRight, Layers, Box, Lock, Activity, AlertTriangle, Zap, BookOpen, GitBranch, Database, Fingerprint, Workflow } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

const DOCS_DATA: Record<string, DocSection[]> = {
  system: [
    {
      id: 'arch_kernel',
      title: 'Núcleo de Orquestração',
      icon: <Cpu size={18} />,
      content: `
# Arquitetura de Orquestração Neuro-Simbólica

O CodeScraper Vórtex opera sob um paradigma híbrido que funde **Processamento Determinístico** (React Runtime) com **Inferência Estocástica** (LLMs), criando um sistema de *Human-in-the-Loop* de baixa latência.

### 1. Camada de Estado & Reconciliação (The Fabric)
Diferente de ferramentas CLI stateless, o Vórtex mantém um grafo de estado persistente na memória do navegador (Heap), gerenciado via React Fiber.
*   **Gestão de Contexto (Context Window Management):** O sistema implementa uma estratégia de *Sliding Window* com *Token Pruning*. Conforme a auditoria avança, mensagens antigas são comprimidas ou descartadas para manter a densidade entrópica do prompt dentro do limite do modelo (ex: 1M tokens para Gemini 1.5 Pro).
*   **Hidratação de Estado:** O estado da aplicação (\`AppState\`) é serializado em \`localStorage\` para persistência entre sessões, permitindo a retomada de *threads* de execução complexas após falhas de I/O.

### 2. Pipeline de Inferência Assíncrona
A comunicação com o LLM não é uma chamada de API trivial; é um pipeline de transformação de tensores textuais.
1.  **Ingestão:** O input do usuário + Artefatos (Arquivos) sofrem *sanitização de injeção de prompt*.
2.  **Injeção de Metaprompt:** O sistema injeta dinamicamente instruções de sistema (\`SystemInstructions\`) baseadas no modo operacional (Red Team vs Blue Team), alterando os vetores de atenção do modelo para priorizar agressividade ou defensividade.
3.  **Streaming & Buffering:** A resposta é processada via *Server-Sent Events (SSE)* ou streams gRPC, permitindo que o frontend renderize o pensamento da IA (Chain-of-Thought) em tempo real, reduzindo a latência percebida (TTFB).

### 3. Segurança do Host (Isolation Layer)
O Vórtex opera sob a premissa de **Zero Trust** em relação ao código analisado.
*   **Sandbox de Renderização:** O \`BrowserInspector\` utiliza iframes com atributos \`sandbox="allow-scripts"\` restritivos, bloqueando o acesso ao DOM do *parent window*, Cookies e LocalStorage da aplicação principal.
*   **Isolamento de Execução:** O Python Sandbox roda em um *WebAssembly Linear Memory* isolado. Um \`segfault\` ou \`infinite loop\` no script do usuário trava apenas a thread do Worker, não a aplicação principal.
`
    },
    {
      id: 'browser_mechanics',
      title: 'Mecânica de Ingestão DOM',
      icon: <Globe size={18} />,
      content: `
# Mecânica de Ingestão de DOM & Bypass de CORS

A capacidade de analisar alvos web externos dentro de um ambiente cliente (Browser) enfrenta a barreira fundamental da **Same-Origin Policy (SOP)**. O Vórtex implementa um sistema de tunelamento multicamada para contornar essa restrição física.

### Nível 1: Proxy Tunneling (Header Rewriting)
Quando o modo "Extensão" não está disponível, o tráfego é roteado via proxies CORS (ex: \`allorigins\`).
*   **Fluxo de Dados:** \`Client -> Proxy -> Target -> Proxy (Inject Headers) -> Client\`.
*   **Manipulação de Headers:** O proxy intercepta a resposta HTTP do alvo e injeta o header \`Access-Control-Allow-Origin: *\`, enganando o motor do navegador do usuário para permitir a leitura do corpo da resposta.
*   **Limitação Termodinâmica:** Este método falha contra alvos que validam \`Cookies\` de sessão ou realizam *Fingerprinting* de TLS, pois o handshake TLS ocorre entre o Proxy e o Alvo, não entre o Cliente e o Alvo.

### Nível 2: Runtime Injection (Extension Bridge)
No modo privilegiado (Extensão), o Vórtex injeta código diretamente no contexto de execução da aba alvo (\`chrome.scripting\`).
*   **DOM Snapshotting:** Diferente de um \`curl\`, que baixa o HTML estático, o Vórtex captura o \`document.documentElement.outerHTML\` *após* a hidratação do Javascript da página (SPA Hydration). Isso permite ver o que o usuário vê, não o que o servidor enviou.
*   **Shadow DOM Piercing:** O extrator é capaz de atravessar fronteiras de *Shadow DOM* (comum em Web Components), expondo elementos encapsulados que scanners tradicionais ignoram.

### Análise Espectral de HTML (Smart Scraping)
O HTML bruto é ruidoso. O Vórtex aplica um algoritmo de *Denoising*:
1.  **Remoção de SVGs/Base64:** Imagens inline pesadas são substituídas por tokens \`[IMAGE_REMOVED]\` para economizar tokens do LLM.
2.  **Poda de Scripts:** Blocos \`<script>\` minificados (ex: Analytics, Trackers) são removidos se não contiverem palavras-chave de interesse (ex: \`api_key\`, \`token\`), aumentando a relação sinal-ruído para a IA.
`
    },
    {
      id: 'agent_topology',
      title: 'Topologia de Grafos (FSM)',
      icon: <Workflow size={18} />,
      content: `
# Topologia de Grafos Agênticos (FSM)

O Agente Autônomo do Vórtex não é um script linear, mas uma **Máquina de Estados Finitos (FSM) Probabilística**, modelada sobre a arquitetura de grafos direcionados (DAGs) cíclicos.

### Nós Funcionais (The Nodes)

#### 1. NÓ PLANNER (O Arquiteto)
*   **Input:** Espaço de problema (Objetivo) + Variáveis de Estado (Arquivo/Contexto).
*   **Algoritmo:** Decomposição Hierárquica de Tarefas (HTN). O Planner quebra objetivos abstratos ("Invadir admin") em primitivas executáveis ("Scan de portas", "Enumerar diretórios", "Gerar payload SQLi").
*   **Saída:** Um vetor ordenado de passos $S = [s_1, s_2, ..., s_n]$.

#### 2. NÓ EXECUTOR (O Operário)
*   **Função:** Transforma a intenção semântica de $s_i$ em ação sintática (Código ou Texto).
*   **Contexto Dinâmico:** O Executor não vê apenas o passo atual; ele recebe o *output* acumulado de $s_{i-1}$, permitindo encadeamento lógico (ex: Usar o token extraído no passo 1 para o header do passo 2).

#### 3. NÓ REFLECTOR (O Crítico)
*   **Input:** Resultado $R_i$ gerado pelo Executor.
*   **Função de Custo:** Avalia $R_i$ contra o objetivo de $s_i$.
*   **Bifurcação Lógica:**
    *   Se $Score(R_i) > Threshold$: Transição para $s_{i+1}$.
    *   Se $Score(R_i) < Threshold$: Retorno ao Executor com *Feedback Negativo* (Self-Correction Loop). O sistema tenta reescrever o código ou mudar a abordagem.

### Prevenção de Halting Problem
Para evitar loops infinitos (onde o Reflector rejeita eternamente o Executor), o grafo implementa um contador de "Budget de Tentativas". Se $Retries > Max$, o grafo colapsa aquele ramo e marca o passo como falha parcial, forçando uma re-estratégia ou aborto controlado.
`
    },
    {
      id: 'wasm_runtime',
      title: 'Runtime WASM Isolado',
      icon: <Box size={18} />,
      content: `
# Runtime Isolado WebAssembly (WASM)

O ambiente Python do Vórtex não roda em um servidor backend (Serverless/Docker); ele roda **localmente** no navegador do usuário, compilado para binário WebAssembly através do projeto Pyodide (baseado em Emscripten).

### Arquitetura de Memória Linear
*   **Heap Virtual:** O ambiente Python recebe um bloco contíguo de memória (ex: 2GB) alocado pelo navegador. Ponteiros de memória em CPython são traduzidos para índices neste array linear.
*   **Stack Protection:** Acesso fora deste bloco dispara um erro de limites de memória no motor JS (V8/SpiderMonkey), garantindo que um script malicioso não consiga ler a memória de outras abas ou do sistema operacional.

### Sistema de Arquivos Virtual (MEMFS)
O Python interage com um sistema de arquivos efêmero (\`/home/pyodide\`) que existe apenas na RAM.
*   **Operações de I/O:** Chamadas como \`open('file.txt', 'w')\` não tocam o disco rígido. Elas escrevem em estruturas de dados na memória.
*   **Persistência Zero:** Ao recarregar a página, o FS é destruído. Isso é uma *feature* de segurança para análise de malware, garantindo que artefatos perigosos não persistam.

### Foreign Function Interface (FFI)
O Pyodide fornece uma ponte bidirecional entre Python e Javascript.
*   **Python -> JS:** O script Python pode importar \`js\` e manipular o DOM ou usar \`fetch\` (limitado por CORS).
*   **JS -> Python:** O React pode injetar variáveis no escopo global do Python antes da execução.
*   **Limitação de Sockets:** Browsers não expõem sockets TCP/UDP brutos por segurança. Portanto, bibliotecas como \`socket\` ou \`nmap\` não funcionam nativamente, a menos que tuneladas via WebSockets (não implementado nesta versão).
`
    }
  ],
  knowledge: [
    {
      id: 'ast_analysis',
      title: 'Análise Estática (AST)',
      icon: <Code size={18} />,
      content: `
# Análise de Árvore de Sintaxe Abstrata (AST)

A detecção de vulnerabilidades via LLM no Vórtex simula uma análise de AST (Abstract Syntax Tree), mas enriquecida por compreensão semântica.

### Metodologia de Taint Analysis (Fluxo de Contaminação)
A premissa central é rastrear dados de uma **Fonte Não Confiável** até um **Sumidouro Sensível**.

1.  **Identificação de Sources (Fontes):**
    *   Variáveis de entrada: \`$_GET\`, \`req.body\`, \`process.argv\`, \`location.search\`.
    *   Leitura de arquivos/banco externos.

2.  **Identificação de Sinks (Sumidouros):**
    *   Execução de código: \`eval()\`, \`setTimeout(string)\`, \`exec()\`.
    *   Rendering DOM: \`innerHTML\`, \`v-html\`, \`dangerouslySetInnerHTML\`.
    *   Queries: \`mysql.query()\`, \`orm.find()\`.

3.  **Path Traversal & Sanitization Check:**
    O modelo analisa se, no caminho entre *Source* e *Sink*, existe uma função de sanitização (ex: \`DOMPurify.sanitize()\`, \`mysql.escape()\`, \`parseInt()\`).
    *   Se **Source -> Sink** (Sem sanitização) = **Vulnerabilidade Confirmada**.
    *   Se **Source -> Sanitizer -> Sink** = **Seguro**.

### Limitações Estocásticas
Diferente de analisadores determinísticos (como SonarQube), o LLM entende contextos complexos ("Este \`eval\` roda apenas no build time?"), mas sofre de alucinações se o código for muito fragmentado. A análise é probabilística, não absoluta.
`
    },
    {
      id: 'payload_theory',
      title: 'Teoria de Poliglotas',
      icon: <Zap size={18} />,
      content: `
# Teoria de Engenharia de Poliglotas

Poliglotas são sequências de bytes válidas em múltiplos formatos de arquivo simultaneamente. Eles exploram a **Ambiguidade de Gramática** entre diferentes parsers (interpretadores).

### Caso de Estudo: GIFAR (GIF + JAR/PHP)
Parsers de imagem (como \`gd\` ou navegadores) leem o cabeçalho (Magic Bytes) e ignoram o "lixo" no final. Parsers de execução (Java/PHP) podem buscar marcadores específicos em qualquer lugar do arquivo.

1.  **Header (Camada 1 - Imagem):**
    \`GIF89a\` (6 bytes). Define o arquivo como imagem. O navegador renderiza.
2.  **Payload (Camada 2 - Execução):**
    Logo após o header ou nos metadados EXIF/Comments, inserimos:
    \`<?php system($_GET['c']); ?>\`
3.  **Vetor de Ataque (LFI/RFI):**
    O upload passa como imagem (bypass de extensão/MIME). O atacante então força o servidor a incluir este arquivo como script PHP (via Local File Inclusion).

### Schizophrenic Files
Arquivos que mudam de tipo dependendo de como são lidos.
*   **HTML dentro de BMP:** O formato BMP ignora grandes blocos de bytes. É possível criar um BMP válido que também é um HTML válido contendo \`<script>\`. Se o servidor servir a imagem com \`Content-Type: text/html\` (configuração errada), o XSS executa.

### Context Breaking
A arte de escapar do contexto sintático atual.
*   **Contexto JS String:** \`var x = "INPUT";\` -> Payload: \`"; alert(1); //\`
*   **Contexto JSON:** Injeção de chaves duplicadas ou manipulação de tipos (Prototype Pollution) via \`__proto__\`.
`
    },
    {
      id: 'advanced_vectors',
      title: 'Vetores Não-Determinísticos',
      icon: <AlertTriangle size={18} />,
      content: `
# Vetores de Ataque Avançados (Non-Deterministic)

### 1. Deserialization Insecure (Exploração de Objetos)
Ocorre quando dados serializados (formato binário ou texto estruturado) são reconstituídos em objetos na memória sem validação de tipo.
*   **Gadget Chains:** O atacante cria um objeto serializado malicioso que, ao ser instanciado ("acordado"), dispara uma cadeia de métodos mágicos (ex: \`__wakeup()\`, \`__destruct()\`, \`readObject()\`) já existentes no código da aplicação, levando a RCE.
*   **Alvos:** Java (ObjectInputStream), PHP (unserialize), Python (pickle), Node.js (node-serialize).

### 2. Server-Side Template Injection (SSTI)
Injeção de diretivas de template engine em vez de código direto.
*   **Mecanismo:** O atacante insere sintaxe como \`{{ 7*7 }}\`. Se o servidor renderizar "49", há SSTI.
*   **Escalação:** Em Python (Jinja2/Flask), é possível escapar da sandbox do template e acessar classes globais:
    \`{{ ''.__class__.__mro__[1].__subclasses__() }}\` -> Acesso a \`subprocess.Popen\` -> RCE.

### 3. Race Conditions (Condição de Corrida)
Falhas lógicas que ocorrem apenas sob concorrência específica.
*   **Time-of-Check to Time-of-Use (TOCTOU):**
    1.  Sistema verifica se o usuário tem saldo (Check).
    2.  (Atacante inicia threads paralelas de saque).
    3.  Sistema deduz o saldo (Use).
    Se o passo 2 ocorrer entre 1 e 3 em múltiplas threads, o atacante saca mais do que possui antes que o saldo seja atualizado.
`
    }
  ]
};

export const DocumentationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'knowledge'>('system');
  const [selectedDocId, setSelectedDocId] = useState(DOCS_DATA['system'][0].id);

  const currentSection = DOCS_DATA[activeTab];
  const activeDoc = currentSection.find(d => d.id === selectedDocId) || currentSection[0];

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#1e1f20] text-[#e3e3e3] animate-fade-in font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 border-r border-[#444746] bg-[#1e1f20] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#444746]">
          <h2 className="text-xl font-bold text-[#e3e3e3] flex items-center gap-2 tracking-tight">
            <BookOpen className="text-[#a8c7fa]" size={24} />
            VÓRTEX KNOWLEDGE
          </h2>
          <p className="text-xs text-[#c4c7c5] mt-1 font-mono">Scientific Reference v3.0</p>
        </div>

        <div className="flex p-4 gap-2 border-b border-[#444746]">
             <button 
                onClick={() => { setActiveTab('system'); setSelectedDocId(DOCS_DATA['system'][0].id); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all border ${
                    activeTab === 'system' 
                    ? 'bg-[#004a77] text-[#c2e7ff] border-transparent' 
                    : 'text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#303030] border-[#444746]'
                }`}
             >
                SYSTEM ARCH
             </button>
             <button 
                onClick={() => { setActiveTab('knowledge'); setSelectedDocId(DOCS_DATA['knowledge'][0].id); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all border ${
                    activeTab === 'knowledge' 
                    ? 'bg-[#004a77] text-[#c2e7ff] border-transparent' 
                    : 'text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#303030] border-[#444746]'
                }`}
             >
                SEC THEORY
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {currentSection.map((doc) => (
                <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-[16px] text-sm transition-all group ${
                        selectedDocId === doc.id 
                        ? 'bg-[#303030] text-[#e3e3e3] font-bold shadow-inner border border-[#444746]' 
                        : 'text-[#c4c7c5] hover:bg-[#303030] hover:text-[#e3e3e3] border border-transparent'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${selectedDocId === doc.id ? 'bg-[#004a77] text-[#c2e7ff]' : 'text-[#8e918f] group-hover:text-[#e3e3e3]'}`}>
                            {doc.icon}
                        </div>
                        <span className="tracking-wide text-xs font-mono uppercase">{doc.title}</span>
                    </div>
                </button>
            ))}
        </div>
        
        <div className="p-4 border-t border-[#444746] bg-[#131314]">
            <div className="flex items-center gap-2 justify-center text-[10px] text-[#8e918f] font-mono">
                <Shield size={10} />
                <span>CLASSIFIED: LEVEL 4</span>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#131314] relative md:rounded-tl-[32px] border-l border-[#444746]/50 shadow-[inset_10px_10px_20px_rgba(0,0,0,0.2)]">
         <div className="max-w-4xl mx-auto p-8 md:p-16">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#8e918f] mb-8 font-mono uppercase tracking-widest">
                <span className="opacity-70">{activeTab === 'system' ? 'System Architecture' : 'Security Theory'}</span>
                <ChevronRight size={10} />
                <span className="text-[#a8c7fa] font-bold">{activeDoc.title}</span>
            </div>

            <div className="prose prose-invert prose-lg max-w-none prose-p:text-[#c4c7c5] prose-headings:text-[#e3e3e3] prose-strong:text-white prose-p:leading-loose">
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl font-black mb-10 pb-6 border-b border-[#444746] tracking-tight text-[#e3e3e3]" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold text-[#d0bcff] mt-12 mb-6 flex items-center gap-3 tracking-tight" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-black text-[#a8c7fa] mt-8 mb-4 uppercase tracking-widest border-l-2 border-[#a8c7fa] pl-3" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-sm font-bold text-[#e3e3e3] mt-6 mb-2" {...props} />,
                        code: ({node, inline, className, children, ...props}: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <div className="rounded-[12px] overflow-hidden border border-[#444746] my-8 shadow-2xl bg-[#0b0c0e]">
                                    <div className="bg-[#1e1f20] px-4 py-2 text-[10px] text-[#8e918f] border-b border-[#444746] font-mono flex justify-between items-center tracking-widest">
                                        <span>{match[1].toUpperCase()} SOURCE</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-[#444746]"></div>
                                            <div className="w-2 h-2 rounded-full bg-[#444746]"></div>
                                        </div>
                                    </div>
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code className="bg-[#303030] text-[#a8c7fa] px-1.5 py-0.5 rounded text-xs font-mono border border-[#444746]" {...props}>
                                    {children}
                                </code>
                            )
                        },
                        ul: ({node, ...props}) => <ul className="list-none space-y-3 text-[#c4c7c5] pl-0" {...props} />,
                        li: ({node, ...props}) => (
                            <li className="flex gap-3 items-start" {...props}>
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#444746] shrink-0" />
                                <span>{props.children}</span>
                            </li>
                        ),
                        blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-2 border-[#d0bcff] bg-[#d0bcff]/5 p-6 rounded-r-xl my-8 text-[#e3e3e3] text-sm font-mono" {...props} />
                        )
                    }}
                >
                    {activeDoc.content}
                </ReactMarkdown>
            </div>

            {/* Footer Navigation Hints */}
            <div className="mt-20 pt-10 border-t border-[#444746] flex justify-between text-xs font-mono">
                 <div className="text-[#8e918f]">
                     REF_ID: <span className="text-[#a8c7fa]">{activeDoc.id.toUpperCase()}</span>
                 </div>
                 <div className="text-[#8e918f]">
                     LAST_UPDATED: <span className="text-[#c4c7c5]">2024.Q4</span>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};