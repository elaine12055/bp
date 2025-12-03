
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiWordResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use a cache in memory to avoid hitting API limits for the same word in one session
const memoryCache: Record<string, GeminiWordResponse> = {};

export async function fetchWordDetails(word: string, difficultyPreference: string = 'Medium'): Promise<GeminiWordResponse | null> {
  const cacheKey = `${word}_${difficultyPreference}`;
  
  // Check memory cache first
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  // Check LocalStorage cache
  const localKey = `blink_word_v2_${word}_${difficultyPreference}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    const parsed = JSON.parse(localData);
    memoryCache[cacheKey] = parsed;
    return parsed;
  }

  try {
    const prompt = `
      Create a learning card for the English word: "${word}" specifically for a Chinese speaker who is a fan of K-pop group Blackpink.
      
      Target Proficiency Level: ${difficultyPreference}.
      Tailor the definition complexity and example sentence sophistication to match this level (${difficultyPreference}).
      
      Requirements:
      1. Define part of speech and Traditional Chinese definition.
      2. Provide IPA phonetics for US and UK.
      3. Etymology: Explain root/suffix OR provide a fun mnemonic (keep this easy to understand).
      4. Example Sentence (English): MUST feature Blackpink (Jisoo, Jennie, Rosé, or Lisa), their songs, albums, or fictional scenarios involving them.
      5. Example Sentence (Chinese): Translate the Blackpink example.
      6. Difficulty: Explicitly state the difficulty of this word as '${difficultyPreference}' if possible, or its actual difficulty.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ipa_us: { type: Type.STRING },
            ipa_uk: { type: Type.STRING },
            part_of_speech: { type: Type.STRING },
            chinese_definition: { type: Type.STRING },
            etymology_or_mnemonic: { type: Type.STRING },
            example_sentence_en: { type: Type.STRING },
            example_sentence_cn: { type: Type.STRING },
            difficulty_level: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
          },
          required: ['ipa_us', 'ipa_uk', 'part_of_speech', 'chinese_definition', 'etymology_or_mnemonic', 'example_sentence_en', 'example_sentence_cn', 'difficulty_level']
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GeminiWordResponse;
      // Save to caches
      memoryCache[cacheKey] = data;
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return a dummy fallback if API fails so app doesn't crash
    return {
      ipa_us: "/.../",
      ipa_uk: "/.../",
      part_of_speech: "n/adj/v",
      chinese_definition: "暫時無法取得解釋",
      etymology_or_mnemonic: "Loading failed",
      example_sentence_en: `Blackpink loves the word ${word}.`,
      example_sentence_cn: `Blackpink 喜歡這個字 ${word}。`,
      difficulty_level: difficultyPreference
    };
  }
}

export async function generateStoreItemImage(itemName: string, category: string): Promise<string | null> {
  try {
    const prompt = `
      Draw a Chibi style (cute doll), 2D vector art illustration of: ${itemName}.
      Theme: Blackpink K-pop style, black and pink color palette.
      Style: Cute, sticker-like, white background, simple lines, kawaii.
      Category: ${category}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using flash-image for general generation as per instructions
      contents: prompt,
      config: {
        // No responseMimeType for image models usually, but we rely on default behavior returning image parts
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
}
