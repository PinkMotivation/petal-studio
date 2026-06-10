export const runtime = 'edge';
'use client';
import React, { useState, useEffect } from 'react';
import ShelfGrid from '../components/bookshelf/ShelfGrid';
import JournalWorkspaceView from './journal/[id]/page';
import { useJournalStore } from '../store/useJournalStore';

export default function Home() {
  const [activeId, setActiveId] = useState(null);
  const { loadJournal } = useJournalStore();
  useEffect(() => { if (activeId) loadJournal(activeId); }, [activeId]);

  if (activeId) {
    return (
      <div>
        <button onClick={() => setActiveId(null)} className="fixed top-4 left-4 z-50 bg-white border px-3 py-1 rounded text-xs">🏠 Library</button>
        <JournalWorkspaceView />
      </div>
    );
  }
  return <ShelfGrid onOpenJournal={setActiveId} />;
}
