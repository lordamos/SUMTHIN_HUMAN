import React, { useState } from 'react';
import { Search, User, PenTool, Target, CheckCircle2, ChevronRight, Sparkles, Activity } from 'lucide-react';

export function IntentFirstSurface() {
  const [activeIntent, setActiveIntent] = useState('detect');

  return (
    <div className="min-h-screen bg-[#06060c] text-slate-300 font-sans p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            HayL3ditor
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Hayle Editor
          </div>
        </div>
        <div className="text-xs font-bold tracking-[0.2em] text-pink-500 uppercase">
          AI Forensics
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            LIVE
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            AI READY
          </div>
          <div className="text-slate-500">14:02 PST</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
            JD
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6">
          <button className="px-6 py-2 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-sm font-semibold flex items-center gap-2">
            <span className="text-lg">✏️</span> Text Analyzer
          </button>
          <button className="px-6 py-2 rounded-full bg-white/5 text-slate-400 hover:text-slate-300 transition-colors text-sm font-semibold flex items-center gap-2">
            <span className="text-lg">☐</span> Image Analyzer
          </button>
        </div>

        {/* Main Panel */}
        <div className="relative w-full rounded-2xl border border-purple-500/30 bg-[#0a0a12] p-8 shadow-[0_0_40px_-15px_rgba(168,85,247,0.15)] flex flex-col gap-8">
          
          {/* Top Section - Intent Selector */}
          <div>
            <h2 className="text-white text-xl font-bold mb-4">What's your goal?</h2>
            <div className="grid grid-cols-4 gap-4">
              {/* Card 1: Detect AI (Active) */}
              <button 
                onClick={() => setActiveIntent('detect')}
                className={`relative flex flex-col items-center justify-center gap-3 p-4 h-[100px] rounded-xl transition-all border
                  ${activeIntent === 'detect' 
                    ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                {activeIntent === 'detect' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-pink-500" />
                )}
                <Search className={`w-6 h-6 ${activeIntent === 'detect' ? 'text-pink-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${activeIntent === 'detect' ? 'text-pink-100' : 'text-slate-400'}`}>
                  Detect AI
                </span>
              </button>

              {/* Card 2: Humanize */}
              <button 
                onClick={() => setActiveIntent('humanize')}
                className={`relative flex flex-col items-center justify-center gap-3 p-4 h-[100px] rounded-xl transition-all border
                  ${activeIntent === 'humanize' 
                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                {activeIntent === 'humanize' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-purple-500" />
                )}
                <User className={`w-6 h-6 ${activeIntent === 'humanize' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${activeIntent === 'humanize' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Humanize
                </span>
              </button>

              {/* Card 3: Improve Writing */}
              <button 
                onClick={() => setActiveIntent('improve')}
                className={`relative flex flex-col items-center justify-center gap-3 p-4 h-[100px] rounded-xl transition-all border
                  ${activeIntent === 'improve' 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_-5px_rgba(129,140,248,0.3)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                {activeIntent === 'improve' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-indigo-500" />
                )}
                <PenTool className={`w-6 h-6 ${activeIntent === 'improve' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${activeIntent === 'improve' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Improve Writing
                </span>
              </button>

              {/* Card 4: Change Tone */}
              <button 
                onClick={() => setActiveIntent('tone')}
                className={`relative flex flex-col items-center justify-center gap-3 p-4 h-[100px] rounded-xl transition-all border
                  ${activeIntent === 'tone' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                {activeIntent === 'tone' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                )}
                <Target className={`w-6 h-6 ${activeIntent === 'tone' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${activeIntent === 'tone' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Change Tone
                </span>
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

          {/* Contextual Tool Surface */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black tracking-widest text-pink-500 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Tools for AI Detection
            </h3>
            
            <div className="flex flex-col gap-4 bg-[#0d0d16] border border-white/5 p-6 rounded-xl">
              <textarea 
                placeholder="Paste text to scan for AI patterns..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 h-40 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 resize-none"
              />
              
              <button className="w-full py-4 rounded-lg bg-gradient-to-r from-pink-600 hover:from-pink-500 to-purple-600 hover:to-purple-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Scan for AI
              </button>
              
              <div className="flex items-center justify-between mt-2 text-sm">
                <div className="flex gap-6">
                  <button className="text-slate-400 hover:text-pink-400 transition-colors flex items-center gap-1">
                    Include perplexity analysis <ChevronRight className="w-3 h-3" />
                  </button>
                  <button className="text-slate-400 hover:text-pink-400 transition-colors flex items-center gap-1">
                    Check writing style fingerprint <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 italic">
                  Switching goal above will change these tools
                </div>
              </div>
            </div>
          </div>

          {/* Ghost section of unused tools */}
          <div className="mt-4 border border-white/5 rounded-xl p-6 bg-black/20 opacity-30 select-none pointer-events-none relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <span className="bg-black/80 px-4 py-2 rounded-full border border-white/10 text-xs font-bold tracking-widest uppercase text-slate-400 shadow-xl">
                Hidden in this mode
              </span>
            </div>
            
            <div className="filter blur-[1px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-8 w-32 bg-white/10 rounded flex items-center px-3 gap-2">
                  <Sparkles className="w-4 h-4 text-white/40" />
                  <div className="h-2 w-16 bg-white/20 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-white/10 rounded flex items-center justify-center">
                  <div className="h-2 w-12 bg-white/20 rounded"></div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 flex-1 bg-white/5 border border-white/10 rounded-lg"></div>
                <div className="h-10 flex-1 bg-white/5 border border-white/10 rounded-lg"></div>
                <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Insight Badge */}
          <div className="absolute -bottom-4 -right-4 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-200 text-xs py-2 px-4 rounded-full shadow-lg max-w-sm text-center">
            <strong>Design axis:</strong> Intent-first vs. Always-on toolbox — tools surface based on declared goal
          </div>
        </div>
      </div>
    </div>
  );
}
