'use client';
import React, { useEffect, useState } from 'react';
import { db } from '../../utils/db';
import { generatePlannerPages } from '../../utils/plannerGenerator';
import BookCover from './BookCover';

export default function ShelfGrid({ onOpenJournal }: { onOpenJournal: (id: string) => void }) {
  const [journals, setJournals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [journalType, setJournalType] = useState<'empty' | 'planner'>('empty');
  const [coverColor, setCoverColor] = useState('#697A6E');
  const [showModal, setShowModal] = useState(false);

  const refresh = () => db.journals.toArray().then(setJournals);
  useEffect(() => { refresh(); }, []);

  const createNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const journalId = crypto.randomUUID();
    let generatedPages = [];

    if (journalType === 'planner') {
      generatedPages = generatePlannerPages({ year: 2026, theme: 'planner' });
    } else {
      // Empty entry layout blueprint (2 base side leaves minimum)
      generatedPages = [
        { id: crypto.randomUUID(), pageNumber: 0, backgroundType: 'minimal', backgroundValue: '#FCFBFA', elements: [], strokes: [] },
        { id: crypto.randomUUID(), pageNumber: 1, backgroundType: 'minimal', backgroundValue: '#FCFBFA', elements: [], strokes: [] }
      ];
    }

    // Persist parent journal configuration boundaries
    await db.journals.add({
      id: journalId,
      title: title.trim(),
      coverStyle: 'linen',
      coverColor,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Sequential multi-page batch commit via transaction table pipeline
    for (const page of generatedPages) {
      await db.pages.add({
        id: crypto.randomUUID(),
        journalId,
        pageData: page
      });
    }

    setShowModal(false);
    setTitle('');
    refresh();
    onOpenJournal(journalId);
  };

  return (
    <div className="p-12 max-w-6xl mx-auto text-stone-800">
      <div className="flex justify-between border-b border-stone-200/80 pb-6 mb-12 items-center">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">Petal Studio</h1>
          <p className="text-xs text-stone-400 mt-1">Premium Tactile Scrapbooks & Planners</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-stone-950 text-stone-50 text-xs font-medium tracking-wide px-5 py-2.5 rounded-xl shadow-md transition-all hover:bg-stone-800">
          ✦ Bind New Notebook
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
        {journals.map(j => (
          <div key={j.id} onClick={() => onOpenJournal(j.id)} className="cursor-pointer group flex flex-col items-center">
            <BookCover metadata={j} />
            <p className="mt-3 text-sm font-serif font-medium truncate w-full text-center text-stone-700 group-hover:text-stone-950 transition-colors">{j.title}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={createNotebook} className="bg-white p-7 rounded-2xl border border-stone-100 shadow-2xl space-y-5 max-w-sm w-full">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Configure Notebook</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Notebook Title</label>
              <input type="text" required placeholder="My Digital Sanctuary..." value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-stone-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-500" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Internal Format Preset</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setJournalType('empty')} className={`p-3 text-xs font-medium border rounded-xl transition-all ${journalType === 'empty' ? 'border-stone-950 bg-stone-50 text-stone-950' : 'border-stone-200 text-stone-500'}`}>Empty Journal</button>
                <button type="button" onClick={() => setJournalType('planner')} className={`p-3 text-xs font-medium border rounded-xl transition-all ${journalType === 'planner' ? 'border-stone-950 bg-stone-50 text-stone-950' : 'border-stone-200 text-stone-500'}`}>12-Month Planner</button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Cover Palette</label>
              <div className="flex space-x-3 py-1">
                {['#697A6E', '#4E5A65', '#D9C3B0', '#3C3530'].map(color => (
                  <button key={color} type="button" onClick={() => setCoverColor(color)} className={`w-7 h-7 rounded-full border-2 transition-transform ${coverColor === color ? 'border-stone-950 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-stone-200 text-stone-500 text-xs p-3 rounded-xl hover:bg-stone-50">Cancel</button>
              <button type="submit" className="flex-1 bg-stone-950 text-white text-xs p-3 rounded-xl hover:bg-stone-800">Bind</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}