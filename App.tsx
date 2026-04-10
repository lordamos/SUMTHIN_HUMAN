import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisType } from './types';
import TextAnalyzer from './components/TextAnalyzer';
import ImageAnalyzer from './components/ImageAnalyzer';
import { PencilIcon, ImageIcon } from './components/Icons';

const ParticleOrb: React.FC<{ x: string; y: string; size: string; color: string; delay: number }> = ({ x, y, size, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(60px)' }}
    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
    transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.Text);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#040508] text-gray-100 font-sans overflow-x-hidden">

      {/* Ambient background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <ParticleOrb x="10%" y="15%" size="500px" color="radial-gradient(circle, rgba(20,184,166,0.18), transparent)" delay={0} />
        <ParticleOrb x="70%" y="5%" size="600px" color="radial-gradient(circle, rgba(139,92,246,0.12), transparent)" delay={2} />
        <ParticleOrb x="50%" y="60%" size="700px" color="radial-gradient(circle, rgba(245,158,11,0.07), transparent)" delay={4} />
        <ParticleOrb x="-5%" y="70%" size="400px" color="radial-gradient(circle, rgba(59,130,246,0.10), transparent)" delay={1} />
        {/* Grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-3 bg-black/30 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)', boxShadow: '0 0 20px rgba(20,184,166,0.35)' }}
              animate={{ boxShadow: ['0 0 20px rgba(20,184,166,0.25)', '0 0 30px rgba(20,184,166,0.45)', '0 0 20px rgba(20,184,166,0.25)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              H
            </motion.div>
          </div>
          <div>
            <div className="text-sm font-black tracking-widest text-white uppercase">HAYL3HUMANIZER</div>
            <div className="text-[10px] text-teal-400/70 tracking-widest uppercase font-semibold">AI Forensics Platform</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-teal-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-[10px] text-teal-400 font-bold tracking-wider">LIVE</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">{time.toLocaleTimeString()}</div>
          <motion.div
            className="w-8 h-8 rounded-full"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b)', boxShadow: '0 0 12px rgba(20,184,166,0.3)' }}
            animate={{ boxShadow: ['0 0 12px rgba(20,184,166,0.2)', '0 0 20px rgba(20,184,166,0.4)', '0 0 12px rgba(20,184,166,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 p-3 sm:p-5">
        <section className="w-full flex-1 max-w-6xl mx-auto flex flex-col gap-4">

          {/* Tab bar */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 pt-2"
          >
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/[0.07] backdrop-blur-md">
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
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex-1 rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg, rgba(15,15,25,0.95), rgba(8,8,15,0.98))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset' }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.5), rgba(139,92,246,0.5), transparent)' }} />

            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {analysisType === AnalysisType.Text ? (
                  <motion.div
                    key="text-analyzer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TextAnalyzer />
                  </motion.div>
                ) : (
                  <motion.div
                    key="image-analyzer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ImageAnalyzer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="px-6 py-2.5 text-[10px] text-gray-600 border-t border-white/[0.04] flex items-center justify-between">
        <span>HAYL3HUMANIZER • Powered by Gemini</span>
        <span className="text-gray-700">v2.0 · Precision AI Platform</span>
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
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className={`relative flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 focus:outline-none ${
      isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="tab-bg"
        className="absolute inset-0 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 0 20px rgba(20,184,166,0.1)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    <span className={`relative ${isActive ? 'text-teal-400' : ''}`}>{icon}</span>
    <span className="relative">{label}</span>
  </motion.button>
);

export default App;
