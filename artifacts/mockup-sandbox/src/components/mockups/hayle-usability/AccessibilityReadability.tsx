import React, { useState } from 'react';
import {
  Brain,
  Upload,
  Cloud,
  X,
  Volume2,
  Sparkles,
  ChevronDown,
  Wand2,
  Clock,
  PenTool,
  Image as ImageIcon,
  User,
  AlertTriangle,
} from 'lucide-react';

export function AccessibilityReadability() {
  const [text, setText] = useState('');

  return (
    <div className="min-h-screen bg-[#06060c] text-white font-sans flex flex-col p-4 md:p-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
        {/* 1. Header bar */}
        <header className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Brain className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ec4899] to-[#a855f7]">
                HayL3ditor
              </h1>
              <p className="text-[14px] text-gray-300 tracking-wider font-semibold">
                HAYLE EDITOR
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <h2 className="text-[#ec4899] font-bold tracking-[0.2em] text-[15px]">
              AI FORENSICS
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></span>
              <span className="text-[14px] font-medium text-gray-200">LIVE</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" aria-hidden="true"></span>
              <span className="text-[14px] font-medium text-gray-200">AI READY</span>
            </div>
            <div className="text-[14px] text-gray-300 font-medium">12:45 PM</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a855f7] to-[#818cf8] border-2 border-[#06060c] ring-2 ring-white/20" aria-label="User Avatar"></div>
          </div>
        </header>

        {/* 2. Tab bar */}
        <div className="flex gap-2 border-b border-white/10">
          <button className="flex items-center gap-2 px-6 py-3 border-b-2 border-[#ec4899] text-[#ec4899] font-semibold text-[15px] bg-[#ec4899]/10 rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]">
            <PenTool className="w-5 h-5" aria-hidden="true" />
            Text Analyzer
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-gray-400 font-medium text-[15px] hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-t-lg">
            <ImageIcon className="w-5 h-5" aria-hidden="true" />
            Image Analyzer
          </button>
        </div>

        {/* 3. Main Panel */}
        <div className="bg-[#0f0f17] border-2 border-[#a855f7] rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold text-gray-200">
              Text Input
            </h3>
            <button className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
              <Clock className="w-5 h-5" aria-hidden="true" />
              History
            </button>
          </div>

          <div className="relative flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[250px] bg-[#06060c] border-2 border-white/20 rounded-xl p-5 text-[16px] text-[#f8f8f8] placeholder:text-gray-400 placeholder:opacity-60 focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/50 resize-y"
              placeholder="Paste text for forensic analysis..."
              aria-label="Text to analyze"
            ></textarea>

            <div className="absolute bottom-4 right-4 flex gap-3">
              <button className="flex items-center gap-2 bg-[#1e1e2e]/90 hover:bg-[#2a2a3c] text-white px-4 py-2.5 rounded-lg backdrop-blur-md transition-colors border border-white/20 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
                <Volume2 className="w-5 h-5" aria-hidden="true" />
                Audio Reader
              </button>
              <button className="flex items-center gap-2 bg-[#1e1e2e]/90 hover:bg-[#2a2a3c] text-white px-4 py-2.5 rounded-lg backdrop-blur-md transition-colors border border-white/20 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]">
                <Sparkles className="w-5 h-5 text-[#ec4899]" aria-hidden="true" />
                Auto-Predict
              </button>
            </div>
          </div>
          <div className="text-[14px] text-gray-400 font-medium">
            Tip: paste or type up to 20,000 characters
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors border border-white/10 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
                <Upload className="w-5 h-5" aria-hidden="true" />
                Local File
              </button>
              <button className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg transition-colors border border-white/10 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
                <Cloud className="w-5 h-5" aria-hidden="true" />
                Cloud
              </button>
              <button 
                onClick={() => setText('')}
                className="flex items-center gap-2 text-[#ef4444] hover:text-[#f87171] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 px-4 py-2.5 rounded-lg transition-colors border border-[#ef4444]/30 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
                Clear
              </button>
            </div>
            <div className="text-[14px] font-medium text-[#d1d5db]">
              {text.trim().split(/\s+/).filter(w => w.length > 0).length} Words | {text.length}/20000 Chars
            </div>
          </div>
        </div>

        {/* 4. Action buttons */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end gap-6">
            <button className="bg-[#1e1e2e] hover:bg-[#2a2a3c] text-white px-8 py-4 rounded-xl font-bold text-[16px] border-2 border-[#1e1e2e] focus:outline-none focus:ring-[3px] focus:ring-[#ec4899] focus:ring-offset-2 focus:ring-offset-[#06060c] transition-all flex items-center gap-2">
              <Brain className="w-5 h-5" aria-hidden="true" />
              Analyze Text
            </button>

            <div className="flex items-end gap-0 shadow-[0_0_20px_rgba(236,72,153,0.2)] rounded-xl">
              <button className="bg-gradient-to-r from-[#ec4899] to-[#a855f7] hover:opacity-90 text-white px-8 py-4 rounded-l-xl font-bold text-[16px] transition-opacity flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <User className="w-5 h-5" aria-hidden="true" />
                Humanize
              </button>
              <div className="flex flex-col bg-[#1e1e2e] border border-white/20 rounded-r-xl border-l-0 px-4 py-2 h-[56px] justify-center">
                <span className="text-[13px] text-gray-300 font-medium leading-none mb-1" id="tone-label">
                  Tone:
                </span>
                <button 
                  className="text-white text-[15px] font-semibold flex items-center gap-1 leading-none hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
                  aria-labelledby="tone-label"
                >
                  Casual <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className="bg-[#1e1e2e] hover:bg-[#2a2a3c] text-white px-8 py-4 rounded-xl font-bold text-[16px] border-2 border-white/10 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
                <User className="w-5 h-5" aria-hidden="true" />
                Train AI Style
              </button>
              <span className="text-[14px] text-gray-400 px-2 font-medium">
                Personalize AI to your voice
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#ef4444] bg-[#ef4444]/10 border-2 border-[#ef4444]/30 px-5 py-4 rounded-xl w-fit">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            <span className="text-[15px] font-semibold">
              ⚠ AI Score: N/A — run analysis first
            </span>
          </div>

          {/* 5. Secondary */}
          <div>
            <button className="flex items-center gap-2 text-gray-200 hover:text-white bg-[#1e1e2e] hover:bg-[#2a2a3c] px-6 py-3.5 rounded-xl transition-colors border-2 border-white/10 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
              <Wand2 className="w-5 h-5" aria-hidden="true" />
              Fix Spelling & Grammar <ChevronDown className="w-5 h-5 ml-1" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 6. Empty state */}
        {!text && (
          <div className="bg-[#0f0f17] border-2 border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 py-24 mt-4">
            <div className="w-20 h-20 rounded-2xl bg-[#1e1e2e] flex items-center justify-center border border-white/10 mb-2">
              <Brain className="w-10 h-10 text-gray-400" aria-hidden="true" />
            </div>
            <h3 className="text-[#ec4899] font-bold tracking-[0.2em] text-[16px]">
              AI FORENSICS
            </h3>
            <p className="text-[16px] text-gray-300 font-medium">
              Paste text above to begin forensic analysis...
            </p>
          </div>
        )}

        {/* Tradeoff caption */}
        <div className="mt-8 text-center text-[15px] text-gray-400 italic font-medium">
          ↑ Accessibility Mode — All labels visible, contrast boosted; slightly more space used
        </div>

        {/* 7. Footer */}
        <footer className="flex justify-between items-center mt-8 border-t-2 border-white/10 pt-8 pb-4">
          <div className="text-[15px] text-gray-400 font-semibold">
            © 2025 HayL3ditor
          </div>
          <div className="text-[15px] text-gray-400 font-semibold">v2.4.1</div>
        </footer>
      </div>
    </div>
  );
}
