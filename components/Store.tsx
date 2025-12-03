
import React, { useState } from 'react';
import { STORE_ITEMS } from '../constants';
import { UserState, StoreItem, ImageCache } from '../types';
import { Lock, Check, Sparkles, Loader2, Package } from 'lucide-react';
import { generateStoreItemImage } from '../services/geminiService';

interface StoreProps {
  userState: UserState;
  deductCoins: (amount: number) => void;
  addToInventory: (itemId: string) => void;
  imageCache: ImageCache;
  cacheImage: (id: string, base64: string) => void;
}

export const Store: React.FC<StoreProps> = ({ userState, deductCoins, addToInventory, imageCache, cacheImage }) => {
  const [filter, setFilter] = useState<string>('All');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  
  const categories = ['All', 'My Collection', 'Member', 'Outfit', 'Pet', 'Merch', 'Accessory'];
  
  const filteredItems = filter === 'All' 
    ? STORE_ITEMS 
    : filter === 'My Collection'
      ? STORE_ITEMS.filter(item => userState.inventory.includes(item.id))
      : STORE_ITEMS.filter(item => item.category === filter);

  const handleBuy = (item: StoreItem) => {
    if (userState.coins >= item.cost && !userState.inventory.includes(item.id)) {
      if (window.confirm(`Purchase ${item.name} for ${item.cost} coins?`)) {
        deductCoins(item.cost);
        addToInventory(item.id);
      }
    }
  };

  const handleGeneratePreview = async (item: StoreItem) => {
    if (generatingId) return; // Busy
    setGeneratingId(item.id);
    
    const base64 = await generateStoreItemImage(item.name, item.category);
    if (base64) {
      cacheImage(item.id, base64);
    } else {
      alert("Failed to create magic image. Try again later!");
    }
    
    setGeneratingId(null);
  };

  return (
    <div className="pb-20">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-bp-pink mb-2">BLINK MALL</h2>
        <p className="text-gray-400">Redeem coins & Reveal AI-generated Chibi Art!</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sticky top-20 z-30 bg-black/90 py-4 backdrop-blur-md">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1 rounded-full text-sm font-bold border transition-colors ${
              filter === cat 
                ? 'bg-bp-pink text-black border-bp-pink' 
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-bp-pink hover:text-bp-pink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty State for Inventory */}
      {filter === 'My Collection' && filteredItems.length === 0 && (
        <div className="text-center py-20 text-gray-500 animate-fade-in">
          <Package size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl">Your inventory is empty.</p>
          <p className="text-sm mt-2">Earn coins in the Quiz and start collecting!</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredItems.map(item => {
          const isOwned = userState.inventory.includes(item.id);
          const canAfford = userState.coins >= item.cost;
          const hasGeneratedImage = !!imageCache[item.id];
          const isGenerating = generatingId === item.id;

          // Logic: Owned items OR revealed items should be colorful. 
          // Only show 'grayscale' if it is NOT owned AND NOT generated yet (though logically you generate to reveal)
          // Actually, visually: if I don't own it, I can still generate preview? 
          // The previous logic allowed generation freely. 
          // "商品下載後就變彩色" -> If hasGeneratedImage is true, it is color.
          const showColor = hasGeneratedImage || isOwned;

          return (
            <div 
              key={item.id} 
              className={`relative bg-gray-900 border rounded-xl overflow-hidden transition-all duration-300 group ${
                isOwned ? 'border-green-500/50' : 'border-gray-800 hover:border-bp-pink hover:shadow-[0_0_15px_rgba(255,105,180,0.2)]'
              }`}
            >
              {/* Image Area */}
              <div className="aspect-square bg-gray-800 relative overflow-hidden group/image">
                {hasGeneratedImage ? (
                  <img 
                    src={imageCache[item.id]} 
                    alt={item.name} 
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`} 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-800">
                     <span className="text-4xl mb-2 opacity-30">🎁</span>
                     <p className="text-xs text-gray-500">Preview Hidden</p>
                  </div>
                )}
                
                {/* Overlay Controls */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-2 ${
                  hasGeneratedImage ? 'opacity-0 group-hover/image:opacity-100' : 'opacity-100'
                }`}>
                   {!hasGeneratedImage && !isGenerating && (
                     <button 
                       onClick={() => handleGeneratePreview(item)}
                       className="bg-bp-pink text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:scale-105 transition-transform shadow-lg"
                     >
                       <Sparkles size={12} /> Reveal
                     </button>
                   )}
                   {isGenerating && (
                     <div className="bg-black/80 text-bp-pink text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                       <Loader2 size={12} className="animate-spin" /> Creating...
                     </div>
                   )}
                </div>

                {isOwned && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg flex items-center gap-1">
                      <Check size={10} /> OWNED
                    </div>
                  </div>
                )}
              </div>

              {/* Info Area */}
              <div className="p-3">
                <h3 className="text-white text-sm font-bold truncate mb-1">{item.name}</h3>
                <div className="flex items-center justify-between mt-2">
                   <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                   <button
                    onClick={() => handleBuy(item)}
                    disabled={isOwned || !canAfford}
                    className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 ${
                      isOwned ? 'hidden' :
                      canAfford 
                        ? 'bg-bp-pink text-black hover:bg-white' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                   >
                     {canAfford ? 'BUY' : <Lock size={10} />}
                     {item.cost} 🪙
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
