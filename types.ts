
export type ViewState = 'home' | 'learning' | 'quiz' | 'store';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface WordDetail {
  word: string;
  ipa_us: string;
  ipa_uk: string;
  part_of_speech: string;
  chinese_definition: string;
  etymology_or_mnemonic: string;
  example_sentence_en: string; // Blackpink themed
  example_sentence_cn: string;
  difficulty_level: DifficultyLevel;
}

export interface MistakeRecord {
  word: string;
  nextReview: number; // Timestamp in ms
  stage: number; // Ebbinghaus stage (0, 1, 2, 3...)
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  quizCount: number;
  errorCount: number;
}

export interface UserState {
  coins: number;
  inventory: string[]; // List of owned Item IDs
  mistakeBank: MistakeRecord[]; 
  dailyCoinsEarned: number;
  lastLoginDate: string;
  statsHistory: DailyStats[]; // New field for chart data
}

export interface StoreItem {
  id: string;
  name: string;
  category: 'Member' | 'Outfit' | 'Pet' | 'Merch' | 'Accessory';
  cost: number;
  imagePlaceholder: string; // URL or color code
}

// For Gemini Response
export interface GeminiWordResponse {
  ipa_us: string;
  ipa_uk: string;
  part_of_speech: string;
  chinese_definition: string;
  etymology_or_mnemonic: string;
  example_sentence_en: string;
  example_sentence_cn: string;
  difficulty_level: string;
}

// Cache for generated store images (ID -> Base64 string)
export type ImageCache = Record<string, string>;
