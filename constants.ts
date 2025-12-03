
import { StoreItem } from "./types";

export const WORD_LIST = [
  "course", "suitcase", "include", "radio", "whoever", "value", "wound", "harvest", "tasty", "record",
  "minor", "exact", "sunset", "listening", "canyon", "elevator", "dangerous", "piano", "silent", "accept",
  "policy", "patient", "further", "system", "ignore", "sailor", "tutor", "beliefs", "bows", "whose",
  "meant", "waste", "grateful", "shampoo", "injury", "poet", "horizon", "autumn", "novel", "partial",
  "routine", "theme", "quote", "minute", "prevent", "rural", "prefer", "rescue", "gallon", "unite",
  "rapid", "private", "purse", "roam", "review", "faucet", "loaves", "pumpkins", "following", "safety",
  "cooperation", "educate", "grief", "reply", "persuade", "mute", "population", "entrance", "myth", "potatoes",
  "champion", "concern", "operate", "involve", "positive", "original", "muscle", "storage", "variety", "vary",
  "location", "radius", "mention", "liberty", "discussion", "edition", "interview", "yield", "curious", "element",
  "surrounded", "creative", "shelves", "headache", "numerator", "outline", "ancient", "earliest", "hanger", "lawyer",
  "suggestion", "disagreement", "selection", "skillful", "requirements", "cleanse", "physical", "musician", "purchase", "scientific",
  "museum", "fossil", "pressure", "forgetting", "regardless", "satisfy", "marriage", "passenger", "sword", "excitement",
  "visible", "familiar", "experience", "immediate", "personal", "mourn", "recycle", "employer", "strength", "sought",
  "capable", "percent", "invisible", "resources", "occur", "descendant", "distance", "wrinkle", "connection", "department",
  "captain", "curtain", "station", "exploded", "language", "consonant", "scent", "syllable", "chemical", "thoughtful",
  "whisper", "guide", "rhythm", "general", "practice", "sincerely", "decision", "necessary", "jewel", "shadow",
  "weird", "height", "bruise", "receive", "separate", "weight", "ought", "eighth", "disappoint", "though",
  "pleasant", "schedule", "island", "oxygen", "stomach", "wreck", "syrup", "jungle", "column", "mayor",
  "hoarse", "chocolate", "knives", "referred", "distributed", "rehearse", "strategy", "gesture", "principal", "ingredient",
  "plumber", "independence", "solar", "choir", "resident", "nationality", "recently", "conversation", "accidentally", "importance",
  "relieve", "multiple", "capacity", "creature", "negative", "intermission", "therefore", "rumor", "invitation", "mixture",
  "realize", "success", "predict", "struggle", "inquire", "ceiling", "emergency", "scarcely", "jealous", "luggage",
  "penguin", "violence", "remarkable", "thicken", "combination", "knowledge", "graduation", "strain", "instruction", "establish",
  "pollute", "shorten", "culture", "governor", "demonstrate", "encouragement", "trophies", "especially", "requirement", "enthusiasm",
  "intelligent", "persuasive", "celebration", "determination", "misunderstand", "unbelievable", "reconsider", "performance", "replacement", "capability",
  "independent", "expression", "operation", "confidence", "competition", "equipment", "organization", "construction", "concentration", "participation",
  "recognition", "announcement", "transportation", "recommendation", "explanation", "communication", "relationship", "refrigeration", "responsibility", "encyclopedia",
  "characteristic", "disastrous", "acquire", "freight", "appointment"
];

const MANUAL_EASY_WORDS = new Set(["course", "radio", "value", "tasty", "minor", "exact", "listening", "piano", "record", "sunset"]);

export const getDifficulty = (word: string): 'Easy' | 'Medium' | 'Hard' => {
  if (MANUAL_EASY_WORDS.has(word)) return 'Easy';
  
  const len = word.length;
  // Adjusted logic: <= 7 is Easy, <= 10 is Medium
  if (len <= 7) return 'Easy';
  if (len <= 10) return 'Medium';
  return 'Hard';
};

const CATEGORIES = ['Member', 'Outfit', 'Pet', 'Merch', 'Accessory'] as const;
const NAMES = ['Jisoo', 'Jennie', 'Rosé', 'Lisa'];

// Updated Pet names with owner prefix
const PET_NAMES = [
  "Jennie's Kuma", 
  "Jennie's Kai", 
  "Rosé's Hank", 
  "Jisoo's Dalgom", 
  "Lisa's Love", 
  "Lisa's Leo", 
  "Lisa's Luca", 
  "Lisa's Louis", 
  "Lisa's Lego", 
  "Lisa's Lily"
];

// Generate 200 Store Items Programmatically
export const STORE_ITEMS: StoreItem[] = Array.from({ length: 200 }, (_, i) => {
  const categoryIndex = i % 5;
  const category = CATEGORIES[categoryIndex];
  const nameIndex = i % 4;
  const memberName = NAMES[nameIndex];
  
  let itemName = "";
  let cost = 10;
  
  switch(category) {
    case 'Member':
      itemName = `Chibi ${memberName} Ver.${Math.floor(i/20) + 1}`;
      cost = 50;
      break;
    case 'Outfit':
      itemName = `${memberName}'s Stage Outfit #${Math.floor(i/10) + 1}`;
      cost = 30;
      break;
    case 'Pet':
      // Rotate through the specific pet list
      const petIndex = Math.floor(i / 5) % PET_NAMES.length;
      itemName = PET_NAMES[petIndex];
      cost = 40;
      break;
    case 'Merch':
      const merch = ['Lightstick', 'Photo Album', 'Hoodie', 'Tote Bag', 'Keyring', 'Poster', 'Calendar', 'Perfume'];
      itemName = `BP ${merch[i % merch.length]} (Ed. ${i})`;
      cost = 20;
      break;
    case 'Accessory':
      itemName = `${memberName}'s ${['Earrings', 'Necklace', 'Ring', 'Hat', 'Scarf'][i % 5]}`;
      cost = 15;
      break;
  }

  return {
    id: `item-${i}`,
    name: itemName,
    category,
    cost,
    imagePlaceholder: `https://picsum.photos/seed/${i + 500}/200/200`
  };
});
