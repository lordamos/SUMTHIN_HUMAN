import React from "react";
import { Monitor, Cloud, Check, Upload, FileImage, HardDrive } from "lucide-react";

export function ImageAccessibility() {
  return (
    <div className="min-h-screen bg-[#06060c] text-white font-sans flex flex-col selection:bg-pink-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            HayL3ditor
          </div>
          <div className="text-xs font-semibold tracking-widest text-gray-400">
            HAYLE EDITOR
          </div>
        </div>
        <div className="text-sm font-bold tracking-[0.2em] text-pink-500">
          AI FORENSICS
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            LIVE
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            AI READY
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#06060c] border border-white/10" />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors border border-transparent">
          <span>✏</span> Text Analyzer
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
          <span>☐</span> Image Analyzer
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pb-12 flex flex-col gap-6">
        {/* Tradeoff Badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
            <span>↑</span> Accessibility Mode — All labels visible, WCAG AA contrast; uses more space
          </div>
        </div>

        {/* Main Panel */}
        <div className="relative rounded-2xl border border-dashed border-purple-500/30 bg-[#0a0a12] p-10 overflow-hidden shadow-2xl flex flex-col items-center">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-8">
            HayL3ditor
          </div>

          <div className="text-center mb-10 space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              AI IMAGE
            </h1>
            <p className="text-base text-gray-300">
              Image Analysis & AI Processing
            </p>
            <p className="text-sm text-gray-400">
              Upload images to activate the swap & forensics engine
            </p>
          </div>

          {/* Upload Zones */}
          <div className="w-full flex gap-6 items-stretch">
            {/* Left Zone - Local Upload */}
            <div className="flex-[7] flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-pink-400 uppercase tracking-wider">
                Primary Upload
              </h2>
              <button 
                className="group relative flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-pink-500/50 bg-pink-500/5 p-10 transition-all hover:bg-pink-500/10 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-4 focus:ring-offset-[#06060c]"
                aria-label="Upload local file"
              >
                <div className="absolute top-4 right-4 text-pink-500 bg-pink-500/20 p-1.5 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
                
                <div className="p-4 rounded-full bg-[#06060c] border border-white/10 group-hover:scale-110 transition-transform">
                  <Monitor className="w-8 h-8 text-pink-400" />
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium text-white flex items-center justify-center gap-2">
                    <span aria-hidden="true">📺</span> Local File Upload
                  </div>
                  <div className="text-sm text-gray-300 font-medium">
                    Drag & drop or select from your computer
                  </div>
                  <div className="text-[13px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Accepts JPG, PNG, WEBP, GIF · Maximum 20MB per image
                  </div>
                </div>
              </button>
            </div>

            {/* Right Zone - Cloud Import */}
            <div className="flex-[3] flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                Cloud Sources
              </h2>
              <button 
                className="group flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/20 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-4 focus:ring-offset-[#06060c]"
                aria-label="Import from cloud storage"
              >
                <div className="p-3 rounded-full bg-[#06060c] border border-white/10 group-hover:scale-110 transition-transform">
                  <Cloud className="w-6 h-6 text-purple-400" />
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-base font-medium text-white flex items-center justify-center gap-2">
                    <span aria-hidden="true">☁</span> Cloud Import
                  </div>
                  <div className="text-sm text-gray-300 font-medium">
                    Google Drive or Dropbox
                  </div>
                  <div className="text-[13px] text-gray-400 leading-relaxed">
                    Connect your account to select files securely
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-xs text-gray-500">
        <div>HAYL3DITOR © {new Date().getFullYear()}</div>
        <div className="font-mono">v2.4.0-stable</div>
      </footer>
    </div>
  );
}
