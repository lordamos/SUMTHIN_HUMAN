import React from "react";
import { 
  Cloud, 
  Upload, 
  Trash2, 
  ArrowRight, 
  Lock, 
  Settings2,
  Wand2,
  CheckCircle2,
  Activity,
  ShieldAlert,
  Clock,
  User
} from "lucide-react";

export function SequentialPipeline() {
  return (
    <div className="min-h-screen bg-[#06060c] text-slate-300 font-sans selection:bg-pink-500/30 overflow-x-hidden pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a10]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.3)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 tracking-tight leading-none">
              HayL3ditor
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">HAYLE EDITOR</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-xs font-bold tracking-[0.3em] text-pink-500/80 uppercase">
            AI Forensics
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            LIVE
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
            AI READY
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            14:22 UTC
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-8 px-6">
        {/* Tab Bar */}
        <div className="flex items-center gap-2 mb-10">
          <button className="px-5 py-2.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 text-sm font-medium flex items-center gap-2 shadow-[0_0_10px_rgba(236,72,153,0.1)]">
            <span className="text-lg">✏️</span> Text Analyzer
          </button>
          <button className="px-5 py-2.5 rounded-full bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 text-sm font-medium flex items-center gap-2 transition-colors">
            <span className="text-lg">☐</span> Image Analyzer
          </button>
        </div>

        {/* Pipeline Stepper */}
        <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto px-4">
          <div className="flex flex-col items-center gap-3 w-24">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.4)] text-white font-bold text-lg border-2 border-[#06060c]">
              1
            </div>
            <span className="text-xs font-bold tracking-widest text-pink-400">INPUT</span>
          </div>

          <div className="flex-1 h-px border-t-2 border-dashed border-pink-500/30 -mt-6"></div>

          <div className="flex flex-col items-center gap-3 w-24">
            <div className="w-12 h-12 rounded-full bg-[#12121a] flex items-center justify-center border-2 border-slate-700 text-slate-500 font-bold text-lg">
              2
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-600">ANALYZE</span>
          </div>

          <div className="flex-1 h-px border-t-2 border-dashed border-slate-800 -mt-6"></div>

          <div className="flex flex-col items-center gap-3 w-24">
            <div className="w-12 h-12 rounded-full bg-[#12121a] flex items-center justify-center border-2 border-slate-700 text-slate-500 font-bold text-lg">
              3
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-600">REFINE</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* STEP 1: Active Panel */}
          <div className="relative rounded-2xl border border-pink-500/50 bg-[#0a0a10]/80 p-1 shadow-[0_0_30px_rgba(236,72,153,0.1)] overflow-hidden">
            {/* Glow effect behind panel */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-pink-500/10 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="relative bg-[#0a0a10] rounded-xl p-8 border border-white/5 z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-2 py-1 rounded bg-pink-500/20 text-pink-400 text-xs font-bold tracking-wider border border-pink-500/30">
                  STEP 1
                </div>
                <h2 className="text-lg font-medium text-white tracking-tight">Paste Your Text</h2>
              </div>

              <textarea 
                className="w-full h-[220px] bg-[#06060c] border border-pink-500/30 rounded-xl p-5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all resize-none font-mono text-sm leading-relaxed"
                placeholder="Paste your content here..."
              ></textarea>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors border border-white/5">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    Local File
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors border border-white/5">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    Cloud
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 text-sm font-medium transition-colors ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  0 WORDS | 0 CHARS
                </div>
              </div>

              <button className="w-full mt-8 relative group overflow-hidden rounded-xl p-px">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-pink-600 to-purple-600 px-8 py-5 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide shadow-lg group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-shadow">
                  Analyze with AI
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Grid for Steps 2 & 3 */}
          <div className="grid grid-cols-2 gap-6 pt-6">
            
            {/* STEP 2: Locked */}
            <div className="relative rounded-2xl border border-slate-800 bg-[#0a0a10]/50 overflow-hidden">
              {/* Content (Dimmed) */}
              <div className="p-8 opacity-20 blur-[2px] pointer-events-none transition-all duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs font-bold tracking-wider">
                    STEP 2
                  </div>
                  <h2 className="text-lg font-medium text-white">Review Analysis</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <span className="text-sm text-slate-400">AI Probability</span>
                    <span className="text-2xl font-bold text-white">--%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-xs text-slate-500 block mb-1">Human Score</span>
                      <span className="text-lg text-slate-300">--</span>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-xs text-slate-500 block mb-1">Perplexity</span>
                      <span className="text-lg text-slate-300">--</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lock Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06060c]/40 backdrop-blur-[1px]">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-sm font-medium text-slate-300 tracking-wide">Unlocks after Step 1</div>
                <div className="text-xs text-slate-500 mt-2">Complete analysis to view results</div>
              </div>
            </div>

            {/* STEP 3: Locked */}
            <div className="relative rounded-2xl border border-slate-800 bg-[#0a0a10]/50 overflow-hidden">
              {/* Content (Dimmed) */}
              <div className="p-8 opacity-20 blur-[2px] pointer-events-none transition-all duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs font-bold tracking-wider">
                    STEP 3
                  </div>
                  <h2 className="text-lg font-medium text-white">Humanize & Refine</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-300">Humanize Text</span>
                    </div>
                    <div className="w-10 h-6 bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings2 className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-300">Target Tone</span>
                    </div>
                    <span className="text-xs text-slate-500">Professional ▼</span>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-300">Fix Grammar</span>
                    </div>
                    <div className="w-10 h-6 bg-slate-800 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Lock Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06060c]/40 backdrop-blur-[1px]">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-sm font-medium text-slate-300 tracking-wide">Unlocks after Step 2</div>
                <div className="text-xs text-slate-500 mt-2">Tools activate upon analysis</div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Insight Badge */}
      <div className="fixed bottom-6 right-6 max-w-sm bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 p-4 rounded-xl shadow-2xl z-50">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-indigo-300 font-bold text-sm mb-1 uppercase tracking-wider">Design Axis</h4>
            <p className="text-indigo-200/70 text-sm leading-relaxed">
              <strong className="text-white font-medium">Pipeline vs. Toolbox:</strong> This variant sequences tools strictly instead of listing them as parallel options. Reduces cognitive load by focusing the user strictly on the next necessary action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
