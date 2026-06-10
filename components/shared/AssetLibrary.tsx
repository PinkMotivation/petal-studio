'use client';
import React, { useState } from 'react';
import { useJournalStore } from '../../store/useJournalStore';

export default function AssetLibrary() {
  const [activeTab, setActiveTab] = useState<string>('cottagecore');
  
  // Hydrated manifest entries representing asset packs mapped from your documentation
  const kits: Record<string, { name: string; url: string }[]> = {
    cottagecore: [
      { name: 'Dried Pressed Rose', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&q=80&w=300' },
      { name: 'Vintage Butterfly Stamp', url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300' }
    ],
    travel: [
      { name: 'Paris Postmark Icon', url: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&q=80&w=300' },
      { name: 'Aged Map Ephemera', url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=300' }
    ],
    study: [
      { name: 'Coffee Cup Spill Stain', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300' },
      { name: 'Minimalist Fountain Pen', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=300' }
    ],
    dark_academia: [
      { name: 'Fossilized Wax Seal Ring', url: 'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?auto=format&fit=crop&q=80&w=300' },
      { name: 'Classic Greek Marble Bust', url: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=300' }
    ],
    minimal_planner: [
      { name: 'Sage Checklist Grid Block', url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=300' },
      { name: 'Daily Focus To-Do Tracker', url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=300' }
    ],
    vintage_ephemera: [
      { name: '1890 Torn News Clipping', url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=300' },
      { name: 'Retro Sepia Ledger Page', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=300' }
    ],
    washi_tape: [
      { name: 'Gingham Plaid Mesh Strip', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=300' },
      { name: 'Gold Leaf Foil Edge Ribbon', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300' }
    ]
  };

  const handlePlaceSticker = (url: string) => {
    // Drop item directly onto current left page canvas boundary context 
    useJournalStore.getState().addElement({
      type: 'sticker',
      assetUrl: url,
      transform: { x: 20, y: 25, width: 35, height: 35, rotation: 0, zIndex: 50 },
      isLocked: false,
      opacity: 1
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xl h-full flex flex-col space-y-4">
      <div>
        <h3 className="font-serif text-md font-medium text-stone-900">Aesthetic Toolkits</h3>
        <p className="text-[11px] text-stone-500">Tap an illustration element to place it onto the active book page.</p>
      </div>

      {/* Categories Scroller array */}
      <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-stone-100">
        {Object.keys(kits).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap rounded-lg transition-all ${activeTab === category ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-500 hover:text-stone-800'}`}
          >
            {category.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Stickers Output Node */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1 max-h-[500px]">
        {kits[activeTab]?.map((sticker) => (
          <div
            key={sticker.name}
            onClick={() => handlePlaceSticker(sticker.url)}
            className="group cursor-pointer border border-stone-150 rounded-xl p-2 bg-stone-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="overflow-hidden rounded-lg bg-white aspect-square flex items-center justify-center">
              <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" />
            </div>
            <p className="text-[10px] text-stone-600 mt-2 text-center truncate font-medium">{sticker.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}