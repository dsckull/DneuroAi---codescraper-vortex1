import { GoogleGenAI } from "@google/genai";
import { Message, AppSettings, LLMProvider } from '../types';

// --- HELPERS DE CONFIGURAÇÃO ---
const getSettings = (): AppSettings | null => {
  try {
    const saved = localStorage.getItem('codeScraper_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading settings:", e);
  }
  return null;
};

// --- CAMADA DE LIMPEZA ---
const cleanContentArtifacts = (content: string): string => {
  if (!content) return "";
  let clean = content;
  clean = clean.replace(/<svg[\s\S]*?<\/svg>/gi, "<!-- [SVG REMOVED] -->");
  clean = clean.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]{50,}/g, "[BASE64_IMAGE_REMOVED]");
  return clean;
};

const SYSTEM_INSTRUCTION_ANALYST = `
Você é o CodeScraper Vórtex, um Analista Sênior de Engenharia e Segurança Ofensiva.
DIRETRIZES:
1. Análise técnica profunda (Code Quality, Security, Logic).
2. Taint Analysis (Source -> Sink).
3. Classificação CVSS para vulnerabilidades.
4. Respostas em Markdown estruturado.
5. Sem floreios. Direto ao ponto.
`;

const SYSTEM_INSTRUCTION_GENERAL = `
Você é um assistente de IA útil e inteligente integrado à plataforma CodeScraper.
Se o usuário fornecer contexto de arquivos, use-o para responder perguntas.
Se não houver contexto, responda como um assistente geral amigável.
Mantenha respostas claras e concisas.
`;

// --- DRIVERS DE API ---

// 1. Google Gemini Driver (SDK)
const callGoogle = async (apiKey: string, model: string, prompt: string, system: string, settings: AppSettings) => {
  const ai = new GoogleGenAI({ apiKey });
  
  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: settings.safetyLevel },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: settings.safetyLevel },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: settings.safetyLevel },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: settings.safetyLevel },
  ];

  const config: any = {
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    systemInstruction: system,
    safetySettings: safetySettings
  };

  if (settings.thinkingBudget > 0 && (model.includes('gemini-2.5') || model.includes('gemini-3'))) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: config
  });
  return response.text || "Sem resposta.";
};

// 2. OpenAI Compatible Driver
const callOpenAICompatible = async (
  apiKey: string, 
  model: string, 
  prompt: string, 
  system: string, 
  settings: AppSettings,
  baseUrl: string = 'https://api.openai.com/v1'
) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxOutputTokens,
    })
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
        const err = await response.json();
        errorMessage = err.error?.message || errorMessage;
    } catch (e) {
        // Ignora erro de parse JSON se falhar
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sem resposta.";
};

// 3. Anthropic Driver
const callAnthropic = async (apiKey: string, model: string, prompt: string, system: string, settings: AppSettings) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-browser': 'true'
    },
    body: JSON.stringify({
      model: model,
      system: system,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature
    })
  });

  if (!response.ok) {
     let errorMessage = response.statusText;
     try {
        const err = await response.json();
        errorMessage = err.error?.message || errorMessage;
     } catch (e) {
        // Fallback
     }
     throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "Sem resposta.";
};

// --- MAIN DISPATCHER ---
export const analyzeContent = async (
  content: string | null,
  sourceName: string | null,
  prompt: string,
  messages: Message[],
  customSystemPrompt?: string
): Promise<string> => {
  const settings = getSettings();
  
  if (!settings) return "⚠️ Erro: Configurações não carregadas.";
  const { provider, model, apiKeys, baseUrl } = settings;
  const apiKey = apiKeys[provider];

  if (!apiKey && provider !== 'ollama') {
    return `⚠️ **Erro de Configuração:** API Key para ${provider.toUpperCase()} não encontrada.`;
  }

  try {
    let finalPrompt = "";
    const historyContext = messages.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n---\n');

    if (content && sourceName) {
        const cleanedContent = cleanContentArtifacts(content);
        finalPrompt = `
          [ALVO: ${sourceName}]
          === CONTEÚDO TÉCNICO ===
          ${cleanedContent.slice(0, 90000)}
          === FIM DO CONTEÚDO ===

          HISTÓRICO:
          ${historyContext}
          
          SOLICITAÇÃO:
          ${prompt}
        `;
    } else {
        finalPrompt = `
          HISTÓRICO:
          ${historyContext}
          
          SOLICITAÇÃO:
          ${prompt}
        `;
    }

    const systemInstructionToUse = customSystemPrompt || SYSTEM_INSTRUCTION_ANALYST;

    switch (provider) {
      case 'google':
        return await callGoogle(apiKey, model, finalPrompt, systemInstructionToUse, settings);
      case 'openai':
        return await callOpenAICompatible(apiKey, model, finalPrompt, systemInstructionToUse, settings, baseUrl);
      case 'groq':
        return await callOpenAICompatible(apiKey, model, finalPrompt, systemInstructionToUse, settings, 'https://api.groq.com/openai/v1');
      case 'ollama':
        return await callOpenAICompatible('ollama', model, finalPrompt, systemInstructionToUse, settings, baseUrl || 'http://localhost:11434/v1');
      case 'anthropic':
        return await callAnthropic(apiKey, model, finalPrompt, systemInstructionToUse, settings);
      default:
        return "Provedor desconhecido.";
    }
  } catch (error: any) {
    console.error("LLM Error:", error);
    return `❌ **Erro na API (${provider}):** ${error.message}`;
  }
};

export const queryGeneralChat = async (
    prompt: string,
    history: Message[],
    customSystemPrompt: string
): Promise<string> => {
    return analyzeContent(null, null, prompt, history, customSystemPrompt || SYSTEM_INSTRUCTION_GENERAL);
}

// --- AGENT FUNCTIONS ---
const internalLLMCall = async (prompt: string, jsonMode: boolean = false) => {
    const settings = getSettings();
    if (!settings) throw new Error("Settings missing");
    
    const { provider, model, apiKeys, baseUrl } = settings;
    const apiKey = apiKeys[provider];
    
    const agentSettings: AppSettings = {
        ...settings,
        temperature: 0.2,
        maxOutputTokens: 8192,
        thinkingBudget: 0
    };

    let system = "You are a backend logical processor. Output concise technical data.";
    if (jsonMode) system += " RESPONSE MUST BE VALID JSON.";

    switch (provider) {
      case 'google':
        return await callGoogle(apiKey, model, prompt, system, agentSettings);
      case 'openai':
      case 'groq':
      case 'ollama':
         const url = provider === 'groq' ? 'https://api.groq.com/openai/v1' : (baseUrl || (provider === 'ollama' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1'));
         return await callOpenAICompatible(apiKey || 'x', model, prompt, system, agentSettings, url);
      case 'anthropic':
         return await callAnthropic(apiKey, model, prompt, system, agentSettings);
      default:
         throw new Error("Provider not supported for agent");
    }
};

export const agentPlan = async (objective: string, context: string, mode: 'RED' | 'BLUE'): Promise<string> => {
    const prompt = `
    [AGENT ROLE: PLANNER]
    Mode: ${mode}
    Objective: "${objective}"
    Context: "${context.slice(0, 500)}..."
    Return JSON: { "strategy_analysis": string, "steps": [{ "id": string, "type": "recon"|"execution", "description": string }] }
    `;
    return (await internalLLMCall(prompt, true)) || "{}";
};

export const agentExecute = async (stepDescription: string, fullContext: string): Promise<string> => {
    const prompt = `[AGENT ROLE: EXECUTOR] Task: ${stepDescription}\nContext:\n${fullContext.slice(0, 20000)}`;
    return (await internalLLMCall(prompt)) || "Falha.";
};

export const agentReflect = async (objective: string, lastResult: string): Promise<string> => {
    const prompt = `[AGENT ROLE: CRITIC] Objective: ${objective}\nResult: ${lastResult}\nReturn JSON: { "status": "SUCCESS"|"RETRY", "critique": string }`;
    return (await internalLLMCall(prompt, true)) || "{}";
};

export const generatePayload = async (type: string, context: string, isBypassMode: boolean): Promise<string> => {
    const prompt = `[TASK: GENERATE PAYLOAD] Type: ${type} Context: ${context} Bypass: ${isBypassMode}. RETURN RAW CODE ONLY.`;
    return (await internalLLMCall(prompt)) || "";
};