import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeText, improveText, humanizeText, predictNextText, generateSpeech } from '../services/geminiService';
import type { WritingStyleProfile, HistoryItem } from '../types';
import type { BatchResult } from './text-analyzer/types';
import ErrorDisplay from './ErrorDisplay';
import WritingStyleSetup from './WritingStyleSetup';
import HistoryPanel from './HistoryPanel';
import { decodeBase64, decodeAudioData } from './text-analyzer/audioUtils';
import TextInputPane from './text-analyzer/TextInputPane';
import AIScoreCard from './text-analyzer/AIScoreCard';
import HumanPatternCard from './text-analyzer/HumanPatternCard';
import StyleFingerprintCard from './text-analyzer/StyleFingerprintCard';
import SuggestionsCard from './text-analyzer/SuggestionsCard';
import Spinner from './Spinner';

const CHAR_LIMIT = 20000;

const TextAnalyzer: React.FC = () => {
    const [text, setText] = useState('');
    const [results, setResults] = useState<BatchResult[] | null>(null);
    const [correctedText, setCorrectedText] = useState<string | null>(null);
    const [rephrasedGptResults, setRephrasedGptResults] = useState<string[] | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAllCopied, setIsAllCopied] = useState(false);
    const [isCorrectedTextCopied, setIsCorrectedTextCopied] = useState(false);
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [isRealtimeHumanizing, setIsRealtimeHumanizing] = useState(false);
    const [liveAnalysisEnabled, setLiveAnalysisEnabled] = useState(true);
    const [humanizeMode, setHumanizeMode] = useState('casual');
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [isImprovementDropdownOpen, setIsImprovementDropdownOpen] = useState(false);
    const [improvementStyle, setImprovementStyle] = useState('fix');
    const [writingStyle, setWritingStyle] = useState<WritingStyleProfile | null>(null);
    const [isStyleSetupOpen, setIsStyleSetupOpen] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState<HistoryItem[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const lastHumanizedTextRef = useRef('');
    const improvementRef = useRef<HTMLDivElement>(null);
    const analyzerRef = useRef<HTMLDivElement>(null);
    const isLoading = !!loadingAction;

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(text.trim() === '' ? 0 : words.length);
        setCharCount(text.length);
    }, [text]);

    useEffect(() => {
        if (!text.trim() || !liveAnalysisEnabled) return;
        const timeout = setTimeout(async () => {
            setIsRealtimeHumanizing(true);
            try {
                let result: string | null = null;
                try {
                    const res = await fetch('/humanize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, mode: humanizeMode }) });
                    if (res.ok) { const data = await res.json(); if (!data.fallback && data.humanized_text) result = data.humanized_text; }
                } catch {}
                if (!result) result = await humanizeText(text, writingStyle);
                lastHumanizedTextRef.current = text;
                setCorrectedText(result);
                setRephrasedGptResults(null);
            } catch {}
            finally { setIsRealtimeHumanizing(false); }
        }, 700);
        return () => clearTimeout(timeout);
    }, [text, humanizeMode]);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('textAnalysisHistory');
            if (savedHistory) setAnalysisHistory(JSON.parse(savedHistory));
            const savedStyle = localStorage.getItem('userWritingStyle');
            if (savedStyle) setWritingStyle(JSON.parse(savedStyle));
        } catch {}
        const handleClickOutside = (event: MouseEvent) => {
            if (improvementRef.current && !improvementRef.current.contains(event.target as Node)) setIsImprovementDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); stopAudio(); };
    }, []);

    const stopAudio = () => {
        if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
        setCurrentAudioId(null);
    };

    const handleUniversalTTS = async (audioText: string, id: string) => {
        if (currentAudioId === id) { stopAudio(); return; }
        stopAudio();
        setCurrentAudioId(`${id}-loading`);
        try {
            const base64Audio = await generateSpeech(audioText);
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const ctx = audioContextRef.current;
            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => { setCurrentAudioId(null); };
            audioSourceRef.current = source;
            source.start(0);
            setCurrentAudioId(id);
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'Rate limit exceeded. Please wait before trying audio again.' : 'Audio generation failed.');
            setCurrentAudioId(null);
        }
    };

    const handleAnalyze = async () => {
        if (!text.trim()) { setError('Please enter some text.'); return; }
        setLoadingAction('analyze'); setError(null);
        try {
            const analysisResult = await analyzeText(text);
            setResults([{ ...analysisResult, fileName: 'Pasted Text' }]);
            setAnalysisHistory(prev => [{ id: new Date().toISOString(), text, result: analysisResult, timestamp: Date.now() }, ...prev.slice(0, 49)]);
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'API Quota Exceeded. Please try again in 1-2 minutes.' : 'Analysis failed. Please try again.');
        } finally { setLoadingAction(null); }
    };

    const handleHumanize = async () => {
        if (!text.trim()) return;
        setLoadingAction('humanize'); setError(null);
        try { setCorrectedText(await humanizeText(text, writingStyle)); }
        catch (err: any) { setError(err?.message?.includes('429') ? 'API Quota Exceeded. Please wait 60 seconds.' : 'Humanization failed.'); }
        finally { setLoadingAction(null); }
    };

    const handlePredictText = async () => {
        setLoadingAction('predict');
        try { setPrediction(await predictNextText(text, writingStyle)); }
        catch { setError('Prediction failed.'); }
        finally { setLoadingAction(null); }
    };

    const handleImprovement = async (style: string) => {
        if (!text.trim()) return;
        setLoadingAction('improve'); setError(null);
        try {
            const improved = await improveText(text, style);
            if (style === 'rephrase-gpt') {
                const lines = improved.split('\n').map(l => l.trim()).filter(l => l.startsWith('* ') || l.startsWith('- ')).map(l => l.substring(2));
                setRephrasedGptResults(lines.length > 0 ? lines : [improved]);
                setCorrectedText(null);
            } else {
                setCorrectedText(improved); setRephrasedGptResults(null);
            }
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'API Rate Limit. Please wait a moment.' : 'Improvement failed.');
        } finally { setLoadingAction(null); }
    };

    const handleImplementSuggestion = (original: string, suggestion: string) => setText(prev => prev.replace(original, suggestion));

    const handleCopyAll = () => {
        const all = results!.map(r => `AI Likelihood: ${r.aiLikelihood}%\n` + r.analysis.map(a => `Snippet: ${a.originalText}\nReason: ${a.reason}`).join('\n\n')).join('\n---\n');
        navigator.clipboard.writeText(all);
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2000);
    };

    const handleCopyCorrected = () => {
        if (!correctedText) return;
        navigator.clipboard.writeText(correctedText);
        setIsCorrectedTextCopied(true);
        setTimeout(() => setIsCorrectedTextCopied(false), 2000);
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => setText((ev.target?.result as string).substring(0, CHAR_LIMIT));
        reader.readAsText(file);
    };

    const hasResults = !!results && results.length > 0;
    const aiScore = hasResults ? results![0].aiLikelihood : null;

    return (
        <div ref={analyzerRef} className="relative">
            <AnimatePresence>
                {isStyleSetupOpen && <WritingStyleSetup onSave={(p) => { setWritingStyle(p); localStorage.setItem('userWritingStyle', JSON.stringify(p)); setIsStyleSetupOpen(false); }} onClose={() => setIsStyleSetupOpen(false)} initialProfile={writingStyle} />}
                {isHistoryPanelOpen && <HistoryPanel history={analysisHistory} onSelect={(item) => { setText(item.text); setResults([{ ...item.result, fileName: 'From History' }]); setIsHistoryPanelOpen(false); }} onDelete={(id) => setAnalysisHistory(prev => prev.filter(i => i.id !== id))} onClear={() => setAnalysisHistory([])} onClose={() => setIsHistoryPanelOpen(false)} />}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row border border-purple-500/20 rounded-2xl bg-[#0a0a12] shadow-2xl shadow-purple-900/10 overflow-hidden" style={{ minHeight: '620px' }}>

                <TextInputPane
                    text={text}
                    onTextChange={setText}
                    wordCount={wordCount}
                    charCount={charCount}
                    charLimit={CHAR_LIMIT}
                    isLoading={isLoading}
                    isRealtimeHumanizing={isRealtimeHumanizing}
                    loadingAction={loadingAction}
                    prediction={prediction}
                    onDismissPrediction={() => setPrediction(null)}
                    onAcceptPrediction={() => { setText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + prediction); setPrediction(null); }}
                    writingStyle={writingStyle}
                    onOpenHistory={() => setIsHistoryPanelOpen(true)}
                    onOpenStyleSetup={() => setIsStyleSetupOpen(true)}
                    onAnalyze={handleAnalyze}
                    onHumanize={handleHumanize}
                    onPredictText={handlePredictText}
                    onImprovement={handleImprovement}
                    humanizeMode={humanizeMode}
                    onHumanizeModeChange={setHumanizeMode}
                    currentAudioId={currentAudioId}
                    onTTS={handleUniversalTTS}
                    improvementStyle={improvementStyle}
                    onImprovementStyleChange={setImprovementStyle}
                    isImprovementDropdownOpen={isImprovementDropdownOpen}
                    onToggleImprovementDropdown={() => setIsImprovementDropdownOpen(v => !v)}
                    improvementRef={improvementRef}
                    onClear={() => { setText(''); stopAudio(); }}
                    onFileUpload={handleFileUpload}
                />

                <div className="hidden lg:flex w-1.5 bg-purple-500/5 hover:bg-purple-500/20 items-center justify-center cursor-col-resize transition-colors group">
                    <div className="w-0.5 h-8 bg-purple-500/20 group-hover:bg-purple-500/50 rounded-full" />
                </div>

                <div className="w-full lg:w-1/2 flex flex-col bg-[#0a0a14]">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
                        <span className="text-[10px] font-bold tracking-wider text-purple-400 flex-1">AI ANALYSIS</span>
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 mx-2">
                                    <ErrorDisplay message={error} onDismiss={() => setError(null)} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {(loadingAction === 'analyze' || loadingAction === 'humanize' || loadingAction === 'improve') && (
                            <span className="flex items-center gap-1.5 text-xs text-purple-400 shrink-0">
                                <Spinner /><span className="capitalize">{loadingAction === 'analyze' ? 'Analyzing…' : loadingAction === 'humanize' ? 'Humanizing…' : 'Processing…'}</span>
                            </span>
                        )}
                        <button onClick={() => setLiveAnalysisEnabled(v => !v)} className="flex items-center gap-2 cursor-pointer group shrink-0">
                            <span className={`text-[10px] font-medium transition-colors ${liveAnalysisEnabled ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                ● Live {liveAnalysisEnabled ? 'ON' : 'OFF'}
                            </span>
                            <div className={`relative inline-flex items-center h-4 rounded-full w-7 transition-colors ${liveAnalysisEnabled ? 'bg-purple-600' : 'bg-slate-800 border border-white/10'}`}>
                                <span className={`inline-block w-2.5 h-2.5 transform rounded-full transition-transform ${liveAnalysisEnabled ? 'translate-x-3.5 bg-white' : 'translate-x-1 bg-slate-500'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        <AIScoreCard results={results} aiScore={aiScore} onCopyAll={handleCopyAll} isCopied={isAllCopied} />
                        <HumanPatternCard
                            correctedText={correctedText}
                            originalText={lastHumanizedTextRef.current || text}
                            aiScore={aiScore}
                            hasResults={hasResults}
                            isRealtimeHumanizing={isRealtimeHumanizing}
                            isCopied={isCorrectedTextCopied}
                            onCopy={handleCopyCorrected}
                            onTTS={handleUniversalTTS}
                            currentAudio={currentAudioId}
                        />
                        <StyleFingerprintCard
                            rephrasedGptResults={rephrasedGptResults}
                            writingStyle={writingStyle}
                            onTTS={handleUniversalTTS}
                            currentAudio={currentAudioId}
                        />
                        <SuggestionsCard
                            analysis={hasResults ? results![0].analysis : []}
                            hasResults={hasResults}
                            onImplementSuggestion={handleImplementSuggestion}
                            onTTS={handleUniversalTTS}
                            currentAudio={currentAudioId}
                        />

                        {!hasResults && !correctedText && !rephrasedGptResults && !isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center flex-1 py-12 gap-4 select-none pointer-events-none">
                                <motion.img
                                    src="/logo3.png"
                                    alt="HayL3ditor"
                                    className="w-36 object-contain"
                                    animate={{
                                        filter: ['brightness(1.1) drop-shadow(0 0 8px rgba(236,72,153,0.3))', 'brightness(1.2) drop-shadow(0 0 18px rgba(168,85,247,0.5))', 'brightness(1.1) drop-shadow(0 0 8px rgba(236,72,153,0.3))'],
                                        opacity: [0.6, 0.85, 0.6],
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <div className="text-center">
                                    <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1"
                                        style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        AI Forensics Platform
                                    </p>
                                    <p className="text-[10px] text-slate-700 tracking-widest">Results appear here as you work</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextAnalyzer;
