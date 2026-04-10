import React, { useState } from "react";
import {
  Monitor,
  Cloud,
  FileImage,
  Upload,
  HardDrive,
  Clock,
  User,
  Image as ImageIcon,
  Edit2,
  FolderOpen,
  ArrowRight,
  Info
} from "lucide-react";

export function ImageAffordance() {
  const [time] = useState("10:42 AM");

  return (
    <div className="min-h-screen bg-[#06060c] text-slate-300 font-sans p-4 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between py-4 px-6 border-b border-white/5 mb-8 relative z-10 bg-white/[0.02] rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            HayL3ditor
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="text-xs font-bold tracking-widest text-white/50">
            HAYLE EDITOR
          </div>
        </div>

        <div className="text-xs font-bold tracking-[0.3em] text-pink-500">
          AI FORENSICS
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <span className="text-xs font-bold text-pink-500">LIVE</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-xs font-bold text-purple-500">AI READY</span>
          </div>
          <div className="text-xs font-medium text-white/40 flex items-center gap-2">
            <Clock size={14} />
            {time}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
            <div className="w-full h-full bg-[#06060c] rounded-full flex items-center justify-center">
              <User size={14} className="text-white/70" />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-center mb-8 relative z-10">
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
            <Edit2 size={16} />
            Text Analyzer
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <ImageIcon size={16} />
            Image Analyzer
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-4 relative z-10">
         <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm font-medium">
            <Info size={16} />
            ↑ Affordance Mode — All interactions explicit; page is more interactive-looking
          </div>
      </div>

      {/* Main Panel */}
      <main className="max-w-5xl w-full mx-auto flex-1 relative z-10 flex flex-col items-center">
        <div className="w-full bg-[#0a0a10]/80 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group">
          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Centered Brand / Title */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-px mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <div className="w-full h-full bg-[#06060c] rounded-2xl flex items-center justify-center">
                <FileImage size={28} className="text-pink-400" />
              </div>
            </div>
            
            <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text mb-2">
              HayL3ditor
            </div>
            
            <h1 className="text-3xl font-black tracking-[0.2em] text-white mb-4">
              AI IMAGE
            </h1>
            
            <p className="text-white/40 text-sm font-medium text-center max-w-md">
              Upload images to activate the swap & forensics engine
            </p>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash-pulse {
              0% { border-color: rgba(236, 72, 153, 0.4); }
              50% { border-color: rgba(236, 72, 153, 1); }
              100% { border-color: rgba(236, 72, 153, 0.4); }
            }
            .animate-dash-pulse {
              animation: dash-pulse 2s infinite ease-in-out;
            }
          `}} />

          {/* Upload Zones */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* Left Zone - Local Upload (Affordance Explicit) */}
            <div className="flex-[7] relative rounded-2xl border-2 border-dashed bg-[rgba(236,72,153,0.06)] animate-dash-pulse p-10 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden group transition-all duration-300">
               {/* Drop Indicator Overlay (simulated active state) */}
               <div className="absolute inset-4 border-2 border-dashed border-pink-500/40 rounded-xl pointer-events-none" />

              <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center mb-6 text-pink-400">
                <Monitor size={36} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Drag & drop or local upload
              </h3>
              
              <p className="text-pink-400 text-sm font-medium mb-6">
                Release to upload
              </p>

              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-pink-500/25 flex items-center gap-2 hover:scale-105 transition-transform">
                <FolderOpen size={18} />
                Choose File
              </button>

              <p className="text-white/40 text-xs mt-4">
                or drag & drop anywhere in this box
              </p>

              {/* Supported formats & constraint */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                <span className="text-xs text-white/30 font-medium mr-2">Supported:</span>
                {['JPG', 'PNG', 'WEBP', 'GIF'].map(ext => (
                  <span key={ext} className="text-[10px] font-bold text-white/50 border border-white/10 bg-white/5 px-2 py-1 rounded">
                    {ext}
                  </span>
                ))}
                <div className="ml-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-2 py-1 rounded">
                  Max 20MB
                </div>
              </div>
            </div>

            {/* Right Zone - Cloud Import */}
            <div className="flex-[3] rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-colors p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                <Cloud size={28} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">
                Cloud Import
              </h3>
              
              <p className="text-xs font-bold tracking-widest text-purple-400/70 mb-6">
                DRIVE / DROPBOX
              </p>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 font-medium text-sm transition-colors">
                Connect
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-6 flex items-center justify-between text-xs font-medium text-white/30 relative z-10">
        <div>© 2025 HayL3ditor Inc.</div>
        <div>v2.1.0 • Build 8492</div>
      </footer>
    </div>
  );
}
