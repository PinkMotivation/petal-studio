import { type JournalPage } from '../types/journal';

export interface PlannerConfig {
  year: number;
  theme: 'minimal' | 'vintage' | 'planner';
}

export function generatePlannerPages(config: PlannerConfig): JournalPage[] {
  const generatedPages: JournalPage[] = [];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let pageNumberCounter = 0;

  // 1. Index Cover Page (Single leaf entry block)
  generatedPages.push({
    id: `plan-cover-${crypto.randomUUID()}`,
    pageNumber: pageNumberCounter++,
    backgroundType: config.theme,
    backgroundValue: 'aged',
    elements: [],
    strokes: []
  });

  // 2. Continuous Double Page Spreads for each month layout
  months.forEach((month) => {
    // Left Leaf: Monthly Focus, Trackers & Vision Matrix
    generatedPages.push({
      id: `plan-month-left-${month.toLowerCase()}`,
      pageNumber: pageNumberCounter++,
      backgroundType: 'planner',
      backgroundValue: 'lined',
      elements: [],
      strokes: [],
      linkedTabId: months.indexOf(month) + 1 // Link to corresponding side tab
    });

    // Right Leaf: Grid Calendar/Bullet Space block
    generatedPages.push({
      id: `plan-month-right-${month.toLowerCase()}`,
      pageNumber: pageNumberCounter++,
      backgroundType: config.theme,
      backgroundValue: 'aged',
      elements: [],
      strokes: []
    });
  });

  return generatedPages;
}