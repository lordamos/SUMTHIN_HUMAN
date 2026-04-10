import React, { useState } from 'react';
import { 
  Upload, 
  Cloud, 
  X, 
  ChevronDown, 
  Sparkles, 
  GripVertical,
  Activity,
  User,
  BarChart2,
  ListTodo
} from 'lucide-react';

export function WorkspaceSplit() {
  const [text, setText] = useState('');
  const [liveAnalysis, setLiveAnalysis] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#06060c] text-slate-300 p-4 md:p-6 flex flex-col font-sans overflow-hidden">
      {/* Compact Header */}
      <header className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center">
          <img
            src="/__mockup/images/logo3.png"
            alt="HayL3ditor"
            style={{ height: '32px', filter: 'brightness(1.15) drop-shadow(0 0 8px rgba(236,72,153,0.45))' }}
          />
        </div>
        
        <div className="hidden md:block text-[10px] font-mono tracking-widest text-pink-500/80 px-3 py-1 rounded-full border border-pink-500/20 bg-pink-500/5">
          AI FORENSICS
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-white/5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Online
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs">
            U
          </div>
        </div>
      </header>

      {/* Compact Tab Bar */}
      <div className="flex gap-6 text-sm mt-3 px-2 shrink-0">
        <button className="text-pink-400 border-b-2 border-pink-500 pb-2 font-medium">Text Analyzer</button>
        <button className="text-slate-500 hover:text-slate-300 pb-2 transition-colors">Image Forensics</button>
        <button className="text-slate-500 hover:text-slate-300 pb-2 transition-colors">Batch Process</button>
      </div>

      {/* Main Workspace */}
      <div className="mt-2 flex-1 flex flex-col md:flex-row border border-purple-500/20 rounded-2xl bg-[#0a0a12] shadow-2xl shadow-purple-900/10 overflow-hidden relative min-h-[500px]">
        
        {/* LEFT PANE */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#06060c]/50 border-b md:border-b-0 md:border-r border-white/5">
          {/* Pane Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
            <span className="text-[10px] font-bold tracking-wider text-pink-500">YOUR TEXT</span>
            <span className="text-xs text-slate-500 font-mono">{text.split(/\s+/).filter(Boolean).length} words</span>
          </div>
          
          {/* Editor Area */}
          <div className="flex-1 p-4 relative group min-h-[200px] md:min-h-0">
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing or paste text to analyze..."
              className="w-full h-full bg-transparent resize-none outline-none text-slate-200 placeholder:text-slate-700 leading-relaxed transition-all duration-300 border border-transparent focus:border-pink-500/30 rounded-lg p-2"
            />
          </div>

          {/* Action Footer */}
          <div className="px-4 py-3 border-t border-white/5 bg-[#06060c] shrink-0">
            {/* File Actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors border border-white/5">
                  <Upload className="w-3.5 h-3.5" /> File
                </button>
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors border border-white/5">
                  <Cloud className="w-3.5 h-3.5" /> Cloud
                </button>
              </div>
              <button 
                onClick={() => setText('')}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>

            {/* Smart Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-pink-900/20">
                <Sparkles className="w-3.5 h-3.5" /> Humanize
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                Tone: Casual <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                Fix <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden md:flex w-1.5 bg-purple-500/5 hover:bg-purple-500/20 items-center justify-center cursor-col-resize relative z-10 transition-colors group">
          <div className="w-0.5 h-8 bg-purple-500/20 group-hover:bg-purple-500/50 rounded-full flex flex-col justify-center items-center overflow-hidden">
            <GripVertical className="w-3 h-3 text-purple-400/50 -ml-[5px]" />
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#0a0a14]">
          {/* Pane Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
            <span className="text-[10px] font-bold tracking-wider text-purple-400">AI ANALYSIS</span>
            
            <button 
              onClick={() => setLiveAnalysis(!liveAnalysis)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`text-[10px] font-medium transition-colors ${liveAnalysis ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                ● Live Analysis {liveAnalysis ? 'ON' : 'OFF'}
              </span>
              <div className={`relative inline-flex items-center h-4 rounded-full w-7 transition-colors ${liveAnalysis ? 'bg-purple-600' : 'bg-slate-800 border border-white/10'}`}>
                <span className={`inline-block w-2.5 h-2.5 transform rounded-full transition-transform ${liveAnalysis ? 'translate-x-3.5 bg-white' : 'translate-x-1 bg-slate-500'}`} />
              </div>
            </button>
          </div>

          {/* Cards List */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto min-h-[300px] md:min-h-0">
            
            {/* AI Score */}
            <div className="min-h-[80px] bg-slate-900/40 border border-slate-800 border-l-2 border-l-purple-500/30 rounded-lg p-3 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-950/50 shrink-0">
                <Activity className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">AI Probability</span>
                <span className="text-xs text-slate-500 italic mt-0.5">Paste text to scan</span>
              </div>
            </div>

            {/* Human Score */}
            <div className="min-h-[80px] bg-slate-900/40 border border-slate-800 border-l-2 border-l-pink-500/30 rounded-lg p-3 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-full border border-slate-700/50 bg-slate-950/50 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-300 mb-2">Human Pattern Match</span>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-slate-600 rounded-full"></div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Awaiting analysis</span>
              </div>
            </div>

            {/* Writing Style */}
            <div className="min-h-[80px] bg-slate-900/40 border border-slate-800 border-l-2 border-l-indigo-500/30 rounded-lg p-3 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-full border border-slate-700/50 bg-slate-950/50 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">Style Fingerprint</span>
                <span className="text-xs text-slate-500 italic mt-0.5">No analysis yet</span>
              </div>
            </div>

            {/* Suggestions */}
            <div className="min-h-[80px] bg-slate-900/40 border border-slate-800 border-l-2 border-l-amber-500/30 rounded-lg p-3 flex gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-full border border-slate-700/50 bg-slate-950/50 flex items-center justify-center shrink-0 mt-0.5">
                <ListTodo className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-300 mb-1.5">Actionable Suggestions</span>
                <div className="space-y-1.5">
                  <div className="w-32 h-1 bg-slate-800 rounded-full"></div>
                  <div className="w-48 h-1 bg-slate-800 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-500 italic mt-2">Suggestions appear here after analysis</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Insight Badge */}
      <div className="hidden md:flex fixed bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-purple-500/30 px-4 py-2 rounded-full text-xs text-purple-300 shadow-xl shadow-purple-900/20 z-50 items-center gap-2">
        <Sparkles className="w-3 h-3 text-pink-400" />
        Design axis: Form-submit vs. Live workspace — output panel always visible, co-pilot model
      </div>
    </div>
  );
}
