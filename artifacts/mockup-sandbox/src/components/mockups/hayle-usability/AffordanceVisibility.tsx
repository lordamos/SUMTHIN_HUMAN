import React, { useState } from 'react';
import { 
  Pencil, Image as ImageIcon, Clock, Play, Sparkles, 
  Upload, Cloud, X, ChevronDown, Check, User, Target, 
  Settings2, AlignLeft, RefreshCw, Scissors, Maximize2, 
  Type, BookOpen, ChevronRight, Loader2
} from 'lucide-react';

export function AffordanceVisibility() {
  const [text, setText] = useState('The suspect was seen leaving the premises at approximately 23:00 hours. They appeared to be carrying a large duffel bag. We need to analyze this statement for inconsistencies.');

  return (
    <div className="min-h-screen bg-[#06060c] text-slate-300 font-sans selection:bg-pink-500/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            H
          </div>
          <div>
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 font-black text-lg tracking-tight">
              HayL3ditor
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 tracking-widest">HAYLE EDITOR</p>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-center">
          <span className="text-pink-500 text-xs font-bold tracking-[0.3em]">AI FORENSICS</span>
          <div className="h-0.5 w-12 bg-pink-500/50 mt-1 rounded-full"></div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full border border-purple-400/20 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              AI READY
            </span>
            <span className="text-xs text-slate-400 font-mono ml-2">14:23:05</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer hover:bg-slate-700 transition-colors">
            <User size={14} className="text-slate-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left Column (Main Editor) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tab Bar */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl bg-[#11111a] text-pink-400 font-medium border-t border-x border-pink-500/30 shadow-[0_-4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative z-10 transition-colors">
              <Pencil size={16} />
              Text Analyzer
              <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#11111a]"></div>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-slate-300 transition-colors shadow-[0_-2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] border border-transparent cursor-pointer">
              <ImageIcon size={16} />
              Image Analyzer
            </button>
          </div>

          {/* Main Editor Card */}
          <div className="bg-[#11111a] border border-purple-500/30 rounded-2xl rounded-tl-none shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative mt-[-2px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlignLeft size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Text Input</span>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/5 cursor-pointer">
                <Clock size={14} />
                History
              </button>
            </div>

            {/* Textarea Area */}
            <div className="relative flex-1 p-4 min-h-[350px] flex flex-col">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text for forensic analysis..."
                className="w-full h-full min-h-[250px] bg-black/20 text-slate-200 placeholder-slate-600 resize-none outline-none text-lg leading-relaxed rounded-xl p-4 transition-shadow border border-white/5"
                style={{ boxShadow: '0 0 0 2px rgba(236,72,153,0.5)' }} // Explicit focus ring
              />
              
              {/* Floating Action Buttons */}
              <div className="absolute bottom-8 right-8 flex gap-3">
                
                {/* Audio Reader with Tooltip */}
                <div className="relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg border border-white/10 before:content-[''] before:absolute before:-bottom-1.5 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800 opacity-100 z-10 pointer-events-none">
                    Read text aloud
                  </div>
                  <button className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10 hover:bg-slate-700 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
                    <Play size={18} className="ml-0.5" />
                  </button>
                </div>

                {/* Auto-Predict with Tooltip */}
                <div className="relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg border border-white/10 before:content-[''] before:absolute before:-bottom-1.5 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800 opacity-100 z-10 pointer-events-none">
                    AI Auto-Predict
                  </div>
                  <button className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/30 hover:text-indigo-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
                    <Sparkles size={18} />
                  </button>
                </div>

              </div>
            </div>

            {/* Bottom Editor Bar */}
            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/10 cursor-pointer">
                  <Upload size={14} />
                  Local File
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/10 cursor-pointer">
                  <Cloud size={14} />
                  Cloud
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-red-500/20 cursor-pointer">
                  <X size={14} />
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium">
                24 Words | 163/20000 Chars
              </div>
            </div>
          </div>

          {/* Core Actions */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Analyzing State Button */}
            <button className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-semibold py-3.5 px-6 rounded-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] opacity-90 cursor-wait">
              <Loader2 size={18} className="animate-spin text-purple-400" />
              Analyzing...
            </button>
            
            {/* Humanize Button (Hover State) */}
            <div className="flex-1 min-w-[250px] flex items-stretch h-14 relative z-20">
              <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-6 rounded-l-xl border border-pink-400/50 shadow-[0_4px_20px_rgba(236,72,153,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transform scale-[1.02] translate-y-[-2px] transition-all cursor-pointer">
                <User size={18} />
                Humanize
              </button>
              {/* Select Dropdown styling */}
              <div className="relative flex items-center bg-slate-800 border border-l-0 border-white/10 rounded-r-xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] pr-3 group cursor-pointer hover:bg-slate-700">
                <select className="appearance-none bg-transparent text-slate-300 font-medium pl-4 pr-6 py-3 outline-none cursor-pointer w-full h-full relative z-10">
                  <option>Casual</option>
                  <option>Professional</option>
                  <option>Academic</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 text-slate-400 group-hover:text-slate-200 pointer-events-none" />
              </div>
            </div>

            <button className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold py-3.5 px-6 rounded-xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all cursor-pointer">
              <Target size={18} className="text-indigo-400" />
              Train AI Style
            </button>
          </div>

        </div>

        {/* Right Column (Secondary Actions & Options) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Open Dropdown Simulation */}
          <div className="bg-slate-800/80 border border-indigo-500/30 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col relative z-30 transform scale-100 transition-transform origin-top">
            
            <button className="flex items-center justify-between w-full p-4 bg-slate-800 border-b border-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                Fix Spelling & Grammar
              </span>
              <ChevronDown size={16} className="text-slate-400 transform rotate-180 transition-transform" />
            </button>
            
            <div className="flex flex-col p-2 gap-1 bg-slate-900/50 backdrop-blur-xl max-h-[400px] overflow-y-auto">
              
              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <Check size={16} />
                  Fix Spelling
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
              
              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-slate-400" />
                  Reword Text
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <Sparkles size={16} className="text-purple-400" />
                  Rephrase with GPT
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <Scissors size={16} className="text-slate-400" />
                  Make Shorter
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <Maximize2 size={16} className="text-slate-400" />
                  Make Longer
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <Type size={16} className="text-slate-400" />
                  Simplify Language
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button className="flex items-center justify-between w-full p-3 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white font-medium border border-transparent hover:border-white/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] cursor-pointer">
                <span className="flex items-center gap-3">
                  <BookOpen size={16} className="text-slate-400" />
                  Improve Readability
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>

            </div>
          </div>

          {/* Empty State / Info Panel Below */}
          {text.length === 0 && (
             <div className="flex-1 min-h-[200px] border border-dashed border-white/10 rounded-xl bg-black/20 flex flex-col items-center justify-center text-center p-6 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center border border-white/5">
                 <div className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 font-black text-2xl">H</div>
              </div>
              <div>
                <h3 className="text-pink-400 font-bold text-sm tracking-widest uppercase mb-1">AI Forensics</h3>
                <p className="text-slate-500 text-sm">Paste text in the editor to begin analysis.</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Tradeoff Caption & Footer */}
      <footer className="mt-auto p-6 flex flex-col items-center gap-4">
        
        <div className="bg-slate-800 text-slate-300 text-sm px-4 py-2 rounded-full border border-white/10 shadow-lg font-medium">
          ↑ <span className="text-pink-400 font-bold">Affordance Mode</span> — All interactions made explicit; page is denser
        </div>

        <div className="w-full max-w-7xl flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-pink-500/50 to-purple-600/50 flex items-center justify-center text-[8px] text-white">H</div>
            HayL3ditor © 2024
          </div>
          <div>v2.4.1.beta</div>
        </div>
      </footer>

    </div>
  );
}
