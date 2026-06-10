'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useJournalStore } from '../../store/useJournalStore';

interface Point {
  x: number;
  y: number;
  t: number; // Timestamp for calculation of dynamic stroke velocity
}

export default function CanvasContainer() {
  const { currentJournal, currentPageIndex, activeTool, brushColor, brushWidth, addStroke, updateElementTransform } = useJournalStore();
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [drawingSide, setDrawingSide] = useState<'left' | 'right' | null>(null);
  const [isDrawingLocal, setIsDrawingLocal] = useState(false);
  const lastPoints = useRef<Point[]>([]);
  
  const leftPageIndex = currentPageIndex;
  const rightPageIndex = currentPageIndex + 1;

  const leftPageData = currentJournal?.pages[leftPageIndex];
  const rightPageData = currentJournal?.pages[rightPageIndex];

  /**
   * Chaikin's Corner Cutting Algorithm
   * Recursively smooths irregular raw pointer inputs into elegant geometric curves.
   */
  const smoothPoints = (pts: {x: number, y: number}[], iterations: number = 1): {x: number, y: number}[] => {
    if (pts.length < 3) return pts;
    let output = [...pts];
    
    for (let iter = 0; iter < iterations; iter++) {
      const nextPts: {x: number, y: number}[] = [output[0]];
      for (let i = 0; i < output.length - 1; i++) {
        const p0 = output[i];
        const p1 = output[i + 1];
        
        // Cut corners at 25% and 75% thresholds along vector paths
        nextPts.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
        nextPts.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
      }
      nextPts.push(output[output.length - 1]);
      output = nextPts;
    }
    return output;
  };

  /**
   * Premium Vector Render Loop
   * Processes vector stroke historical points to draw variable-width fountain ink or highlighter bars.
   */
  const drawStrokesForPage = (canvas: HTMLCanvasElement | null, pageData: any) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    pageData?.strokes?.forEach((stroke: any) => {
      if (stroke.points.length < 2) return;
      
      const smoothed = smoothPoints(stroke.points, 2);
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      if (stroke.type === 'pen') {
        // Fountain Pen Variant Width Simulation
        ctx.lineWidth = stroke.width;
        ctx.moveTo(smoothed[0].x, smoothed[0].y);
        for (let i = 1; i < smoothed.length; i++) {
          ctx.lineTo(smoothed[i].x, smoothed[i].y);
        }
        ctx.stroke();
      } else {
        // Highlighter Constant Chisel Alpha Overlay
        ctx.lineWidth = stroke.width * 2.5;
        ctx.moveTo(smoothed[0].x, smoothed[0].y);
        for (let i = 1; i < smoothed.length; i++) {
          ctx.lineTo(smoothed[i].x, smoothed[i].y);
        }
        ctx.stroke();
      }
    });
  };

  const syncCanvasDimensions = () => {
    if (containerRef.current && leftCanvasRef.current && rightCanvasRef.current) {
      const halfWidth = containerRef.current.clientWidth / 2;
      const height = containerRef.current.clientHeight;

      leftCanvasRef.current.width = halfWidth;
      leftCanvasRef.current.height = height;
      rightCanvasRef.current.width = halfWidth;
      rightCanvasRef.current.height = height;

      drawStrokesForPage(leftCanvasRef.current, leftPageData);
      drawStrokesForPage(rightCanvasRef.current, rightPageData);
    }
  };

  useEffect(() => {
    syncCanvasDimensions();
    window.addEventListener('resize', syncCanvasDimensions);
    return () => window.removeEventListener('resize', syncCanvasDimensions);
  }, [leftPageData?.strokes, rightPageData?.strokes, currentPageIndex, currentJournal]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>, side: 'left' | 'right') => {
    if (activeTool === 'select') return;
    setIsDrawingLocal(true);
    setDrawingSide(side);
    const rect = e.currentTarget.getBoundingClientRect();
    lastPoints.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top, t: Date.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingLocal || !drawingSide || activeTool === 'select') return;
    const canvas = drawingSide === 'left' ? leftCanvasRef.current : rightCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const now = Date.now();
    
    lastPoints.current.push({ x: currentX, y: currentY, t: now });

    // Live viewport feedback stream
    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (activeTool === 'highlighter') {
      ctx.lineWidth = brushWidth * 2.5;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.lineWidth = brushWidth;
      ctx.globalAlpha = 1.0;
    }

    const len = lastPoints.current.length;
    if (len > 1) {
      const prev = lastPoints.current[len - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingLocal || !drawingSide) return;
    setIsDrawingLocal(false);
    
    if (lastPoints.current.length > 1) {
      const targetPageIndex = drawingSide === 'left' ? leftPageIndex : rightPageIndex;
      
      // Clean structure mapping to strip timestamp payloads before database commits
      const standardizedPoints = lastPoints.current.map(p => ({ x: p.x, y: p.y }));
      
      const newStroke = {
        id: crypto.randomUUID(),
        type: activeTool,
        color: brushColor,
        width: brushWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
        points: standardizedPoints
      };
      
      useJournalStore.getState().addStroke(newStroke, targetPageIndex);
    }
    
    lastPoints.current = [];
    setDrawingSide(null);
    syncCanvasDimensions(); // Force accurate anti-aliased redraw
  };

  const getBackgroundClass = (type: string, value: string) => {
    if (type === 'vintage') return 'bg-[#F2EFE9]';
    if (type === 'minimal') return 'bg-[#FCFBFA]';
    if (type === 'planner') return 'bg-[#F9F8F3] bg-[linear-gradient(#EAE6DF_1px,transparent_1px)] bg-[size:100%_24px]';
    return 'bg-white';
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div 
        ref={containerRef} 
        className="relative w-full h-[70vh] aspect-[1.4] max-h-[680px] bg-[#E6E1DA] rounded-2xl shadow-2xl border border-stone-300 p-3 select-none overflow-hidden flex"
        style={{ perspective: 1500 }}
      >
        {/* LEFT COMPARTMENT HARDBOOK SPREAD */}
        <div className={`relative flex-1 h-full shadow-[inset_-20px_0_30px_rgba(0,0,0,0.03)] border-r border-stone-200/50 rounded-l-lg overflow-hidden ${leftPageData ? getBackgroundClass(leftPageData.backgroundType, leftPageData.backgroundValue) : 'bg-stone-300/40'}`}>
          {leftPageData && (
            <div className="absolute inset-0">
              {leftPageData.backgroundValue === 'aged' && <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#C4BEB3_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />}
              
              {leftPageData.elements?.map((el: any) => (
                <motion.div
                  key={el.id}
                  drag={activeTool === 'select'}
                  dragMomentum={false}
                  onDrag={(e, info) => {
                    const deltaX = (info.delta.x / (containerRef.current?.clientWidth || 1) * 2) * 100;
                    const deltaY = (info.delta.y / (containerRef.current?.clientHeight || 1)) * 100;
                    useJournalStore.getState().updateElementTransform(el.id, { x: el.transform.x + deltaX, y: el.transform.y + deltaY }, leftPageIndex);
                  }}
                  style={{ position: 'absolute', left: `${el.transform.x}%`, top: `${el.transform.y}%`, width: `${el.transform.width}%`, zIndex: el.transform.zIndex }}
                  className="absolute cursor-grab active:cursor-grabbing pointer-events-auto"
                >
                  <img src={el.assetUrl} alt="Sticker" className="w-full h-auto drop-shadow-md select-none" draggable={false} />
                </motion.div>
              ))}

              <canvas
                ref={leftCanvasRef}
                className="absolute inset-0 z-20"
                onPointerDown={(e) => handlePointerDown(e, 'left')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              <span className="absolute bottom-4 left-6 text-[10px] font-serif italic text-stone-400">pg. {leftPageIndex + 1}</span>
            </div>
          )}
        </div>

        {/* METALLIC RING WIRE BINDER SPINE */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/15 via-black/35 to-black/15 z-30 pointer-events-none flex flex-col justify-between items-center py-6">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="w-5 h-2 bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 rounded-full shadow-md border-x border-stone-600/40 opacity-90" />
          ))}
        </div>

        {/* RIGHT COMPARTMENT HARDBOOK SPREAD */}
        <div className={`relative flex-1 h-full shadow-[inset_20px_0_30px_rgba(0,0,0,0.03)] rounded-r-lg overflow-hidden ${rightPageData ? getBackgroundClass(rightPageData.backgroundType, rightPageData.backgroundValue) : 'bg-stone-300/40'}`}>
          {rightPageData && (
            <div className="absolute inset-0">
              {rightPageData.backgroundValue === 'aged' && <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#C4BEB3_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />}
              
              {rightPageData.elements?.map((el: any) => (
                <motion.div
                  key={el.id}
                  drag={activeTool === 'select'}
                  dragMomentum={false}
                  onDrag={(e, info) => {
                    const deltaX = (info.delta.x / (containerRef.current?.clientWidth || 1) * 2) * 100;
                    const deltaY = (info.delta.y / (containerRef.current?.clientHeight || 1)) * 100;
                    useJournalStore.getState().updateElementTransform(el.id, { x: el.transform.x + deltaX, y: el.transform.y + deltaY }, rightPageIndex);
                  }}
                  style={{ position: 'absolute', left: `${el.transform.x}%`, top: `${el.transform.y}%`, width: `${el.transform.width}%`, zIndex: el.transform.zIndex }}
                  className="absolute cursor-grab active:cursor-grabbing pointer-events-auto"
                >
                  <img src={el.assetUrl} alt="Sticker" className="w-full h-auto drop-shadow-md select-none" draggable={false} />
                </motion.div>
              ))}

              <canvas
                ref={rightCanvasRef}
                className="absolute inset-0 z-20"
                onPointerDown={(e) => handlePointerDown(e, 'right')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              <span className="absolute bottom-4 right-6 text-[10px] font-serif italic text-stone-400">pg. {rightPageIndex + 1}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}