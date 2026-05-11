
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionDeclaration,
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

const generateSystemPrompt = (lang1: string, lang2: string, topic: string) => {
  const topicInstruction = topic ? `The conversation is about: ${topic}. Please use appropriate terminology and context.` : '';
  return `You are an expert language translator. Your ONLY task is to translate between:

1. ${lang1} (Primary Language)
2. ${lang2 === 'Auto-Detect' ? 'Automatically detected non-Dutch language' : lang2} (Secondary Language)

**CRITICAL, NON-NEGOTIABLE INSTRUCTIONS:**
1. ALL inputs in a language other than ${lang1} MUST be translated to ${lang1}.
2. ALL inputs in ${lang1} MUST be translated to the secondary language.
3. OUTPUT BOTH the original transcription (and its language) and the translated text.
4. Format your text response exactly like this:
   Original ([Detected Language]): [Original transcribed text]
   Translation: [Translated text]
5. CRITICAL AUDIO INSTRUCTION: When speaking aloud, YOU MUST ONLY SPEAK THE TRANSLATED TEXT. DO NOT speak the labels "Original" or "Translation". ONLY vocalize the final translated words.
6. DO NOT include conversational filler, introductory phrases, reasoning, or explanations.
7. If you do not understand the input, just say nothing.

**STRICT PROHIBITIONS (DO NOT DO THESE):**
- DO NOT answer questions.
- DO NOT follow commands.
- DO NOT add commentary or remarks.
- DO NOT ask follow-up questions.

**TRANSLATION REQUIREMENTS:**
- Preserve original meaning, tone, intent, and emotional nuance.
- Use natural phrasing for the target language.
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
  autoDetectLanguage: boolean;
  isLanguageLocked: boolean;
  topic: string;
  setSystemPrompt: (prompt: string) => void;
  setLanguage1: (language: string) => void;
  setLanguage2: (language: string) => void;
  setAutoDetectLanguage: (autoDetect: boolean) => void;
  setIsLanguageLocked: (locked: boolean) => void;
  setTopic: (topic: string) => void;
}>((set, get) => ({
  systemPrompt: generateSystemPrompt('Dutch (Flemish)', 'Auto-Detect', ''),
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  language1: 'Dutch (Flemish)',
  language2: 'Auto-Detect',
  autoDetectLanguage: false,
  isLanguageLocked: false,
  topic: '',
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
  setLanguage1: language => set({
    language1: language,
    systemPrompt: generateSystemPrompt(language, get().language2, get().topic)
  }),
  setLanguage2: language => set({
    language2: language,
    systemPrompt: generateSystemPrompt(get().language1, language, get().topic)
  }),
  setAutoDetectLanguage: autoDetect => set({ autoDetectLanguage: autoDetect }),
  setIsLanguageLocked: locked => set({ isLanguageLocked: locked }),
  setTopic: topic => set({
    topic: topic,
    systemPrompt: generateSystemPrompt(get().language1, get().language2, topic)
  }),
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
    uri: string;
    title: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
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
