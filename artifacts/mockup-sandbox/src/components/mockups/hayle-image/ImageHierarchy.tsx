import React from 'react';
import { 
  Monitor, 
  Cloud, 
  CircleUser, 
  PenLine, 
  Image as ImageIcon 
} from 'lucide-react';

export function ImageHierarchy() {
  return (
    <div className="min-h-screen bg-[#06060c] text-white font-sans flex flex-col selection:bg-pink-500/30">
      {/* 1. Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            HayL3ditor
          </span>
          <span className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Hayle Editor
          </span>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <span className="text-sm font-bold tracking-[0.3em] text-pink-500 uppercase">
            AI Forensics
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest text-pink-500 uppercase">Live</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">AI Ready</span>
          </div>
          <span className="text-xs font-mono text-white/50 ml-2">2:02:06 PM</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 ml-2">
            <CircleUser className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </header>

      {/* 2. Tab bar */}
      <div className="flex justify-center mt-8 mb-6 relative z-10">
        <div className="flex items-center p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
            <PenLine className="w-4 h-4" />
            Text Analyzer
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
            <ImageIcon className="w-4 h-4 text-pink-400" />
            Image Analyzer
          </button>
        </div>
      </div>

      {/* 3. Main panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        
        {/* Compact Logo & Heading Above Panel */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-3xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] mb-2">
            HayL3ditor
          </div>
          <h1 className="text-xl font-bold tracking-[0.4em] text-pink-500 uppercase">
            AI Image
          </h1>
        </div>

        {/* The Card */}
        <div className="w-full max-w-[900px] relative bg-[#0a0a12]/80 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-10 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
          
          {/* Tradeoff badge */}
          <div className="absolute -top-3 -right-3 bg-pink-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-1 border border-pink-400">
            ↑ Hierarchy Mode — Primary action foregrounded
          </div>

          <div className="text-center mb-10">
            <p className="text-white/40 text-sm tracking-wide">
              Upload images to activate the swap & forensics engine
            </p>
          </div>

          {/* Upload Zones Container */}
          <div className="flex items-stretch justify-between gap-6 mb-6">
            
            {/* Left Zone - DOMINANT */}
            <div className="flex-[0.8] relative group cursor-pointer transition-all duration-300">
              <div className="absolute inset-0 bg-pink-500/5 rounded-2xl blur-xl group-hover:bg-pink-500/10 transition-colors"></div>
              <div className="relative h-[280px] rounded-2xl border-2 border-dashed border-pink-500/40 bg-pink-500/[0.02] flex flex-col items-center justify-center p-8 group-hover:border-pink-500/60 group-hover:bg-pink-500/[0.05] transition-all">
                
                <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Monitor className="w-10 h-10 text-pink-400" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Drop your image here
                </h3>
                <p className="text-white/40 text-sm mb-8">
                  or click to browse files
                </p>

                <button className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white px-8 py-3 rounded-full font-medium shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:-translate-y-0.5 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Browse Files
                </button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="w-px h-16 bg-white/10"></div>
              <div className="py-4 text-xs font-medium text-white/30 uppercase tracking-widest">or</div>
              <div className="w-px h-16 bg-white/10"></div>
            </div>

            {/* Right Zone - SUBORDINATE */}
            <div className="flex-[0.2] h-[280px] rounded-2xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center opacity-70 hover:opacity-100">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-white/40" strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-medium text-white/70 mb-1">
                Cloud Import
              </h4>
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
                Drive / Dropbox
              </p>
            </div>

          </div>

          {/* File types */}
          <div className="text-center">
            <p className="text-xs text-white/30 tracking-wide">
              JPG · PNG · WEBP · GIF up to 20MB
            </p>
          </div>

        </div>
      </main>

      {/* 4. Footer */}
      <footer className="flex items-center justify-between px-8 py-6 border-t border-white/5 text-xs font-medium text-white/30 tracking-wide">
        <div className="flex items-center gap-3">
          <span className="text-white/50">HayL3ditor</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span>HAYLE EDITOR</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span className="flex items-center gap-1">
            Powered by <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">Gemini</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>v2.1</span>
          <span className="w-px h-3 bg-white/20"></span>
          <span>Precision AI Engine</span>
        </div>
      </footer>

    </div>
  );
}
