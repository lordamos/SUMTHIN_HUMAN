import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisType } from './types';
import TextAnalyzer from './components/TextAnalyzer';
import ImageAnalyzer from './components/ImageAnalyzer';
import { PencilIcon, ImageIcon } from './components/Icons';

/* ─── Animated neon light trail (SVG) ─────────────────────────── */
const LightTrail: React.FC<{ d: string; color: string; delay: number; duration: number; width?: number }> = ({
  d, color, delay, duration, width = 3,
}) => (
  <motion.path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
    filter={`drop-shadow(0 0 8px ${color})`}
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.9, 0.9, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ─── Ambient orb ─────────────────────────────────────────────── */
const Orb: React.FC<{ x: string; y: string; size: string; color: string; delay: number }> = ({ x, y, size, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(80px)' }}
    animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
    transition={{ duration: 7 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

/* ─── Scan line sweep ─────────────────────────────────────────── */
const ScanLine: React.FC = () => (
  <motion.div
    className="absolute left-0 right-0 h-px pointer-events-none"
    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.6) 40%, rgba(6,182,212,0.6) 60%, transparent 100%)' }}
    initial={{ top: '-2px' }}
    animate={{ top: ['0%', '100%', '100%'] }}
    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
  />
);

/* ─── Tab button ──────────────────────────────────────────────── */
interface TabButtonProps { label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode; }
const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    className={`relative flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-colors duration-200 focus:outline-none ${
      isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="tab-bg"
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(6,182,212,0.12))',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(34,197,94,0.15)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    <span className={`relative z-10 ${isActive ? 'text-green-400' : ''}`}>{icon}</span>
    <span className="relative z-10">{label}</span>
  </motion.button>
);

/* ─── Main app ────────────────────────────────────────────────── */
const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.Text);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-gray-100 font-sans overflow-x-hidden"
      style={{ background: '#030507' }}>

      {/* ── Background layer ────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Subtle organic noise texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '256px' }} />

        {/* Ambient orbs */}
        <Orb x="5%" y="10%" size="600px" color="radial-gradient(circle, rgba(34,197,94,0.2), transparent)" delay={0} />
        <Orb x="65%" y="0%" size="700px" color="radial-gradient(circle, rgba(6,182,212,0.12), transparent)" delay={2} />
        <Orb x="40%" y="55%" size="800px" color="radial-gradient(circle, rgba(249,115,22,0.07), transparent)" delay={4} />
        <Orb x="-5%" y="60%" size="450px" color="radial-gradient(circle, rgba(34,197,94,0.08), transparent)" delay={1} />

        {/* Animated neon light trails — inspired by logo */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 800" preserveAspectRatio="none">
          <defs>
            <filter id="glow-trail" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Orange trail — bottom-left sweeping up to center-right */}
          <LightTrail d="M -100,900 Q 150,700 380,480 T 640,180 T 820,-20"
            color="#f97316" delay={0} duration={9} width={2.5} />
          {/* Blue trail — parallel, slight offset */}
          <LightTrail d="M -80,860 Q 170,660 400,440 T 660,140 T 840,-50"
            color="#06b6d4" delay={0.6} duration={9} width={3} />
          {/* Thinner orange accent */}
          <LightTrail d="M -60,820 Q 190,620 420,400 T 680,100"
            color="#fb923c" delay={1.4} duration={8} width={1.5} />
          {/* Thin cyan accent */}
          <LightTrail d="M -120,940 Q 130,740 360,520 T 620,220 T 800,10"
            color="#22d3ee" delay={2.2} duration={10} width={1.5} />
        </svg>

        {/* Dot grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(34,197,94,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-64"
          style={{ background: 'linear-gradient(to top, rgba(3,5,7,0.8), transparent)' }} />

        {/* Background logo watermark */}
        <motion.img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto w-[520px] max-w-[70vw] object-contain pointer-events-none select-none"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          animate={{
            opacity: [0.07, 0.16, 0.07],
            filter: [
              'drop-shadow(0 0 40px rgba(34,197,94,0.0))',
              'drop-shadow(0 0 90px rgba(34,197,94,0.15))',
              'drop-shadow(0 0 40px rgba(34,197,94,0.0))',
            ],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="w-full flex items-center justify-between px-4 sm:px-6 py-2 sticky top-0 z-30 overflow-hidden"
        style={{ background: 'rgba(3,5,7,0.85)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(34,197,94,0.1)', boxShadow: '0 1px 30px rgba(0,0,0,0.5)' }}>

        {/* Scan line inside header */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ScanLine />
        </div>

        {/* Logo + brand */}
        <div className="flex items-center gap-3 relative z-10">
          <motion.div
            animate={{ filter: ['drop-shadow(0 0 8px rgba(34,197,94,0.4))', 'drop-shadow(0 0 16px rgba(34,197,94,0.7))', 'drop-shadow(0 0 8px rgba(34,197,94,0.4))'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src="/logo.png"
              alt="HayL3ditor"
              className="h-11 w-auto object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </motion.div>
          <div>
            <div className="text-[11px] font-black tracking-[0.3em] uppercase"
              style={{ background: 'linear-gradient(90deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI FORENSICS PLATFORM
            </div>
          </div>
        </div>

        {/* Right side status */}
        <div className="hidden sm:flex items-center gap-3 relative z-10">
          {/* Status badges */}
          <div className="flex items-center gap-2">
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              animate={{ boxShadow: ['0 0 0 0 rgba(34,197,94,0)', '0 0 8px 2px rgba(34,197,94,0.15)', '0 0 0 0 rgba(34,197,94,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="text-[10px] text-green-400 font-black tracking-widest">LIVE</span>
            </motion.div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-black tracking-widest">AI READY</span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10" />
          <div className="text-[10px] text-gray-500 font-mono tabular-nums">{time.toLocaleTimeString()}</div>

          {/* Avatar dot */}
          <motion.div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-green-500/30"
            style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)' }}
            animate={{ boxShadow: ['0 0 8px rgba(34,197,94,0.2)', '0 0 18px rgba(34,197,94,0.5)', '0 0 8px rgba(34,197,94,0.2)'] }}
            transition={{ duration: 2.5, repeat: Infinity }} />
        </div>

        {/* Mobile status */}
        <div className="flex sm:hidden items-center gap-2 relative z-10">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <div className="text-[10px] text-gray-500 font-mono">{time.toLocaleTimeString()}</div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center gap-4 p-3 sm:p-5">
        <section className="w-full flex-1 max-w-7xl mx-auto flex flex-col gap-4">

          {/* Tab bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center pt-1"
          >
            <div className="flex items-center gap-1 p-1 rounded-2xl"
              style={{ background: 'rgba(10,14,20,0.8)', border: '1px solid rgba(34,197,94,0.1)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(34,197,94,0.06)' }}>
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

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex-1 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(10,15,22,0.97) 0%, rgba(5,8,12,0.99) 100%)',
              border: '1px solid rgba(34,197,94,0.1)',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(34,197,94,0.04) inset, 0 0 60px -30px rgba(34,197,94,0.08) inset',
            }}
          >
            {/* Top accent line — tri-color */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.7) 30%, rgba(6,182,212,0.7) 60%, rgba(249,115,22,0.5) 85%, transparent 100%)' }} />

            {/* Corner glow */}
            <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle at top left, rgba(34,197,94,0.06), transparent 70%)' }} />
            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle at top right, rgba(6,182,212,0.05), transparent 70%)' }} />

            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {analysisType === AnalysisType.Text ? (
                  <motion.div
                    key="text-analyzer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.22 }}
                  >
                    <TextAnalyzer />
                  </motion.div>
                ) : (
                  <motion.div
                    key="image-analyzer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ImageAnalyzer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 py-2 text-[10px] flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(34,197,94,0.07)', background: 'rgba(3,5,7,0.6)' }}>
        <span className="text-gray-600">HayL3ditor • <span className="text-green-500/60">HAYLE EDITOR</span> • Powered by Gemini</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-700">v2.1</span>
          <span className="text-green-500/40">|</span>
          <span className="text-gray-700">Precision AI Engine</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
