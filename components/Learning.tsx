
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WORD_LIST, getDifficulty } from '../constants';
import { fetchWordDetails } from '../services/geminiService';
import { GeminiWordResponse } from '../types';
import { Volume2, ChevronLeft, ChevronRight, Search, Loader2, X } from 'lucide-react';

export const Learning: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<GeminiWordResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState("");

  // Filter the global word list based on difficulty AND search query
  const filteredList = useMemo(() => {
    return WORD_LIST.map((word, idx) => ({
      word,
      globalIndex: idx + 1,
      level: getDifficulty(word)
    })).filter(item => {
      const matchesLevel = filterLevel === 'All' || item.level === filterLevel;
      const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [filterLevel, searchQuery]);

  // Reset index when filter/search changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filterLevel, searchQuery]);

  const currentItem = filteredList[currentIndex];
  // Lookahead items for pre-fetching
  const nextItem1 = filteredList[currentIndex + 1];
  const nextItem2 = filteredList[currentIndex + 2];

  // Fetch Current Word Data
  useEffect(() => {
    if (!currentItem) return;
    
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      // Optimistic update: Do NOT clear old data immediately if simply moving forward/back to reduce flicker.
      setData(null); 
      
      const result = await fetchWordDetails(currentItem.word, currentItem.level);
      if (isMounted && result) {
        setData(result);
      }
      if (isMounted) setLoading(false);
    };
    loadData();
    return () => { isMounted = false; };
  }, [currentItem]);

  // Aggressive Pre-fetching (Next 2 words)
  useEffect(() => {
    if (!loading) {
      if (nextItem1) fetchWordDetails(nextItem1.word, nextItem1.level);
      if (nextItem2) fetchWordDetails(nextItem2.word, nextItem2.level);
    }
  }, [nextItem1, nextItem2, loading]);

  const playAudio = (text: string, lang: 'en-US' | 'en-GB') => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (currentIndex < filteredList.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGlobalId = parseInt(jumpInput);
    if (isNaN(targetGlobalId)) return;

    const foundIndex = filteredList.findIndex(item => item.globalIndex === targetGlobalId);
    
    if (foundIndex !== -1) {
      setCurrentIndex(foundIndex);
      setJumpInput("");
    } else {
      alert(`Word #${targetGlobalId} is not in the current list.`);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch(level) {
      case 'Easy': return 'text-green-400 border-green-400';
      case 'Hard': return 'text-red-400 border-red-400';
      default: return 'text-yellow-400 border-yellow-400';
    }
  };

  const cleanIPA = (ipa: string) => {
    return ipa.replace(/\//g, '');
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative z-20">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-gray-500 font-mono text-xs whitespace-nowrap">
            {filteredList.length > 0 ? currentIndex + 1 : 0} / {filteredList.length}
            </span>

            {/* Search Bar */}
            <div className="relative flex-1 sm:w-48 group">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-bp-pink" />
              <input 
                type="text" 
                placeholder="Find word..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-full pl-8 pr-8 py-1.5 text-xs text-white focus:border-bp-pink outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
        </div>

        {/* Top Right Dropdown for Level */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
           <span className="text-gray-400 text-xs font-bold uppercase hidden sm:inline">Level</span>
           <select 
             value={filterLevel}
             onChange={(e) => setFilterLevel(e.target.value as any)}
             className="bg-gray-900 text-bp-pink border border-bp-pink rounded-md px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-bp-pink cursor-pointer"
           >
             <option value="All">All Levels</option>
             <option value="Easy">Easy</option>
             <option value="Medium">Medium</option>
             <option value="Hard">Hard</option>
           </select>
        </div>
      </div>

      {!currentItem ? (
        <div className="text-center pt-20 text-gray-400 flex flex-col items-center gap-2">
            <Search size={40} className="opacity-20" />
            <p>No words found for "{searchQuery}"</p>
            <button 
              onClick={() => {setSearchQuery(""); setFilterLevel("All");}}
              className="text-bp-pink text-sm hover:underline"
            >
              Clear filters
            </button>
        </div>
      ) : (
      <>
        {/* Main Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(255,105,180,0.1)] min-h-[500px] relative overflow-hidden flex flex-col">
            {/* Decorative Background Icon */}
            <div className="absolute -top-10 -right-10 text-gray-800/30">
            <Search size={200} />
            </div>

            {/* 1. Header Section (Always Visible, Instant Update) */}
            <div className="relative z-10 animate-fade-in">
            <div className="flex items-baseline flex-wrap gap-4 border-b border-gray-800 pb-4 mb-6">
                <span className="text-bp-pink font-mono text-xl md:text-2xl opacity-80">
                    #{currentItem.globalIndex.toString().padStart(3, '0')}
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight break-all">
                    {currentItem.word}
                </h2>
                <span className={`ml-auto md:ml-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${getDifficultyColor(currentItem.level)}`}>
                    {currentItem.level}
                </span>
            </div>
            </div>

            {/* 2. Detail Section (Shows Loader or Data) */}
            <div className="relative z-10 flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 h-64 opacity-60">
                <Loader2 className="w-8 h-8 text-bp-pink animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">Summoning Blackpink examples...</p>
                </div>
            ) : data ? (
                <div className="space-y-6 animate-fade-in">
                {/* Pronunciation */}
                <div className="flex flex-row items-center gap-4 text-gray-300 bg-black/20 p-2 rounded-lg w-full">
                    <div className="flex-1 flex items-center gap-2 group cursor-pointer min-w-0" onClick={() => playAudio(currentItem.word, 'en-US')}>
                    <span className="text-[10px] font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 shrink-0">US</span>
                    {/* Reduced font size and allowed wrapping for IPA */}
                    <span className="font-mono text-sm md:text-base text-yellow-100 whitespace-normal break-all">/{cleanIPA(data.ipa_us)}/</span>
                    <Volume2 size={16} className="text-bp-pink group-hover:scale-110 transition-transform shrink-0"/>
                    </div>
                    <div className="w-px h-8 bg-gray-700 shrink-0"></div>
                    <div className="flex-1 flex items-center gap-2 group cursor-pointer min-w-0" onClick={() => playAudio(currentItem.word, 'en-GB')}>
                    <span className="text-[10px] font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 shrink-0">UK</span>
                    <span className="font-mono text-sm md:text-base text-yellow-100 whitespace-normal break-all">/{cleanIPA(data.ipa_uk)}/</span>
                    <Volume2 size={16} className="text-bp-pink group-hover:scale-110 transition-transform shrink-0"/>
                    </div>
                </div>

                {/* Definition - Modified to be on same line */}
                <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-serif italic text-bp-lightPink whitespace-nowrap">{data.part_of_speech}</span>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-snug">{data.chinese_definition}</h3>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border-l-4 border-purple-500">
                        <h4 className="text-purple-400 text-xs font-bold uppercase mb-1">Memory Key</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{data.etymology_or_mnemonic}</p>
                    </div>
                </div>

                {/* Example Section */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <h4 className="text-bp-pink font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-sm">
                    <span>🎤</span> In Your Area
                    </h4>
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-bp-pink/50 rounded-2xl p-6 relative group transition-colors">
                    <button 
                        onClick={() => playAudio(data.example_sentence_en, 'en-US')}
                        className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-bp-pink hover:bg-bp-pink hover:text-black transition-colors"
                    >
                        <Volume2 size={18} />
                    </button>
                    <p className="text-base md:text-lg text-white mb-3 font-medium leading-relaxed pr-10">
                        {data.example_sentence_en}
                    </p>
                    <p className="text-gray-400 text-sm pl-4 border-l-2 border-bp-pink">
                        {data.example_sentence_cn}
                    </p>
                    </div>
                </div>
                </div>
            ) : (
                <div className="text-red-500 mt-10">Failed to load content.</div>
            )}
            </div>
        </div>

        {/* Navigation Bar */}
        <div className="fixed bottom-16 left-0 w-full bg-black/80 border-t border-gray-800 p-3 z-40 backdrop-blur-lg">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-gray-800 text-white hover:bg-bp-pink hover:text-black disabled:opacity-30 transition-colors"
            >
                <ChevronLeft size={24} />
            </button>

            <form onSubmit={handleJump} className="flex-1 flex items-center justify-center gap-2">
                <div className="relative w-24">
                <input 
                    type="number" 
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    placeholder={`#ID`}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-center text-white focus:border-bp-pink outline-none text-xs"
                />
                </div>
                <button type="submit" className="bg-bp-pink text-black px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">Go</button>
            </form>

            <button 
                onClick={handleNext} 
                disabled={currentIndex === filteredList.length - 1}
                className="p-3 rounded-full bg-gray-800 text-white hover:bg-bp-pink hover:text-black disabled:opacity-30 transition-colors"
            >
                <ChevronRight size={24} />
            </button>
            </div>
        </div>
      </>
      )}
    </div>
  );
};
