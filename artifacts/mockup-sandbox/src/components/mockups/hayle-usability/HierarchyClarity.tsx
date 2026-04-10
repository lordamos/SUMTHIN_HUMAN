import React, { useState } from 'react';
import {
  Pencil,
  Image as ImageIcon,
  Clock,
  Upload,
  Cloud,
  X,
  Volume2,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  ChevronUp
} from 'lucide-react';

export function HierarchyClarity() {
  const [text, setText] = useState('');

  return (
    <div className="min-h-screen bg-[#06060c] text-slate-300 font-sans selection:bg-pink-500/30 flex flex-col relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* 1. Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 bg-black/40 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              HayL3ditor
            </h1>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Hayle Editor
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <span className="text-sm font-bold tracking-[0.3em] text-pink-500/80">
            AI FORENSICS
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            LIVE
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            AI READY
          </div>
          <div className="px-3 py-1 font-mono text-slate-400">
            {new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.4)] flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
        </div>
      </header>

      {/* 2. Tab bar */}
      <div className="flex justify-center mt-6 relative z-10">
        <div className="flex bg-slate-900/50 p-1 rounded-full border border-slate-800 backdrop-blur-sm">
          <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-pink-500/15 text-pink-400 font-medium text-sm transition-all shadow-[0_0_15px_rgba(236,72,153,0.15)]">
            <Pencil className="w-4 h-4" />
            Text Analyzer
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-full text-slate-500 font-medium text-sm hover:text-slate-300 transition-colors">
            <ImageIcon className="w-4 h-4" />
            Image Analyzer
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center w-full max-w-[1000px] mx-auto px-6 mt-8 relative z-10">
        
        {/* Tradeoff badge */}
        <div className="absolute -top-4 right-0 flex items-center gap-2 text-[10px] font-medium text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="text-pink-500">↑</span>
          Hierarchy Mode — Primary actions foregrounded, utilities hidden
        </div>

        {/* 01 - INPUT SECTION */}
        <div className="w-full flex flex-col mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-bold text-pink-500 tracking-widest bg-pink-500/10 px-2 py-0.5 rounded">01 — INPUT</span>
            <div className="h-px bg-gradient-to-r from-pink-500/20 to-transparent flex-1" />
          </div>

          {/* 3. Main panel (textarea DOMINANT) */}
          <div className="relative group w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0a0a12] border border-pink-500/40 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.15)] overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-center px-4 py-3 bg-[#0f0f18] border-b border-pink-500/20">
                <span className="text-xs font-medium text-slate-400">Text Input</span>
                <button className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                  <Clock className="w-3 h-3" />
                  History
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste text for forensic analysis..."
                  className="w-full h-[240px] bg-transparent resize-none outline-none p-6 text-xl text-slate-200 placeholder:text-slate-700 leading-relaxed font-serif"
                />
                
                {/* Floating tool buttons (low visual weight) */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors backdrop-blur-sm opacity-50 hover:opacity-100" title="Audio Reader">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-purple-400 hover:bg-purple-900/50 hover:text-purple-300 transition-colors backdrop-blur-sm opacity-50 hover:opacity-100" title="Auto-Predict">
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Utility row below textarea (tiny, muted) */}
              <div className="flex justify-between items-center px-4 py-3 bg-[#0c0c14] border-t border-slate-800/50 text-[10px] text-slate-500">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                    <Upload className="w-3 h-3" /> Local File
                  </button>
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                    <Cloud className="w-3 h-3" /> Cloud
                  </button>
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors" onClick={() => setText('')}>
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="font-mono">
                  {text.split(/\s+/).filter(w => w.length > 0).length} Words | {text.length}/20000 Chars
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 02 - ACTIONS SECTION */}
        <div className="w-full flex flex-col mb-12">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="h-px bg-gradient-to-l from-purple-500/20 to-transparent flex-1 max-w-[100px]" />
            <span className="text-[10px] font-bold text-purple-400 tracking-widest bg-purple-500/10 px-2 py-0.5 rounded">02 — ACTIONS</span>
            <div className="h-px bg-gradient-to-r from-purple-500/20 to-transparent flex-1 max-w-[100px]" />
          </div>

          {/* 4. Action buttons row */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button className="h-[52px] px-8 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold text-lg transition-all shadow-lg flex items-center gap-2">
              Analyze Text
            </button>

            <div className="flex h-[52px] shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-full overflow-hidden">
              <button className="px-8 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-lg transition-all flex items-center gap-2 h-full">
                <User className="w-5 h-5" />
                Humanize
              </button>
              <div className="w-px bg-white/20 h-full"></div>
              <button className="px-4 bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-1 h-full text-sm font-medium">
                Casual <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <button className="h-[44px] px-6 rounded-full bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-medium text-sm transition-all flex items-center gap-2">
              <User className="w-4 h-4" />
              Train AI Style
            </button>
          </div>

          {/* 5. Secondary row (Collapsed) */}
          <div className="flex justify-center mt-6">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
              <Sparkles className="w-3 h-3" />
              Fix Spelling & Grammar
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* 6. Empty state area nudge */}
        <div className="flex flex-col items-center justify-center mt-8 mb-20 opacity-50">
          <span className="text-sm text-slate-500 tracking-wide font-medium flex flex-col items-center gap-2 animate-pulse">
            <ChevronDown className="w-4 h-4" />
            Your results appear here
          </span>
        </div>

      </main>

      {/* 7. Footer */}
      <footer className="mt-auto border-t border-slate-800/50 bg-[#06060c] py-4 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">HayL3ditor</span>
            <span>•</span>
            <span>HAYLE EDITOR</span>
            <span>•</span>
            <span className="flex items-center gap-1">Powered by <span className="text-indigo-400 font-medium">Gemini</span></span>
          </div>
          <div>
            v2.1 <span className="mx-2">|</span> Precision AI Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
