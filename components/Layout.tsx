import React from 'react';
import { ViewState } from '../types';
import { BookOpen, PenTool, ShoppingBag, Music, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  coins: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, coins }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Top Header: Logo & Coins only */}
      {/* Added pt-safe to handle iPhone Notch */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 pt-safe transition-all">
        <div className="h-16 flex items-center justify-between px-4 lg:px-8 shadow-lg">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
            <div className="w-8 h-8 bg-bp-pink rounded-full flex items-center justify-center">
              <Music className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-wider">BLINK ENGLISH</span>
          </div>

          <div className="flex items-center bg-gray-900 px-3 py-1 rounded-full border border-yellow-500/30">
            <span className="text-yellow-400 mr-2">🪙</span>
            <span className="font-mono font-bold text-yellow-400">{coins}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* Added pt-safe and extra top margin to account for the safe-area header height */}
      <main className="flex-1 pt-safe mt-20 pb-safe mb-20 px-4 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      {/* Added pb-safe to handle iPhone Home Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-black/95 border-t border-gray-800 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          <NavButton active={currentView === 'home'} onClick={() => onViewChange('home')} icon={<Home size={20} />} label="Home" />
          <NavButton active={currentView === 'learning'} onClick={() => onViewChange('learning')} icon={<BookOpen size={20} />} label="Learn" />
          <NavButton active={currentView === 'quiz'} onClick={() => onViewChange('quiz')} icon={<PenTool size={20} />} label="Quiz" />
          <NavButton active={currentView === 'store'} onClick={() => onViewChange('store')} icon={<ShoppingBag size={20} />} label="Mall" />
        </div>
      </nav>

      {/* Decorative Background Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-bp-pink/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-90 ${
      active 
        ? 'text-bp-pink' 
        : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-bp-pink/10 -translate-y-1' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold mt-1 tracking-wide">{label}</span>
  </button>
);