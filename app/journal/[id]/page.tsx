'use client';
export const runtime = 'edge';
import React, { useRef, useState } from 'react';
import CanvasContainer from '../../../components/canvas/CanvasContainer';
import AssetLibrary from '../../../components/shared/AssetLibrary';
import { useJournalStore } from '../../../store/useJournalStore';

export default function JournalWorkspaceView() {
  const { 
    currentJournal, 
    currentPageIndex, 
    activeTool, 
    brushColor, 
    brushWidth,
    turnToPage, 
    exportJournalData, 
    loadJournal 
  } = useJournalStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [paperGridType, setPaperGridType] = useState<'blank' | 'dot' | 'ruled' | 'squared'>('dot');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  const tabLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const finePalette = [
    { name: 'Iron Gall', hex: '#2C2A29' },
    { name: 'Sepia Ink', hex: '#5C4A3E' },
    { name: 'Dried Sage', hex: '#7A8B7B' },
    { name: 'Terracotta', hex: '#C07A65' },
    { name: 'Antique Gold', hex: '#D4AF37' },
    { name: 'Faded Linen', hex: '#E8DCC4' },
    { name: 'Wild Rose', hex: '#DCAEAE' },
    { name: 'Dusty Velvet', hex: '#6B5E70' }
  ];

  const handleTabClick = (index: number) => {
    const targetPageIndex = 1 + (index * 2);
    if (currentJournal && targetPageIndex < currentJournal.pages.length) {
      turnToPage(targetPageIndex);
    }
  };

  const triggerExport = async () => {
    if (!currentJournal) return;
    try {
      const dataStr = await exportJournalData(currentJournal.metadata.id);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentJournal.metadata.title.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export module error:', err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const newId = await useJournalStore.getState().importJournalData(text);
        loadJournal(newId);
      } catch (err) {
        alert('Failed to parse scrapbook layout schema.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#2D241E] text-stone-800 flex flex-col font-serif relative overflow-hidden selection:bg-amber-100 selection:text-amber-900"
         style={{
           backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%), url('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1200&auto=format&fit=crop')`,
           backgroundSize: 'cover',
           backgroundBlendMode: 'multiply'
         }}>
      
      {/* VINTAGE BRASS & PARCHMENT HEADER */}
      <header className="h-16 bg-[#FDFBF7]/95 border-b-2 border-[#D4C5B3] fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl filter drop-shadow">🌸</span>
            <div>
              <h1 className="font-serif font-bold tracking-wider text-base text-[#4A3E3D]">Petal Studio</h1>
              <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-stone-400 -mt-0.5">Scrapbook Atelier</p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#E6DFD3]" />
          <p className="text-xs italic text-stone-600 font-medium font-serif max-w-[240px] truncate">
            {currentJournal?.metadata?.title || "An Unwritten Memory..."}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-[#EFEBE4] border border-[#D8D2C4] p-1 rounded-xl shadow-inner">
          {(['select', 'pen', 'highlighter'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => useJournalStore.setState({ activeTool: t })} 
              className={`px-5 py-1.5 text-xs font-sans font-bold tracking-wide rounded-lg capitalize transition-all duration-200 ${
                activeTool === t 
                  ? 'bg-[#FDFBF7] text-[#4A3E3D] shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-[#C8BFA8] font-extrabold scale-105' 
                  : 'text-stone-500 hover:text-stone-800 hover:bg-white/30'
              }`}
            >
              {t === 'select' ? '🖋 Select' : t === 'pen' ? '✒ Fountain Pen' : '🖍 Chisel Marker'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 font-sans">
          <button onClick={triggerExport} className="text-[11px] font-bold tracking-wider uppercase px-4 py-2 bg-[#FDFBF7] hover:bg-[#F5F0E6] text-stone-600 rounded-xl border border-[#D4C5B3] shadow-sm transition-all">
            💾 Archive Spread
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold tracking-wider uppercase px-4 py-2 bg-[#4A3E3D] hover:bg-[#5C4D4C] text-[#FDFBF7] rounded-xl shadow-md transition-all">
            📂 Unpack Journal
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>
      </header>

      {/* CORE ATELIER WORKSPACE COMPARTMENTS */}
      <div className="flex-1 flex pt-16 h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* LEFT COLUMN: THE ATELIER INK & SURFACE TRAY */}
        <aside className="w-64 bg-[#FDFBF7]/95 border-r border-[#E6DFD3] flex flex-col justify-between p-6 overflow-y-auto space-y-6 z-20 shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
          
          <div className="space-y-3">
            <label className="text-[10px] font-sans uppercase font-bold text-stone-400 tracking-widest block">
              Parchment Blueprint
            </label>
            <div className="grid grid-cols-2 gap-2 font-sans">
              {(['blank', 'dot', 'ruled', 'squared'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPaperGridType(type)}
                  className={`py-2 px-3 text-[11px] font-bold rounded-xl text-left border transition-all ${
                    paperGridType === type
                      ? 'border-[#4A3E3D] bg-[#4A3E3D] text-white shadow-inner scale-[1.02]'
                      : 'border-[#E6DFD3] text-stone-500 bg-[#FAF8F5] hover:bg-[#F5F0E6] hover:text-stone-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center font-sans">
              <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                Nib Width Calibration
              </label>
              <span className="text-xs font-serif italic text-stone-600">{brushWidth}pt</span>
            </div>
            <input 
              type="range" min="1" max="12" value={brushWidth}
              onChange={(e) => useJournalStore.setState({ brushWidth: parseInt(e.target.value) })}
              className="w-full accent-[#4A3E3D] bg-stone-200/60 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-sans uppercase font-bold text-stone-400 tracking-widest block">
              Studio Inkwell Mixer
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {finePalette.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => useJournalStore.setState({ brushColor: color.hex })}
                  className={`aspect-square rounded-xl border relative transition-transform shadow-inner ${
                    brushColor === color.hex ? 'scale-110 ring-2 ring-[#4A3E3D]/30 shadow-md' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex, borderColor: 'rgba(0,0,0,0.1)' }}
                  title={color.name}
                >
                  {brushColor === color.hex && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-serif">
                      ✒
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6DFD3] text-center">
            <span className="font-serif italic text-xs text-stone-400">Crafted Local-First</span>
          </div>
        </aside>

        {/* CENTRAL CONTAINER: LEATHER DESK MAT WRAPPING THE 3D SPREAD */}
        <section className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto z-10">
          
          <div className="w-full max-w-4xl bg-[#4A3B32] p-8 rounded-[32px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.1)] border-4 border-[#3D3029] relative">
            <div className="absolute inset-2 border border-dashed border-white/5 pointer-events-none rounded-[26px]" />

            {currentJournal?.pages?.length > 2 && (
              <div className="absolute top-12 -right-10 flex flex-col space-y-[4px] z-0 font-sans">
                {tabLabels.map((label, idx) => {
                  const associatedPageIndex = 1 + (idx * 2);
                  const isActive = currentPageIndex === associatedPageIndex || currentPageIndex === associatedPageIndex + 1;

                  return (
                    <button
                      key={label}
                      onClick={() => handleTabClick(idx)}
                      className={`w-12 py-2 text-[9px] uppercase tracking-wider font-extrabold rounded-r-xl border border-l-0 text-center transition-all duration-300 origin-left ${
                        isActive 
                          ? 'bg-[#A48064] text-amber-50 w-16 translate-x-0 z-10 border-[#8A674E] shadow-[3px_2px_10px_rgba(0,0,0,0.3)]' 
                          : 'bg-[#EDE6DB] text-stone-600 hover:bg-[#F4EFE6] border-[#D1C6B4] hover:translate-x-1 shadow-sm'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="w-full z-10 relative">
              <CanvasContainer />
            </div>
          </div>

          <div className="w-full max-w-4xl mt-6 flex justify-between items-center bg-[#FDFBF7] border border-[#D4C5B3] p-4 rounded-2xl shadow-xl text-xs z-10 font-sans">
            <button 
              disabled={currentPageIndex === 0} 
              onClick={() => turnToPage(Math.max(0, currentPageIndex - 2))} 
              className="border border-[#D4C5B3] bg-white text-stone-700 font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-20 hover:bg-[#FAF8F4]"
            >
              📜 Turn Back Leaf
            </button>
            <span className="font-serif italic text-base text-[#4A3E3D] font-medium">
              Folio Spreads {currentPageIndex + 1} &ndash; {currentPageIndex + 2} of {currentJournal?.pages?.length || 2}
            </span>
            <button 
              disabled={currentJournal ? currentPageIndex >= currentJournal.pages.length - 2 : true}
              onClick={() => turnToPage(currentPageIndex + 2)} 
              className="border border-[#D4C5B3] bg-white text-stone-700 font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-20 hover:bg-[#FAF8F4]"
            >
              Advance Folio 📜
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: SLIDING DRAWER STORAGE BOX FOR STICKERS */}
        <aside className={`bg-[#FDFBF7]/95 border-l border-[#E6DFD3] transition-all duration-300 flex flex-col z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.05)] ${isSidebarExpanded ? 'w-80' : 'w-0'}`}>
          <div className="flex-1 overflow-hidden flex flex-col min-w-[320px]">
            <AssetLibrary />
          </div>
        </aside>

        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute bottom-6 right-6 z-40 w-10 h-10 rounded-full border border-[#D4C5B3] bg-[#FDFBF7] shadow-xl flex items-center justify-center text-sm font-bold hover:bg-[#FAF8F4] text-[#4A3E3D] transition-transform active:scale-95"
          title="Open Asset Cabinet"
        >
          {isSidebarExpanded ? '✕' : '🌸'}
        </button>

      </div>
    </div>
  );
}
