import React, { useState } from 'react';

export function HierarchyClarity() {
  const [inputText, setInputText] = useState("AI is changing the world quickly. It makes things easier and faster. Businesses use it to save time. People use it to learn new things. It is very important for the future.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [output, setOutput] = useState("");

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setOutput("Artificial intelligence is rapidly transforming our world, introducing unprecedented ease and speed to daily tasks. While businesses leverage these advancements to optimize efficiency, individuals are increasingly adopting AI tools to accelerate learning and personal growth. Without a doubt, AI will remain a cornerstone of future innovation.");
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white p-6 md:p-12 font-sans selection:bg-pink-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#ec4899] via-[#a855f7] to-[#818cf8] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                HAYLE EDITOR
              </h1>
              <p className="text-xs text-white/40 tracking-wider uppercase font-medium mt-0.5">Humanization Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ec4899] shadow-[0_0_8px_#ec4899]"></div>
              Engine Online
            </span>
          </div>
        </header>

        <main className="space-y-8">
          
          {/* 1. INPUT AREA */}
          <section className="space-y-3 relative group">
            <div className="flex justify-between items-end mb-2">
              <label className="text-lg font-medium text-white/90">Source Text</label>
              <div className="text-xs text-white/40 font-mono">
                {inputText.split(/\s+/).filter(w => w.length > 0).length} words
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ec4899] to-[#a855f7] rounded-xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur-[2px]"></div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="relative w-full h-48 bg-[#0a0a12] border border-white/10 rounded-xl p-5 text-white/90 text-base leading-relaxed resize-none focus:outline-none focus:border-transparent placeholder-white/20 transition-all"
                placeholder="Paste your AI-generated text here..."
              />
            </div>
          </section>

          {/* 2. ACTIONS AREA */}
          <section className="flex flex-col md:flex-row items-center gap-4 py-2">
            {/* Primary Action */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText}
              className="w-full md:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#818cf8] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Humanize Text
                </>
              )}
            </button>

            <div className="h-10 w-px bg-white/10 hidden md:block mx-2"></div>

            {/* Secondary Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
              {['Professional', 'Casual', 'Academic'].map((tone) => (
                <button key={tone} className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
                  {tone}
                </button>
              ))}
            </div>
          </section>

          {/* 3. OUTPUT AREA */}
          {output && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#a855f7]">
                    Humanized Result
                  </h2>
                  <div className="px-2.5 py-1 rounded-md bg-[#ec4899]/10 border border-[#ec4899]/20 text-[#ec4899] text-xs font-bold tracking-wider">
                    98% HUMAN
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Copy text">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-[#0a0a12]/50 backdrop-blur-md border border-white/10 p-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#818cf8]/5 to-[#ec4899]/5"></div>
                <div className="relative bg-[#0a0a12]/80 p-6 rounded-xl">
                  <p className="text-white/90 text-lg leading-relaxed font-light">
                    {output}
                  </p>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
