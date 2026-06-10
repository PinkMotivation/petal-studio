'use client';
import React from 'react';
export default function BookCover({ metadata }) {
  return (
    <div className="relative w-[140px] h-[190px] rounded-r-xl shadow-xl overflow-hidden border" style={{ backgroundColor: metadata.coverColor }}>
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent" />
      <div className="absolute inset-4 border border-white/20 rounded p-2 text-white font-serif text-xs truncate">{metadata.title}</div>
    </div>
  );
}