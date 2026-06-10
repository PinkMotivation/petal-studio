import { create } from 'zustand';
import { db } from '../utils/db';

interface JournalState {
  currentJournal: any;
  currentPageIndex: number;
  activeTool: 'select' | 'pen' | 'highlighter';
  brushColor: string;
  brushWidth: number;
  loadJournal: (id: string) => Promise<void>;
  addElement: (element: any) => void;
  updateElementTransform: (id: string, updates: any, pageIdx: number) => void;
  addStroke: (stroke: any, pageIdx: number) => void;
  turnToPage: (index: number) => void;
  exportJournalData: (id: string) => Promise<string>;
  importJournalData: (jsonString: string) => Promise<string>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  currentJournal: null,
  currentPageIndex: 0,
  activeTool: 'select',
  brushColor: '#5C544E',
  brushWidth: 3,

  loadJournal: async (id) => {
    const meta = await db.journals.get(id);
    if (!meta) return;
    const pageRecords = await db.pages.where('journalId').equals(id).toArray();
    let sortedPages = pageRecords.map(r => r.pageData).sort((a, b) => a.pageNumber - b.pageNumber);
    
    if (sortedPages.length === 1) {
      const secondPage = { id: crypto.randomUUID(), pageNumber: 1, backgroundType: 'minimal', backgroundValue: '#fcfbfa', elements: [], strokes: [] };
      sortedPages.push(secondPage);
      await db.pages.add({ id: crypto.randomUUID(), journalId: id, pageData: secondPage });
    }

    set({ currentJournal: { metadata: meta, pages: sortedPages }, currentPageIndex: 0 });
  },

  addElement: (element) => {
    const { currentJournal, currentPageIndex } = get();
    if (!currentJournal) return;

    const targetPageIdx = currentPageIndex;
    const newElement = { ...element, id: crypto.randomUUID() };
    const updatedPages = [...currentJournal.pages];
    
    if (!updatedPages[targetPageIdx].elements) updatedPages[targetPageIdx].elements = [];
    updatedPages[targetPageIdx].elements.push(newElement);

    set({ currentJournal: { ...currentJournal, pages: updatedPages } });
    
    db.pages.where('journalId').equals(currentJournal.metadata.id).toArray().then(records => {
      const targetRecord = records.find(r => r.pageData.pageNumber === targetPageIdx);
      if (targetRecord) {
        db.pages.put({ id: targetRecord.id, journalId: currentJournal.metadata.id, pageData: updatedPages[targetPageIdx] });
      }
    });
  },

  updateElementTransform: (id, updates, pageIdx) => {
    const { currentJournal } = get();
    if (!currentJournal) return;

    const updatedPages = [...currentJournal.pages];
    const element = updatedPages[pageIdx]?.elements?.find((e: any) => e.id === id);
    if (element) {
      element.transform = { ...element.transform, ...updates };
      set({ currentJournal: { ...currentJournal, pages: updatedPages } });
    }
  },

  addStroke: (stroke, pageIdx) => {
    const { currentJournal } = get();
    if (!currentJournal) return;

    const updatedPages = [...currentJournal.pages];
    if (!updatedPages[pageIdx].strokes) updatedPages[pageIdx].strokes = [];
    updatedPages[pageIdx].strokes.push(stroke);

    set({ currentJournal: { ...currentJournal, pages: updatedPages } });

    db.pages.where('journalId').equals(currentJournal.metadata.id).toArray().then(records => {
      const targetRecord = records.find(r => r.pageData.pageNumber === pageIdx);
      if (targetRecord) {
        db.pages.put({ id: targetRecord.id, journalId: currentJournal.metadata.id, pageData: updatedPages[pageIdx] });
      }
    });
  },

  turnToPage: (index) => {
    const { currentJournal } = get();
    if (!currentJournal || index < 0 || index >= currentJournal.pages.length) return;
    set({ currentPageIndex: index });
  },

  /**
   * Cold Storage Exporter Core
   * Pulls parent schema and subpage vector clusters, bundling them into a portable backup block.
   */
  exportJournalData: async (id) => {
    const metadata = await db.journals.get(id);
    if (!metadata) throw new Error("Journal entity target unresolved");
    
    const linkedPages = await db.pages.where('journalId').equals(id).toArray();
    const packagePayload = {
      version: "1.0.0",
      exportTimestamp: Date.now(),
      metadata,
      pages: linkedPages.map(p => p.pageData)
    };
    return JSON.stringify(packagePayload, null, 2);
  },

  /**
   * Portability Importer Core
   * Unpacks a valid Petal Studio JSON data payload back into IndexedDB.
   */
  importJournalData: async (jsonString) => {
    const payload = JSON.parse(jsonString);
    if (!payload.metadata || !payload.pages) throw new Error("Invalid schema structure");

    const newJournalId = crypto.randomUUID();
    
    // Inject overwritten context variables to decouple from original IDs safely
    await db.journals.add({
      ...payload.metadata,
      id: newJournalId,
      title: `${payload.metadata.title} (Imported)`,
      updatedAt: Date.now()
    });

    for (let i = 0; i < payload.pages.length; i++) {
      await db.pages.add({
        id: crypto.randomUUID(),
        journalId: newJournalId,
        pageData: {
          ...payload.pages[i],
          id: crypto.randomUUID()
        }
      });
    }
    return newJournalId;
  }
}));