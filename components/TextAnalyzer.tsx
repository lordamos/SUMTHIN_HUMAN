import React, { useState, useRef, useEffect } from 'react';
import { Activity, User, BarChart2, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeText, improveText, humanizeText, predictNextText, generateSpeech } from '../services/geminiService';
import type { TextAnalysisResult, TextAnalysisItem, WritingStyleProfile, HistoryItem } from '../types';
import Gauge from './Gauge';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import WritingStyleSetup from './WritingStyleSetup';
import HistoryPanel from './HistoryPanel';
import { decodeBase64, decodeAudioData } from './text-analyzer/audioUtils';
import TTSButton from './text-analyzer/TTSButton';
import RephrasedGptResultsView from './text-analyzer/RephrasedGptResultsView';
import CorrectedTextView from './text-analyzer/CorrectedTextView';
import AnalysisCard from './text-analyzer/AnalysisCard';
import {
    ClipboardIcon, CheckIcon, GrammarIcon, ChevronDownIcon,
    ToneIcon, ShortenIcon, LengthenIcon, SimplifyIcon, FormalIcon,
    NormalIcon, ProfessionalIcon, ColloquialIcon, AcademicIcon,
    BusinessIcon, CreativeIcon, FriendlyIcon, RewordIcon, TextUploadIcon,
    ClearIcon, RephraseGptIcon, HumanizerIcon, PersonalizeIcon, HistoryIcon, ImplementIcon, ReadabilityIcon, DocumentIcon, SparklesIcon, SpeakerIcon, AudioWaveIcon,
} from './Icons';

type BatchResult = TextAnalysisResult & { fileName: string };
type LoadingAction = 'analyze' | 'improve' | 'tone' | 'humanize' | 'predict' | 'audio' | 'cloud' | null;

const improvementOptions = [
    { key: 'fix', label: 'Fix Spelling & Grammar', icon: <GrammarIcon /> },
    { key: 'reword', label: 'Reword Text', icon: <RewordIcon /> },
    { key: 'rephrase-gpt', label: 'Rephrase with GPT', icon: <RephraseGptIcon /> },
    { key: 'shorten', label: 'Make Shorter', icon: <ShortenIcon /> },
    { key: 'lengthen', label: 'Make Longer', icon: <LengthenIcon /> },
    { key: 'simplify', label: 'Simplify Language', icon: <SimplifyIcon /> },
    { key: 'readability', label: 'Improve Readability', icon: <ReadabilityIcon /> },
];

const TextAnalyzer: React.FC = () => {
    const [text, setText] = useState<string>('');
    const [results, setResults] = useState<BatchResult[] | null>(null);
    const [correctedText, setCorrectedText] = useState<string | null>(null);
    const [rephrasedGptResults, setRephrasedGptResults] = useState<string[] | null>(null);
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAllCopied, setIsAllCopied] = useState(false);
    const [isCorrectedTextCopied, setIsCorrectedTextCopied] = useState(false);
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<string | null>(null);

    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const [humanizeMode, setHumanizeMode] = useState<string>('casual');
    const [isRealtimeHumanizing, setIsRealtimeHumanizing] = useState(false);
    const [liveAnalysisEnabled, setLiveAnalysisEnabled] = useState(true);
    const lastHumanizedTextRef = useRef<string>('');

    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const CHAR_LIMIT = 20000;
    const fileUploadRef = useRef<HTMLInputElement>(null);

    const [isImprovementDropdownOpen, setIsImprovementDropdownOpen] = useState(false);
    const [improvementStyle, setImprovementStyle] = useState('fix');
    const improvementRef = useRef<HTMLDivElement>(null);
    const [writingStyle, setWritingStyle] = useState<WritingStyleProfile | null>(null);
    const [isStyleSetupOpen, setIsStyleSetupOpen] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState<HistoryItem[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
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
                    if (res.ok) {
                        const data = await res.json();
                        if (!data.fallback && data.humanized_text) result = data.humanized_text;
                    }
                } catch {}
                if (!result) result = await humanizeText(text, writingStyle);
                lastHumanizedTextRef.current = text;
                setCorrectedText(result);
                setRephrasedGptResults(null);
                navigator.clipboard.writeText(result).catch(() => {});
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
        } catch (e) {}

        const handleClickOutside = (event: MouseEvent) => {
            if (improvementRef.current && !improvementRef.current.contains(event.target as Node)) setIsImprovementDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            stopAudio();
        };
    }, []);

    const stopAudio = () => {
        if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
        setIsAudioPlaying(false);
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
            source.onended = () => { setIsAudioPlaying(false); setCurrentAudioId(null); };
            audioSourceRef.current = source;
            source.start(0);
            setIsAudioPlaying(true);
            setCurrentAudioId(id);
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'Rate limit exceeded. Please wait a minute before trying audio playback again.' : 'Audio generation failed.');
            setCurrentAudioId(null);
        }
    };

    const handleAnalyze = async () => {
        if (!text.trim()) { setError('Please enter some text.'); return; }
        setLoadingAction('analyze');
        setError(null);
        try {
            const analysisResult = await analyzeText(text);
            setResults([{ ...analysisResult, fileName: 'Pasted Text' }]);
            setAnalysisHistory(prev => [{ id: new Date().toISOString(), text, result: analysisResult, timestamp: Date.now() }, ...prev.slice(0, 49)]);
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'API Quota Exceeded. Please try again in 1-2 minutes. The AI models are currently busy.' : 'Analysis failed. Please try again.');
        } finally { setLoadingAction(null); }
    };

    const handleHumanize = async () => {
        if (!text.trim()) return;
        setLoadingAction('humanize');
        setError(null);
        try {
            const humanized = await humanizeText(text, writingStyle);
            setCorrectedText(humanized);
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'API Quota Exceeded. The humanizer model needs a short break. Please wait 60 seconds.' : 'Humanization failed.');
        } finally { setLoadingAction(null); }
    };

    const handlePredictText = async () => {
        setLoadingAction('predict');
        try { setPrediction(await predictNextText(text, writingStyle)); }
        catch { setError('Prediction failed.'); }
        finally { setLoadingAction(null); }
    };

    const handleImprovement = async (style: string) => {
        if (!text.trim()) return;
        setLoadingAction('improve');
        setError(null);
        try {
            const improved = await improveText(text, style);
            if (style === 'rephrase-gpt') {
                const lines = improved.split('\n').map(l => l.trim()).filter(l => l.startsWith('* ') || l.startsWith('- ')).map(l => l.substring(2));
                setRephrasedGptResults(lines.length > 0 ? lines : [improved]);
                setCorrectedText(null);
            } else {
                setCorrectedText(improved);
                setRephrasedGptResults(null);
            }
        } catch (err: any) {
            setError(err?.message?.includes('429') ? 'API Rate Limit. Please wait a moment.' : 'Improvement failed.');
        } finally { setLoadingAction(null); }
    };

    const handleImplementSuggestion = (original: string, suggestion: string) => setText(prev => prev.replace(original, suggestion));

    const hasResults = results && results.length > 0;
    const aiScore = hasResults ? results![0].aiLikelihood : null;

    return (
        <div ref={analyzerRef} className="relative">
            <AnimatePresence>
                {isStyleSetupOpen && <WritingStyleSetup onSave={(p) => { setWritingStyle(p); localStorage.setItem('userWritingStyle', JSON.stringify(p)); setIsStyleSetupOpen(false); }} onClose={() => setIsStyleSetupOpen(false)} initialProfile={writingStyle} />}
                {isHistoryPanelOpen && <HistoryPanel history={analysisHistory} onSelect={(item) => { setText(item.text); setResults([{ ...item.result, fileName: 'From History' }]); setIsHistoryPanelOpen(false); }} onDelete={(id) => setAnalysisHistory(prev => prev.filter(i => i.id !== id))} onClear={() => setAnalysisHistory([])} onClose={() => setIsHistoryPanelOpen(false)} />}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row border border-purple-500/20 rounded-2xl bg-[#0a0a12] shadow-2xl shadow-purple-900/10 overflow-hidden" style={{ minHeight: '620px' }}>

                {/* ════ LEFT PANE ════ */}
                <div className="w-full lg:w-1/2 flex flex-col bg-[#06060c]/60 border-b lg:border-b-0 lg:border-r border-white/5">

                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                        <span className="text-[10px] font-bold tracking-wider text-pink-500">YOUR TEXT</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 font-mono">{wordCount} words · {charCount}/{CHAR_LIMIT}</span>
                            <button onClick={() => setIsHistoryPanelOpen(true)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-400 transition-colors">
                                <HistoryIcon /><span>History</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative p-3 min-h-[220px]">
                        <textarea
                            value={text}
                            onChange={(e) => e.target.value.length <= CHAR_LIMIT && setText(e.target.value)}
                            placeholder="Paste text for forensic analysis..."
                            className={`w-full h-full min-h-[200px] p-3 pr-10 bg-transparent rounded-xl outline-none border transition-all resize-none text-slate-200 placeholder-slate-700 leading-relaxed ${!text && !isLoading ? 'animate-border-pulse border-white/10' : 'border-white/10 focus:border-pink-500/30'}`}
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2">
                            <button onClick={() => handleUniversalTTS(text, 'input-main')} disabled={isLoading || !text.trim()} className={`p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs ${currentAudioId?.startsWith('input-main') ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' : ''}`}>
                                {currentAudioId === 'input-main-loading' ? <Spinner /> : currentAudioId === 'input-main' ? <AudioWaveIcon /> : <SpeakerIcon />}
                                <span className="hidden sm:inline">Audio</span>
                            </button>
                            <button onClick={handlePredictText} disabled={isLoading} className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:scale-105 transition-all flex items-center gap-1.5 text-xs">
                                {loadingAction === 'predict' ? <Spinner /> : <SparklesIcon />}
                                <span className="hidden sm:inline">Predict</span>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {prediction && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-3 mb-2 p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3 shrink-0">
                                <p className="text-slate-200 text-xs italic flex-1 line-clamp-2">"...{prediction}"</p>
                                <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => setPrediction(null)} className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded">Dismiss</button>
                                    <button onClick={() => { setText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + prediction); setPrediction(null); }} className="px-3 py-1 text-xs font-bold text-black bg-purple-400 hover:bg-purple-300 rounded-lg">Accept</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="px-4 py-3 border-t border-white/5 bg-[#06060c] shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-2">
                                <button onClick={() => fileUploadRef.current?.click()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors border border-white/5">
                                    <TextUploadIcon /> File
                                </button>
                                <input type="file" ref={fileUploadRef} className="hidden" accept="text/plain,.txt" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) { const r = new FileReader(); r.onload = (ev) => setText((ev.target?.result as string).substring(0, CHAR_LIMIT)); r.readAsText(file); }
                                }} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsStyleSetupOpen(true)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors border border-white/5">
                                    <PersonalizeIcon /> {writingStyle ? 'Edit Style' : 'Train Style'}
                                </button>
                                <button onClick={() => { setText(''); stopAudio(); }} disabled={!text || isLoading} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors border ${text && !isLoading ? 'text-slate-400 hover:text-red-400 border-white/5 bg-white/5 hover:bg-red-500/5' : 'text-slate-700 border-transparent'}`}>
                                    <ClearIcon /> Clear
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={handleAnalyze} disabled={isLoading || !text.trim()}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full border border-white/10 transition-colors disabled:opacity-40">
                                {loadingAction === 'analyze' ? <><Spinner /><span>Analyzing…</span></> : <span>Analyze</span>}
                            </button>

                            <div className="flex items-stretch rounded-full overflow-hidden border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.14))' }}>
                                <button onClick={handleHumanize} disabled={isLoading || !text.trim()}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 hover:brightness-125 transition-all disabled:opacity-40">
                                    {loadingAction === 'humanize' || isRealtimeHumanizing ? <><Spinner /><span className="text-pink-300">{isRealtimeHumanizing ? 'Rewriting…' : 'Humanizing…'}</span></> : <><HumanizerIcon /><span>Humanize</span></>}
                                </button>
                                <select value={humanizeMode} onChange={(e) => setHumanizeMode(e.target.value)}
                                    className="bg-transparent border-l border-white/10 px-2 py-2 text-xs text-slate-300 cursor-pointer outline-none">
                                    <option value="casual">Casual</option>
                                    <option value="professional">Professional</option>
                                    <option value="bypass">Undetectable</option>
                                    <option value="shorten">Shorten</option>
                                    <option value="expand">Expand</option>
                                </select>
                            </div>

                            <div ref={improvementRef} className="relative inline-flex rounded-full shadow-sm">
                                <button onClick={() => handleImprovement(improvementStyle)} disabled={isLoading || !text.trim()}
                                    className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-l-full border border-r-0 border-white/10 transition-colors disabled:opacity-40">
                                    {loadingAction === 'improve' ? <Spinner /> : improvementOptions.find(o => o.key === improvementStyle)?.icon}
                                    <span className="truncate max-w-[80px]">{loadingAction === 'improve' ? 'Processing…' : improvementOptions.find(o => o.key === improvementStyle)?.label}</span>
                                </button>
                                <button onClick={() => setIsImprovementDropdownOpen(!isImprovementDropdownOpen)}
                                    className="px-2.5 py-2 rounded-r-full bg-white/5 border border-white/10 hover:bg-white/10">
                                    <ChevronDownIcon />
                                </button>
                                <AnimatePresence>
                                    {isImprovementDropdownOpen && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                            className="absolute bottom-full mb-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 left-0">
                                            <ul className="p-1">
                                                {improvementOptions.map(option => (
                                                    <li key={option.key}>
                                                        <button onClick={() => { setImprovementStyle(option.key); setIsImprovementDropdownOpen(false); }}
                                                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-pink-500/10 rounded-lg flex items-center gap-3">
                                                            <span>{option.icon}</span><span>{option.label}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════ DIVIDER ════ */}
                <div className="hidden lg:flex w-1.5 bg-purple-500/5 hover:bg-purple-500/20 items-center justify-center cursor-col-resize transition-colors group">
                    <div className="w-0.5 h-8 bg-purple-500/20 group-hover:bg-purple-500/50 rounded-full" />
                </div>

                {/* ════ RIGHT PANE ════ */}
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
                        <button onClick={() => setLiveAnalysisEnabled(!liveAnalysisEnabled)} className="flex items-center gap-2 cursor-pointer group shrink-0">
                            <span className={`text-[10px] font-medium transition-colors ${liveAnalysisEnabled ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                ● Live {liveAnalysisEnabled ? 'ON' : 'OFF'}
                            </span>
                            <div className={`relative inline-flex items-center h-4 rounded-full w-7 transition-colors ${liveAnalysisEnabled ? 'bg-purple-600' : 'bg-slate-800 border border-white/10'}`}>
                                <span className={`inline-block w-2.5 h-2.5 transform rounded-full transition-transform ${liveAnalysisEnabled ? 'translate-x-3.5 bg-white' : 'translate-x-1 bg-slate-500'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

                        {/* Card 1 — AI Probability */}
                        <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${hasResults ? 'border-slate-700 border-l-purple-500/60' : 'border-slate-800 border-l-purple-500/20 hover:border-slate-700'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="flex items-start gap-3 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${hasResults ? 'border border-purple-500/40 bg-purple-500/10' : 'border-2 border-dashed border-slate-700 bg-slate-950/50'}`}>
                                    <Activity className={`w-4 h-4 ${hasResults ? 'text-purple-400' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-slate-300">AI Probability</span>
                                        {hasResults && aiScore !== null ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${aiScore > 70 ? 'bg-red-500/20 text-red-300 border-red-500/30' : aiScore > 40 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'}`}>
                                                    {aiScore}% AI
                                                </span>
                                                <button onClick={() => {
                                                    const all = results!.map(r => `AI Likelihood: ${r.aiLikelihood}%\n` + r.analysis.map(a => `Snippet: ${a.originalText}\nReason: ${a.reason}`).join('\n\n')).join('\n---\n');
                                                    navigator.clipboard.writeText(all); setIsAllCopied(true); setTimeout(() => setIsAllCopied(false), 2000);
                                                }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10">
                                                    {isAllCopied ? <CheckIcon /> : <ClipboardIcon />}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">Paste text to scan</span>
                                        )}
                                    </div>
                                    {hasResults ? (
                                        <div className="mt-2 flex flex-col sm:flex-row items-center gap-3">
                                            <div className="shrink-0"><Gauge score={results![0].aiLikelihood} /></div>
                                            <p className="text-xs text-slate-500 leading-relaxed">Neural pattern analysis complete. Score reflects structural AI-writing confidence.</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600 italic mt-1">Click Analyze to run forensic scan</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card 2 — Human Pattern Match */}
                        <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${correctedText ? 'border-slate-700 border-l-pink-500/60' : 'border-slate-800 border-l-pink-500/20 hover:border-slate-700'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="flex items-start gap-3 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${correctedText ? 'border border-pink-500/40 bg-pink-500/10' : 'border border-slate-700/50 bg-slate-950/50'}`}>
                                    <User className={`w-4 h-4 ${correctedText ? 'text-pink-400' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-medium text-slate-300">Human Pattern Match</span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {correctedText && (
                                                <>
                                                    <TTSButton text={correctedText} id="corrected-main" currentPlaying={currentAudioId} onPlay={handleUniversalTTS} />
                                                    <button onClick={() => { navigator.clipboard.writeText(correctedText); setIsCorrectedTextCopied(true); setTimeout(() => setIsCorrectedTextCopied(false), 2000); }}
                                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
                                                        {isCorrectedTextCopied ? <><CheckIcon /><span>Copied!</span></> : <><ClipboardIcon /><span>Copy</span></>}
                                                    </button>
                                                </>
                                            )}
                                            {isRealtimeHumanizing && <span className="text-xs text-pink-400 flex items-center gap-1"><Spinner /><span>Rewriting…</span></span>}
                                        </div>
                                    </div>
                                    {correctedText ? (
                                        <CorrectedTextView text={correctedText} originalText={lastHumanizedTextRef.current || text} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />
                                    ) : hasResults && aiScore !== null ? (
                                        <div className="flex flex-col mt-1">
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${100 - aiScore}%` }} />
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{100 - aiScore}% human patterns detected</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col mt-1">
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="w-0 h-full bg-slate-600 rounded-full" />
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Awaiting analysis</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card 3 — Style Fingerprint */}
                        <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${(rephrasedGptResults || writingStyle) ? 'border-slate-700 border-l-indigo-500/60' : 'border-slate-800 border-l-indigo-500/20 hover:border-slate-700'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="flex items-start gap-3 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${(rephrasedGptResults || writingStyle) ? 'border border-indigo-500/40 bg-indigo-500/10' : 'border border-slate-700/50 bg-slate-950/50'}`}>
                                    <BarChart2 className={`w-4 h-4 ${(rephrasedGptResults || writingStyle) ? 'text-indigo-400' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-slate-300 block mb-1.5">Style Fingerprint</span>
                                    {rephrasedGptResults ? (
                                        <RephrasedGptResultsView results={rephrasedGptResults} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />
                                    ) : writingStyle ? (
                                        <div className="text-xs space-y-1">
                                            {writingStyle.tone && <div className="flex items-center gap-2"><span className="text-slate-500">Tone:</span><span className="text-indigo-300 font-medium capitalize">{writingStyle.tone}</span></div>}
                                            {(writingStyle as any).vocabulary && <div className="flex items-center gap-2"><span className="text-slate-500">Vocabulary:</span><span className="text-indigo-300 font-medium capitalize">{(writingStyle as any).vocabulary}</span></div>}
                                            <p className="text-slate-600 italic text-[10px] mt-1">Style active — use "Rephrase with GPT" to apply</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-600 italic">No analysis yet</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card 4 — Actionable Suggestions */}
                        <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${hasResults && results![0].analysis.length > 0 ? 'border-slate-700 border-l-amber-500/60' : 'border-slate-800 border-l-amber-500/20 hover:border-slate-700'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="flex items-start gap-3 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${hasResults && results![0].analysis.length > 0 ? 'border border-amber-500/40 bg-amber-500/10' : 'border border-slate-700/50 bg-slate-950/50'}`}>
                                    <ListTodo className={`w-4 h-4 ${hasResults && results![0].analysis.length > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-medium text-slate-300">Actionable Suggestions</span>
                                        {hasResults && results![0].analysis.length > 0 && (
                                            <span className="text-xs text-slate-500 shrink-0">{results![0].analysis.length} pattern{results![0].analysis.length !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                    {hasResults && results![0].analysis.length > 0 ? (
                                        <div className="space-y-4 mt-1">
                                            {results![0].analysis.map((item, index) => (
                                                <AnalysisCard key={index} cardIndex={index} item={item} onImplementSuggestion={handleImplementSuggestion} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 mt-1">
                                            <div className="w-32 h-1 bg-slate-800 rounded-full" />
                                            <div className="w-48 h-1 bg-slate-800 rounded-full" />
                                            <span className="text-xs text-slate-600 italic block mt-1">Suggestions appear here after analysis</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

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
