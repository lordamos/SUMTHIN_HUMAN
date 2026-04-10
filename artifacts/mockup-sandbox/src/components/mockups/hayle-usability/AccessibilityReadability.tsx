import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Settings, 
  FileText, 
  Image as ImageIcon,
  Wand2,
  Type,
  Activity
} from 'lucide-react';

export function AccessibilityReadability() {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="min-h-screen bg-[#06060c] text-[#f8f8f8] font-sans selection:bg-pink-500/30">
      {/* Accessibility focus: dark neon aesthetic, but ensuring contrast.
          #06060c background
          Text is #f8f8f8 for primary, #cccccc for secondary (high contrast)
      */}
      
      <header className="border-b border-purple-500/20 bg-[#06060c]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              <Wand2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                HAYLE EDITOR
              </h1>
              <p className="text-[14px] text-[#cccccc] font-medium tracking-wide">AI Humanization Engine</p>
            </div>
          </div>
          <nav>
            <ul className="flex items-center gap-6">
              <li>
                <a href="#" className="flex items-center gap-2 text-[15px] font-medium text-pink-400 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060c] rounded px-2 py-1 transition-all">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Text Editor</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-[15px] font-medium text-[#cccccc] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060c] rounded px-2 py-1 transition-all">
                  <ImageIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Image Editor</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-[15px] font-medium text-[#cccccc] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060c] rounded px-2 py-1 transition-all">
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-[32px] font-bold leading-[1.3] mb-3 flex items-center gap-3">
            <Type className="w-8 h-8 text-pink-500" aria-hidden="true" />
            Humanize Text
          </h2>
          <p className="text-[16px] text-[#cccccc] leading-[1.6] max-w-2xl">
            Paste your AI-generated text below. Our engine will rewrite it to bypass detectors while maintaining your original meaning and tone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label htmlFor="input-text" className="block text-[15px] font-semibold text-[#f8f8f8] flex items-center gap-2">
                Input Content
                <span className="text-[12px] font-normal text-pink-400 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">Required</span>
              </label>
              
              <div className={`relative rounded-xl border-2 transition-all duration-200 bg-[#0a0a10] ${isFocused ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.15)] ring-4 ring-pink-500/20' : 'border-[#333344] hover:border-[#444455]'}`}>
                <textarea
                  id="input-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Paste text here to begin humanization..."
                  className="w-full h-64 bg-transparent text-[16px] leading-[1.6] text-[#f8f8f8] placeholder:text-[#888899] placeholder:font-light p-5 resize-y focus:outline-none"
                  aria-describedby="text-help"
                />
                
                {/* Warning state demonstration */}
                {text.length > 0 && text.length < 50 && (
                  <div className="absolute bottom-4 left-4 right-4 bg-orange-500/10 border border-orange-500/50 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-[14px] font-medium text-orange-200">Text too short</p>
                      <p className="text-[14px] text-orange-200/80 leading-[1.5] mt-1">Please provide at least 50 characters for optimal humanization results.</p>
                    </div>
                  </div>
                )}
              </div>
              <p id="text-help" className="text-[13px] text-[#bbbbcc] flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" aria-hidden="true" />
                Supports up to 10,000 characters per request.
              </p>
            </div>

            <button 
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-[16px] flex items-center justify-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060c] shadow-[0_4px_20px_rgba(168,85,247,0.4)] active:scale-[0.98]"
              aria-label="Start humanization process"
            >
              <Wand2 className="w-5 h-5" aria-hidden="true" />
              <span>Humanize Content Now</span>
              <ChevronRight className="w-5 h-5 opacity-70" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0a0a10] border border-[#333344] rounded-xl p-6 shadow-xl">
              <h3 className="text-[18px] font-semibold flex items-center gap-2 mb-6 border-b border-[#333344] pb-4">
                <Activity className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                Analysis Readout
              </h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[15px] font-medium text-[#cccccc]">AI Probability</span>
                    <span className="text-[24px] font-bold text-pink-400" aria-label="87 percent AI detected">87<span className="text-[16px] text-pink-400/70">%</span></span>
                  </div>
                  {/* Gauge with clear visual AND numeric context */}
                  <div className="h-3 w-full bg-[#1a1a24] rounded-full overflow-hidden" role="progressbar" aria-valuenow={87} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-gradient-to-r from-pink-500 to-red-500 w-[87%] rounded-full relative">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBMMjAgMEwyMCAyMEgwWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30"></div>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#aaaaaa] mt-2">Highly likely to be AI-generated</p>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[15px] font-medium text-[#cccccc]">Readability Score</span>
                    <span className="text-[24px] font-bold text-purple-400" aria-label="Grade level 12">12<span className="text-[16px] text-purple-400/70">.4</span></span>
                  </div>
                  <div className="h-3 w-full bg-[#1a1a24] rounded-full overflow-hidden" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[65%] rounded-full"></div>
                  </div>
                  <p className="text-[13px] text-[#aaaaaa] mt-2">College level reading difficulty</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5">
              <h4 className="text-[15px] font-semibold text-indigo-300 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Accessibility Note
              </h4>
              <p className="text-[14px] text-indigo-200/80 leading-[1.6]">
                This interface uses high-contrast text, semantic HTML, and visible focus indicators. The font sizes are large and line heights are generous to prevent eye strain.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
