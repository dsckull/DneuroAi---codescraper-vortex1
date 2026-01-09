export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AnalysisConfig {
  thinkingBudget: number;
}

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'ollama';

export interface AppSettings {
  provider: LLMProvider;
  model: string;
  apiKeys: Record<LLMProvider, string>;
  baseUrl?: string; // Para Ollama ou endpoints compatíveis
  // Advanced Controls
  temperature: number;
  maxOutputTokens: number;
  thinkingBudget: number; // 0 para desativar
  safetyLevel: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
}

export type ViewMode = 'chat' | 'browser' | 'agent' | 'sandbox' | 'docs';

export type ThemeColor = 'rose' | 'blue';