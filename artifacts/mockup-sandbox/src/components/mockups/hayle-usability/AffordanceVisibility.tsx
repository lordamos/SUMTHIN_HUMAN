import React from 'react';

export function AffordanceVisibility() {
  return (
    <div className="min-h-screen bg-[#06060c] text-white p-8 font-sans selection:bg-pink-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            HAYLE EDITOR
          </h1>
          <p className="text-gray-400 text-lg">Interaction Affordance Visibility</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section: Explicit Buttons */}
          <div className="bg-[#0f0f17] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 opacity-50"></div>
            <h2 className="text-xl font-semibold text-gray-200">Action Affordances</h2>
            <p className="text-sm text-gray-400">Clear shapes, depth, and color-coded intents.</p>

            <div className="space-y-4 pt-4">
              {/* Primary Button (Simulated Hover State) */}
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">Primary Action (Hovered)</span>
                <button className="relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.5)] transform scale-[1.02] border border-pink-400/50 cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Humanize Content
                </button>
              </div>

              {/* Secondary Button */}
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">Secondary Action</span>
                <button className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-300 transition-all duration-200 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700 hover:text-white hover:border-gray-500 shadow-sm shadow-black/50 cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload Reference
                </button>
              </div>

              {/* Destructive Button */}
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">Destructive Action</span>
                <button className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-red-400 transition-all duration-200 bg-red-950/30 border border-red-900/50 rounded-xl hover:bg-red-900/50 hover:text-red-300 shadow-sm shadow-red-900/20 cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear Workspace
                </button>
              </div>
            </div>
          </div>

          {/* Section: Input & Selection */}
          <div className="bg-[#0f0f17] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50"></div>
            <h2 className="text-xl font-semibold text-gray-200">Inputs & Selection</h2>
            <p className="text-sm text-gray-400">Clear text fields and visible dropdown options.</p>

            <div className="space-y-6 pt-4">
              {/* Text Input with Icon */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-300 font-medium flex items-center">
                  Project Name
                  <span className="ml-1 text-pink-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-xl leading-5 bg-[#0a0a0f] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 sm:text-sm transition-all shadow-inner shadow-black/50" 
                    placeholder="e.g., Marketing Campaign Q3" 
                    defaultValue="Product Launch Assets"
                  />
                </div>
              </div>

              {/* Open Dropdown Simulation */}
              <div className="flex flex-col space-y-2 relative z-10">
                <label className="text-sm text-gray-300 font-medium">Target Tone</label>
                <div className="relative">
                  <button className="w-full flex items-center justify-between bg-[#0a0a0f] border border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-gray-200 shadow-[0_0_10px_rgba(99,102,241,0.2)] cursor-pointer">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                      Professional & Authoritative
                    </span>
                    <svg className="w-4 h-4 text-indigo-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  {/* Dropdown Menu (Open State) */}
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#13131d] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                      <div className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                        <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div>
                        Casual & Friendly
                      </div>
                      <div className="flex items-center px-3 py-2 text-sm text-white bg-indigo-500/20 rounded-lg cursor-pointer border border-indigo-500/30">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2 shadow-[0_0_5px_rgba(129,140,248,1)]"></div>
                        Professional & Authoritative
                        <svg className="w-4 h-4 ml-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                        <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div>
                        Creative & Poetic
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Status & Micro-interactions */}
          <div className="bg-[#0f0f17] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden md:col-span-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500 opacity-50"></div>
            <h2 className="text-xl font-semibold text-gray-200">Status & Tooltips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Processing State */}
              <div className="space-y-4 bg-[#0a0a0f] p-5 rounded-xl border border-gray-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-pink-400 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Alternatives...
                  </span>
                  <span className="text-xs text-gray-500">65%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 shadow-inner">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full relative" style={{ width: '65%' }}>
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 rounded-full blur-[2px] animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors cursor-pointer">
                    Cancel Operation
                  </button>
                </div>
              </div>

              {/* Icon Actions with Tooltips */}
              <div className="flex items-center justify-center space-x-6 bg-[#0a0a0f] p-5 rounded-xl border border-gray-800">
                
                {/* Tooltip shown */}
                <div className="relative flex flex-col items-center group cursor-pointer">
                  <div className="absolute -top-10 flex flex-col items-center">
                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-700">
                      Copy to Clipboard
                    </div>
                    <div className="w-2 h-2 bg-gray-800 border-b border-r border-gray-700 transform rotate-45 -mt-1.5"></div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 shadow-sm transition-all hover:bg-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 font-medium tracking-wide group-hover:text-gray-200 transition-colors">COPY</span>
                </div>

                <div className="relative flex flex-col items-center group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                  <div className="p-2.5 rounded-lg bg-transparent text-gray-400 border border-transparent hover:bg-gray-800 hover:text-gray-200 hover:border-gray-700 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-wide group-hover:text-gray-300">EXPORT</span>
                </div>

                <div className="relative flex flex-col items-center group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                  <div className="p-2.5 rounded-lg bg-transparent text-gray-400 border border-transparent hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1.5 font-medium tracking-wide group-hover:text-red-400">DELETE</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
