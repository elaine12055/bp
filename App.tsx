import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Learning } from './components/Learning';
import { Quiz } from './components/Quiz';
import { Store } from './components/Store';
import { UserState, ViewState, ImageCache, DailyStats } from './types';
import { Save, Activity, Smartphone, Share, Menu } from 'lucide-react';

const INITIAL_USER_STATE: UserState = {
  coins: 0,
  inventory: [],
  mistakeBank: [], 
  dailyCoinsEarned: 0,
  lastLoginDate: new Date().toDateString(),
  statsHistory: [], // Format: { date: 'YYYY-MM-DD', quizCount: 0, errorCount: 0 }
};

export default function App() {
  // Default View set to 'learning'
  const [currentView, setCurrentView] = useState<ViewState>('learning');
  // Store generated images in memory (session only) to avoid localStorage limits
  const [storeImages, setStoreImages] = useState<ImageCache>({});
  const [isStandalone, setIsStandalone] = useState(true);

  // Check if running in standalone mode (App mode)
  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
  }, []);

  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('blink_user_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure statsHistory exists
      if (!parsed.statsHistory) parsed.statsHistory = [];
      
      // Migration check: if mistakeBank contains strings, convert to objects
      if (parsed.mistakeBank && parsed.mistakeBank.length > 0 && typeof parsed.mistakeBank[0] === 'string') {
        parsed.mistakeBank = parsed.mistakeBank.map((w: string) => ({
          word: w,
          nextReview: Date.now(),
          stage: 0
        }));
      }
      return parsed;
    }
    return INITIAL_USER_STATE;
  });

  // Persist user state
  useEffect(() => {
    localStorage.setItem('blink_user_state', JSON.stringify(userState));
  }, [userState]);

  // Reset daily coin limit check and initialize daily stats if needed
  useEffect(() => {
    const today = new Date().toDateString();
    
    setUserState(prev => {
       const isNewDay = prev.lastLoginDate !== today;
       
       // Ensure we have a stats entry for today
       const statsDate = new Date().toISOString().split('T')[0];
       const hasTodayStats = prev.statsHistory.some(s => s.date === statsDate);
       
       let newStatsHistory = [...prev.statsHistory];
       if (!hasTodayStats) {
           newStatsHistory.push({ date: statsDate, quizCount: 0, errorCount: 0 });
           // Keep only last 7 days
           if (newStatsHistory.length > 7) newStatsHistory.shift();
       }

       if (isNewDay || !hasTodayStats) {
         return {
           ...prev,
           dailyCoinsEarned: isNewDay ? 0 : prev.dailyCoinsEarned,
           lastLoginDate: today,
           statsHistory: newStatsHistory
         };
       }
       return prev;
    });
  }, []);

  const addCoins = (amount: number) => {
    setUserState(prev => {
      // Removed daily cap limit as requested
      return {
        ...prev,
        coins: prev.coins + amount,
        dailyCoinsEarned: prev.dailyCoinsEarned + amount
      };
    });
  };

  const addToInventory = (itemId: string) => {
    setUserState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemId]
    }));
  };

  const deductCoins = (amount: number) => {
    setUserState(prev => ({
      ...prev,
      coins: prev.coins - amount
    }));
  };

  const handleCacheImage = (id: string, base64: string) => {
    setStoreImages(prev => ({
      ...prev,
      [id]: base64
    }));
  };

  const handleQuizResult = (word: string, isCorrect: boolean) => {
    setUserState(prev => {
      const bank = [...prev.mistakeBank];
      const index = bank.findIndex(r => r.word === word);
      
      // Update Stats
      const todayDate = new Date().toISOString().split('T')[0];
      const statsHistory = prev.statsHistory.map(stat => {
          if (stat.date === todayDate) {
              return {
                  ...stat,
                  quizCount: stat.quizCount + 1,
                  errorCount: stat.errorCount + (isCorrect ? 0 : 1)
              };
          }
          return stat;
      });
      // If today didn't exist in map (edge case), add it
      if (!statsHistory.some(s => s.date === todayDate)) {
          statsHistory.push({ 
              date: todayDate, 
              quizCount: 1, 
              errorCount: isCorrect ? 0 : 1 
          });
      }

      // Ebbinghaus intervals
      const intervals = [1, 10, 60, 300, 1440, 4320, 10080];

      if (isCorrect) {
        if (index >= 0) {
          const currentStage = bank[index].stage;
          const nextStage = Math.min(currentStage + 1, intervals.length - 1);
          const nextReview = Date.now() + (intervals[nextStage] * 60 * 1000);
          bank[index] = { ...bank[index], stage: nextStage, nextReview };
          return { ...prev, mistakeBank: bank, statsHistory };
        }
        return { ...prev, statsHistory };
      } else {
        const nextReview = Date.now() + (intervals[0] * 60 * 1000);
        if (index >= 0) {
          bank[index] = { ...bank[index], stage: 0, nextReview };
        } else {
          bank.push({ word, stage: 0, nextReview });
        }
        return { ...prev, mistakeBank: bank, statsHistory };
      }
    });
  };

  const manualSave = () => {
    localStorage.setItem('blink_user_state', JSON.stringify(userState));
    alert("Game Saved! \n進度已儲存！");
  };

  // Helper to get chart data (fill missing days if needed)
  const getChartData = () => {
    // Generate last 7 days labels
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    return days.map(date => {
        const found = userState.statsHistory.find(s => s.date === date);
        return found || { date, quizCount: 0, errorCount: 0 };
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'learning':
        return <Learning />;
      case 'quiz':
        return (
          <Quiz 
            userState={userState} 
            addCoins={addCoins} 
            handleQuizResult={handleQuizResult}
          />
        );
      case 'store':
        return (
          <Store 
            userState={userState} 
            deductCoins={deductCoins} 
            addToInventory={addToInventory} 
            imageCache={storeImages}
            cacheImage={handleCacheImage}
          />
        );
      case 'home':
      default:
        const chartData = getChartData();
        const maxQuiz = Math.max(...chartData.map(d => d.quizCount), 10);
        
        return (
          <div className="flex flex-col items-center pt-8 pb-20 px-4 animate-fade-in w-full max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-5xl font-bold text-bp-pink drop-shadow-[0_0_15px_rgba(255,105,180,0.5)]">
                DASHBOARD
              </h1>
              <p className="text-gray-400">Your Learning Statistics</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-yellow-400">{userState.coins}</div>
                    <div className="text-xs text-gray-500">COINS</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-bp-pink">{userState.inventory.length}</div>
                    <div className="text-xs text-gray-500">ITEMS</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-400">{userState.mistakeBank.length}</div>
                    <div className="text-xs text-gray-500">REVIEW</div>
                </div>
            </div>

            {/* Combined Chart */}
            <div className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl p-6 relative mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="text-bp-pink" />
                    <h3 className="text-xl font-bold text-white">Weekly Performance</h3>
                </div>
                
                <div className="w-full h-64 flex items-end justify-between gap-2 px-2 pb-6 relative">
                    {/* Y-Axis Grid Lines (Simplified) */}
                    <div className="absolute inset-0 border-b border-gray-700 pointer-events-none flex flex-col justify-between opacity-30 pb-6">
                        <div className="border-t border-gray-700 w-full h-0"></div>
                        <div className="border-t border-gray-700 w-full h-0"></div>
                        <div className="border-t border-gray-700 w-full h-0"></div>
                        <div className="border-t border-gray-700 w-full h-0"></div>
                    </div>

                    {chartData.map((day, i) => {
                        const heightPct = (day.quizCount / maxQuiz) * 100;
                        const errorRate = day.quizCount > 0 ? (day.errorCount / day.quizCount) * 100 : 0;
                        const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center h-full relative group">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-gray-700">
                                    {day.date}<br/>
                                    Tests: {day.quizCount}<br/>
                                    Errors: {day.errorCount} ({Math.round(errorRate)}%)
                                </div>

                                {/* Bar (Quiz Count) */}
                                <div 
                                    className="w-full max-w-[30px] bg-gray-700 rounded-t-sm hover:bg-gray-600 transition-all relative"
                                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                                >
                                    {/* Error Rate Indicator (Red overlay or dot) */}
                                    {day.quizCount > 0 && (
                                        <div 
                                            className="absolute bottom-0 w-full bg-bp-pink/50 border-t border-bp-pink transition-all"
                                            style={{ height: `${errorRate}%` }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-2 uppercase">{dateLabel}</span>
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex justify-center gap-6 text-xs mt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-700"></div>
                        <span className="text-gray-400">Total Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-bp-pink/50 border border-bp-pink"></div>
                        <span className="text-gray-400">Error Rate</span>
                    </div>
                </div>
            </div>

            {/* Install Prompt (Only visible in Browser) */}
            {!isStandalone && (
              <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 border border-bp-pink/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Smartphone className="text-bp-pink" /> 
                    Install as App
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Add this to your home screen for the best full-screen experience!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
                    <div className="bg-black/40 p-3 rounded-lg flex items-center gap-2">
                      <Share size={16} /> 
                      <span><strong>iOS:</strong> Tap 'Share' → 'Add to Home Screen'</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg flex items-center gap-2">
                      <Menu size={16} />
                      <span><strong>Android:</strong> Tap Menu (⋮) → 'Install App' or 'Add to Home Screen'</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-bp-pink/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              </div>
            )}

            <div>
                 <button 
                   onClick={manualSave}
                   className="flex items-center gap-2 bg-bp-pink text-black hover:bg-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(255,105,180,0.4)]"
                 >
                   <Save size={18} /> SAVE PROGRESS
                 </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} coins={userState.coins}>
      {renderContent()}
    </Layout>
  );
}