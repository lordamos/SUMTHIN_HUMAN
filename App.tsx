import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisType } from './types';
import TextAnalyzer from './components/TextAnalyzer';
import ImageAnalyzer from './components/ImageAnalyzer';
import { PencilIcon, ImageIcon } from './components/Icons';

const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.Text);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top_left,_#081018,_#050308)] text-gray-100 font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="w-full h-full bg-black opacity-30 animate-pulse" />
      </div>

      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400/30 to-amber-400/30 flex items-center justify-center shadow-[0_6px_30px_-10px_rgba(0,245,212,0.12)]">
            <span className="text-teal-300 font-semibold">H</span>
          </div>
          <div>
            <div className="text-sm font-semibold">HAYL3HUMANIZER</div>
            <div className="text-xs text-gray-400">AI Detector</div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-amber-400 shadow-[0_6px_30px_-12px_rgba(0,245,212,0.18)]"></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 p-4 sm:p-6">
         {/* Center stage */}
        <section className="w-full flex-1 max-w-5xl mx-auto flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-black/30 to-black/40 border border-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-gradient-to-br from-teal-600/10 to-amber-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 border-b border-white/10 pb-6 mb-6">
              <TabButton
                label="Text Analyzer"
                isActive={analysisType === AnalysisType.Text}
                onClick={() => setAnalysisType(AnalysisType.Text)}
                icon={<PencilIcon />}
              />
              <TabButton
                label="Image Analyzer"
                isActive={analysisType === AnalysisType.Image}
                onClick={() => setAnalysisType(AnalysisType.Image)}
                icon={<ImageIcon />}
              />
            </div>

            <AnimatePresence mode="wait">
              {analysisType === AnalysisType.Text ? (
                <motion.div
                  key="text-analyzer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TextAnalyzer />
                </motion.div>
              ) : (
                <motion.div
                  key="image-analyzer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageAnalyzer />
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </section>
      </main>
      
      <footer className="px-6 py-3 text-xs text-gray-500 border-t border-white/10 text-center">
        HAYL3HUMANIZER • Powered by Gemini
      </footer>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      isActive
        ? 'bg-gradient-to-r from-teal-500/20 to-amber-400/10 text-teal-300 border border-teal-400/20 shadow-lg'
        : 'text-gray-300 bg-white/5 hover:bg-white/10 border border-transparent hover:scale-[1.03]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;