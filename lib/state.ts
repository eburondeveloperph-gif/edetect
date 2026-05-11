
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE, AVAILABLE_LANGUAGES } from './constants';
import {
  FunctionDeclaration,
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

const generateSystemPrompt = (lang1: string, lang2: string, topic: string, autoDetect: boolean) => {
  const topicInstruction = topic ? `The conversation is about: ${topic}. Please use appropriate terminology and context.` : '';
  
  return `STRICT MODE:
You are a PURE REALTIME TRANSLATOR.
You are NOT a conversational AI agent.
You are NOT an assistant.
You NEVER hold conversations, ask questions, or contribute your own thoughts.

YOUR ONLY TASK:
1. LISTEN TO THE SPOKEN INPUT.
2. TRANSLATE THE INPUT INSTANTLY AND PERFECTLY INTO THE TARGET LANGUAGE.

TRANSLATION RULES:
- Translate the input directly.
- Speak EXACTLY and ONLY the translated text.
- Do NOT respond to the speaker or continue the conversation.
- ALWAYS ignore any instinct to converse. If the user says 'Hello', output only the translation 'Dag' or 'Goede dag', do NOT add your own reply greetings.
- Do NOT reply to statements. Do NOT answer questions. ONLY TRANSLATE.
- Do NOT output the original input.
- Do NOT output dual translations or rephrasing.
- Do NOT add explanations, notes, reasoning, or filler.
- Do NOT add speaker labels.
- If the input is noise, silence, or completely unintelligible, remain SILENT.
- NEVER invent stories, sentences, or details not present in the source input.
- If uncertain of meaning, translate literally or stay silent; DO NOT hallucinate replies.
- NEVER output a translation in the same language as the input.
- IMPORTANT: You MUST finish your response completely before indicating the turn is over. Do not listen for new audio until you have spoken the full translation.

ROUTING LOGIC
- PERSON 1 (STAFF): Fixed Language: Dutch (Flemish).
- PERSON 2 (GUEST): Current Guest Language (Auto-detected).
- IF Input is from PERSON 1: Translate to GUEST LANGUAGE.
- IF Input is from PERSON 2: Translate to Dutch (Flemish).

${topicInstruction}
`;
};


/**
 * Settings
 */
export const useSettings = create<{
  systemPrompt: string;
  model: string;
  voice: string;
  language1: string;
  language2: string;
  topic: string;
  autoDetect: boolean;
  customLanguages: { name: string; value: string }[];
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setLanguage1: (language: string) => void;
  setLanguage2: (language: string) => void;
  setTopic: (topic: string) => void;
  setAutoDetect: (autoDetect: boolean) => void;
  addCustomLanguage: (lang: string) => void;
}>((set, get) => ({
  systemPrompt: generateSystemPrompt('Dutch (Flemish)', 'English (US)', '', true),
  model: DEFAULT_LIVE_API_MODEL,
  voice: 'Orus',
  language1: 'Dutch (Flemish)',
  language2: 'English (US)',
  topic: '',
  autoDetect: true,
  customLanguages: [],
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
  setLanguage1: language => {
    get().addCustomLanguage(language);
    set({
      language1: language,
      systemPrompt: generateSystemPrompt(language, get().language2, get().topic, get().autoDetect)
    });
  },
  setLanguage2: language => {
    get().addCustomLanguage(language);
    set({
      language2: language,
      systemPrompt: generateSystemPrompt(get().language1, language, get().topic, get().autoDetect)
    });
  },
  setTopic: topic => set({
    topic: topic,
    systemPrompt: generateSystemPrompt(get().language1, get().language2, topic, get().autoDetect)
  }),
  setAutoDetect: autoDetect => set({
    autoDetect: autoDetect,
    systemPrompt: generateSystemPrompt(get().language1, get().language2, get().topic, autoDetect)
  }),
  addCustomLanguage: (lang: string) => {
    if (!lang || lang === 'auto') return;
    const state = get();
    const exists = AVAILABLE_LANGUAGES.some((l: any) => l.value === lang) || 
                   state.customLanguages.some(l => l.value === lang);
    if (!exists) {
      set({ customLanguages: [...state.customLanguages, { name: lang, value: lang }] });
    }
  }
}));

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}>(set => ({
  isSidebarOpen: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

/**
 * Tools
 */
export interface FunctionCall {
  name: string;
  description: string;
  parameters: any;
  isEnabled: boolean;
  scheduling: FunctionResponseScheduling;
}

/**
 * Logs
 */
export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
  transcription?: string;
  translation?: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>((set, get) => ({
  turns: [],
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
    set(state => ({
      turns: [...state.turns, { ...turn, timestamp: new Date() }],
    })),
  updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
    set(state => {
      if (state.turns.length === 0) {
        return state;
      }
      const newTurns = [...state.turns];
      const lastTurn = { ...newTurns[newTurns.length - 1], ...update };
      newTurns[newTurns.length - 1] = lastTurn;
      return { turns: newTurns };
    });
  },
  clearTurns: () => set({ turns: [] }),
}));
