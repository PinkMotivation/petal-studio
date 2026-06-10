export interface ElementTransform {
  x: number;       // Horizontal layout percentage offset (0-100)
  y: number;       // Vertical layout percentage offset (0-100)
  width: number;   // Width scaling percentage (0-100)
  height: number;  // Height scaling percentage (0-100)
  rotation: number;// Angle of element placement rotation
  zIndex: number;  // Visual layer ordering hierarchy
}
export interface JournalElement {
  id: string;
  type: 'sticker' | 'text' | 'image' | 'ephemera';
  assetUrl?: string;
  textContent?: string;
  transform: ElementTransform;
  isLocked: boolean;
  opacity: number;
}
export interface VectorStroke {
  id: string;
  type: 'select' | 'pen' | 'highlighter';
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[]; // Raw dynamic vector node trail coordinates
}
export interface JournalPage {
  id: string;
  pageNumber: number;
  backgroundType: 'minimal' | 'vintage' | 'planner' | string;
  backgroundValue: 'lined' | 'aged' | 'blank' | 'grid' | string;
  elements: JournalElement[];
  strokes: VectorStroke[];
  linkedTabId?: number; // Optional numeric linkage map referencing sidebar index jumps (e.g., 1-12 for Jan-Dec)
}
export interface JournalMetadata {
  id: string;
  title: string;
  coverStyle: 'linen' | 'leather' | 'hardback';
  coverColor: string;
  createdAt: number;
  updatedAt: number;
}
export interface CompleteJournal {
  metadata: JournalMetadata;
  pages: JournalPage[];
}