
import React, { useState } from 'react';
import { WORD_LIST } from '../constants';
import { UserState } from '../types';
import { Volume2, CheckCircle, XCircle, Trash2, Send } from 'lucide-react';

interface QuizProps {
  userState: UserState;
  addCoins: (n: number) => void;
  handleQuizResult: (word: string, isCorrect: boolean) => void;
}

type QuizPhase = 'setup' | 'testing' | 'result';

export const Quiz: React.FC<QuizProps> = ({ userState, addCoins, handleQuizResult }) => {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [questionCount, setQuestionCount] = useState(10);
  const [useMistakesOnly, setUseMistakesOnly] = useState(false);
  const [quizWords, setQuizWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);
  const [lastRoundCoins, setLastRoundCoins] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [accent, setAccent] = useState<'US' | 'UK'>('US');

  // Simple synthesized sound effects
  const playFeedbackSound = (type: 'correct' | 'wrong') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        // High pitch "ding"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // Low pitch "buzz"
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Generate Quiz List
  const startQuiz = () => {
    let pool: string[] = [];

    if (useMistakesOnly) {
      const now = Date.now();
      const dueWords = userState.mistakeBank
        .filter(record => record.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview)
        .map(r => r.word);

      if (dueWords.length === 0) {
        if (userState.mistakeBank.length > 0) {
            const upcoming = [...userState.mistakeBank]
                .sort((a, b) => a.nextReview - b.nextReview)
                .map(r => r.word);
            
             if(!window.confirm("Great job! No words are currently due for review. Review upcoming words anyway?")) {
                 return;
             }
             pool = upcoming;
        } else {
            alert("Your Mistake Bank is empty! Great job!");
            setUseMistakesOnly(false);
            pool = [...WORD_LIST];
        }
      } else {
          pool = dueWords;
      }
    } else {
      pool = [...WORD_LIST];
    }
    
    let selected: string[] = [];
    
    if (useMistakesOnly) {
        selected = pool.slice(0, questionCount);
    } else {
        // Shuffle for standard mode
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        selected = pool.slice(0, questionCount);
    }

    setQuizWords(selected);
    setCurrentIndex(0);
    setScore(0);
    setTotalCoinsEarned(0);
    setUserInput('');
    setFeedback(null);
    setPhase('testing');
    
    setTimeout(() => playWord(selected[0]), 500);
  };

  const playWord = (word: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = accent === 'US' ? 'en-US' : 'en-GB';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedback !== null || !userInput.trim()) return;

    const targetWord = quizWords[currentIndex];
    const isCorrect = userInput.trim().toLowerCase() === targetWord.toLowerCase();

    handleQuizResult(targetWord, isCorrect);
    playFeedbackSound(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      // Random coins between 1 and 5
      const earned = Math.floor(Math.random() * 5) + 1;
      
      setScore(s => s + 1);
      setTotalCoinsEarned(t => t + earned);
      setLastRoundCoins(earned);
      setFeedback('correct');
      addCoins(earned);
    } else {
      setFeedback('wrong');
    }

    // Auto advance
    setTimeout(() => {
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
        setFeedback(null);
        playWord(quizWords[currentIndex + 1]);
      } else {
        setPhase('result');
      }
    }, 2500); // Slightly longer to read feedback
  };

  if (phase === 'setup') {
    const dueCount = userState.mistakeBank.filter(r => r.nextReview <= Date.now()).length;

    return (
      <div className="max-w-xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-4 md:mt-10">
        <h2 className="text-3xl font-bold text-bp-pink mb-6 text-center">Quiz Setup</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2">Number of Questions</label>
            <div className="flex gap-4">
              {[5, 10, 20, 50].map(num => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2 rounded-lg border ${questionCount === num ? 'bg-bp-pink text-black border-bp-pink font-bold' : 'bg-black border-gray-700 hover:border-gray-500'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Word Source</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setUseMistakesOnly(false)}
                className={`w-full py-3 rounded-lg border ${!useMistakesOnly ? 'bg-bp-pink text-black border-bp-pink font-bold' : 'bg-black border-gray-700'}`}
              >
                All Words (Random)
              </button>
              <button
                onClick={() => setUseMistakesOnly(true)}
                disabled={userState.mistakeBank.length === 0}
                className={`w-full py-3 rounded-lg border relative overflow-hidden ${
                  useMistakesOnly 
                    ? 'bg-bp-pink text-black border-bp-pink font-bold' 
                    : 'bg-black border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-center px-4">
                  <span>Smart Review (Mistake Bank)</span>
                  <span className={`text-xs px-2 py-1 rounded ${dueCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    {dueCount} Due / {userState.mistakeBank.length} Total
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
             <label className="block text-gray-400 mb-2">Accent Preference</label>
             <div className="flex gap-4 bg-black p-1 rounded-lg border border-gray-700">
               <button onClick={() => setAccent('US')} className={`flex-1 py-1 rounded ${accent === 'US' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>US 🇺🇸</button>
               <button onClick={() => setAccent('UK')} className={`flex-1 py-1 rounded ${accent === 'UK' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>UK 🇬🇧</button>
             </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full py-4 bg-gradient-to-r from-bp-pink to-purple-600 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity mt-4 shadow-[0_0_20px_rgba(255,105,180,0.4)]"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="max-w-xl mx-auto text-center pt-10 animate-fade-in">
        <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
        <div className="text-8xl font-bold text-bp-pink my-8 drop-shadow-[0_0_10px_rgba(255,105,180,0.8)]">
          {Math.round((score / quizWords.length) * 100)}%
        </div>
        <p className="text-xl text-gray-300 mb-8">
          You got <span className="text-white font-bold">{score}</span> out of {quizWords.length} correct.
          <br/>
          Earned <span className="text-yellow-400 font-bold">+{totalCoinsEarned} Coins</span>
        </p>
        <button 
          onClick={() => setPhase('setup')}
          className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-bold transition-colors"
        >
          Take Another Quiz
        </button>
      </div>
    );
  }

  // Testing Phase
  return (
    <div className="max-w-2xl mx-auto pt-4 md:pt-10">
      <div className="flex justify-between items-center mb-8 text-gray-400">
        <span>Question {currentIndex + 1} / {quizWords.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 md:p-10 flex flex-col items-center gap-6 relative overflow-hidden min-h-[350px]">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-bp-pink transition-all duration-300" style={{ width: `${((currentIndex)/quizWords.length)*100}%` }} />

        <button 
          onClick={() => playWord(quizWords[currentIndex])}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-bp-pink/20 text-bp-pink hover:bg-bp-pink hover:text-black flex items-center justify-center transition-all duration-300 animate-pulse-slow z-10"
        >
          <Volume2 size={40} />
        </button>
        <p className="text-gray-400 text-sm z-10">Click to listen ({accent})</p>

        <form onSubmit={handleSubmit} className="w-full max-w-md relative flex flex-col gap-4 z-10">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={feedback !== null}
            autoFocus
            className="w-full bg-black border-2 border-gray-700 focus:border-bp-pink rounded-xl py-4 px-6 text-center text-2xl outline-none transition-colors text-white"
            placeholder="Type word..."
          />

          {/* Action Buttons */}
          <div className="flex gap-2 w-full mt-2">
            <button
               type="button"
               onClick={() => setUserInput('')}
               disabled={feedback !== null}
               className="flex-1 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
               <Trash2 size={16} /> Clear
            </button>
            <button
               type="submit"
               disabled={feedback !== null || !userInput}
               className="flex-[2] bg-bp-pink text-black hover:bg-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Send size={16} /> Submit
            </button>
          </div>
        </form>

        {/* FEEDBACK OVERLAY */}
        {feedback && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md animate-fade-in">
             {feedback === 'correct' ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle size={60} className="text-green-500 animate-bounce" />
                  </div>
                  <h3 className="text-4xl font-bold text-green-500 mb-2">Excellent!</h3>
                  <div className="bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full font-bold border border-yellow-500/50 flex items-center gap-2 animate-pulse">
                    <span>+{lastRoundCoins} Coins</span>
                  </div>
                </>
             ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <XCircle size={60} className="text-red-500 animate-pulse" />
                  </div>
                  <h3 className="text-4xl font-bold text-red-500 mb-4">Incorrect</h3>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest">Correct Answer</p>
                    <p className="text-3xl font-bold text-white tracking-wide">{quizWords[currentIndex]}</p>
                  </div>
                </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
