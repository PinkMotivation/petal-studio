import Dexie, { type Table } from 'dexie';
import { type JournalMetadata, type JournalPage } from '../types/journal';
class PetalStudioDatabase extends Dexie {
  journals!: Table<JournalMetadata, string>;
  pages!: Table<{ id: string; journalId: string; pageData: JournalPage }, string>;
  constructor() {
    super('PetalStudioDB');
    this.version(1).stores({ journals: 'id, updatedAt, title', pages: 'id, journalId' });
  }
}
export const db = new PetalStudioDatabase();