import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeText, improveText, humanizeText, predictNextText, generateSpeech } from '../services/geminiService';
import type { TextAnalysisResult, TextAnalysisItem, WritingStyleProfile, HistoryItem, CloudFile, CloudProvider } from '../types';
import Gauge from './Gauge';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import WritingStyleSetup from './WritingStyleSetup';
import HistoryPanel from './HistoryPanel';
import CloudPicker from './CloudPicker';
import { 
    ClipboardIcon, CheckIcon, GrammarIcon, ChevronDownIcon, 
    ToneIcon, ShortenIcon, LengthenIcon, SimplifyIcon, FormalIcon, 
    NormalIcon, ProfessionalIcon, ColloquialIcon, AcademicIcon, 
    BusinessIcon, CreativeIcon, FriendlyIcon, RewordIcon, TextUploadIcon, 
    ClearIcon, RephraseGptIcon, HumanizerIcon, PersonalizeIcon, HistoryIcon, ImplementIcon, ReadabilityIcon, DocumentIcon, SparklesIcon, SpeakerIcon, AudioWaveIcon, CloudIcon,
    GoogleDriveIcon, DropboxIcon
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

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const TTSButton: React.FC<{ text: string; id: string; currentPlaying: string | null; onPlay: (text: string, id: string) => void; className?: string }> = ({ text, id, currentPlaying, onPlay, className }) => {
    const isPlaying = currentPlaying === id;
    const isGenerating = currentPlaying === `${id}-loading`;

    return (
        <button
            onClick={() => onPlay(text, id)}
            disabled={isGenerating && !isPlaying}
            className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-teal-300 transition-all ${className} ${isPlaying ? 'border-teal-500/30 bg-teal-500/10' : ''}`}
            title="Read Aloud"
        >
            {isGenerating ? <Spinner /> : isPlaying ? <AudioWaveIcon /> : <SpeakerIcon className="w-3.5 h-3.5" />}
        </button>
    );
};

const RephrasedGptResultsView: React.FC<{ results: string[]; onTTS: (text: string, id: string) => void; currentAudio: string | null }> = ({ results, onTTS, currentAudio }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Rephrasing Suggestions</h2>
            <div className="space-y-3">
                {results.map((result, index) => (
                    <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="p-4 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center gap-4 hover:border-teal-400/30 transition-colors"
                    >
                        <p className="text-gray-200 whitespace-pre-wrap font-sans text-base leading-relaxed flex-1">
                           <span className="font-bold text-teal-400 mr-2">{index + 1}.</span> {result}
                        </p>
                        <div className="flex gap-2 shrink-0">
                            <TTSButton text={result} id={`rephrase-${index}`} currentPlaying={currentAudio} onPlay={onTTS} />
                            <button
                                onClick={() => handleCopy(result, index)}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {copiedIndex === index ? (
                                        <motion.span key="copied-rephrased" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}><CheckIcon /></motion.span>
                                    ) : (
                                        <motion.span key="copy-rephrased" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}><ClipboardIcon /></motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

function buildDiffHtml(original: string, modified: string): string {
    const origSet = new Set(original.split(/\s+/));
    return modified.split(' ').map(word => {
        const clean = word.replace(/[^a-zA-Z0-9]/g, '');
        if (clean && !origSet.has(word) && !origSet.has(clean)) {
            return `<mark style="background:#0ea5e933;color:#7dd3fc;padding:1px 3px;border-radius:4px;border:1px solid #0ea5e955">${word}</mark>`;
        }
        return word;
    }).join(' ');
}

const CorrectedTextView: React.FC<{ text: string; originalText?: string; onTTS: (text: string, id: string) => void; currentAudio: string | null }> = ({ text, originalText, onTTS, currentAudio }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-black/20 border border-white/10 hover:border-teal-400/30 transition-colors relative group"
    >
        <div className="absolute top-4 right-4">
            <TTSButton text={text} id="humanized-main" currentPlaying={currentAudio} onPlay={onTTS} className="opacity-0 group-hover:opacity-100" />
        </div>
        {originalText ? (
            <p
                className="text-gray-200 whitespace-pre-wrap font-sans text-base leading-relaxed pr-12"
                dangerouslySetInnerHTML={{ __html: buildDiffHtml(originalText, text) }}
            />
        ) : (
            <pre className="text-gray-200 whitespace-pre-wrap font-sans text-base leading-relaxed pr-12">
                {text}
            </pre>
        )}
    </motion.div>
);

interface AnalysisCardProps {
    item: TextAnalysisItem;
    onImplementSuggestion: (original: string, suggestion: string) => void;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
    cardIndex: number;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ item, onImplementSuggestion, onTTS, currentAudio, cardIndex }) => {
    const [copiedSuggestionIndex, setCopiedSuggestionIndex] = useState<number | null>(null);

    const handleCopySuggestion = (suggestion: string, index: number) => {
        navigator.clipboard.writeText(suggestion).then(() => {
            setCopiedSuggestionIndex(index);
            setTimeout(() => setCopiedSuggestionIndex(null), 2000);
        });
    };

    return (
        <div className="space-y-4">
            <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <div className="max-w-[85%] p-3 rounded-2xl border bg-gradient-to-br from-amber-900/10 to-amber-700/5 border-amber-400/10">
                    <div className="text-sm text-amber-200">{item.originalText}</div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">Original Text</div>
                </div>
            </motion.div>
            <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl border bg-gradient-to-br from-teal-900/30 to-teal-700/10 border-teal-400/20 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <h4 className="font-semibold text-teal-300 text-xs mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    Forensic Reasoning
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${item.confidenceScore > 80 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-teal-500/20 text-teal-300 border-teal-500/30'}`}>
                                        {item.confidenceScore}% Confidence
                                    </span>
                                </span>
                                <TTSButton text={item.reason} id={`reason-${cardIndex}`} currentPlaying={currentAudio} onPlay={onTTS} />
                            </h4>
                            <p className="text-sm text-teal-200/90 leading-relaxed pr-8">{item.reason}</p>
                        </div>
                    </div>
                    {item.context && (
                        <div className="border-t border-teal-800/50 pt-3">
                            <h4 className="font-semibold text-gray-300 text-xs mb-1">Context</h4>
                            <p className="text-sm text-gray-400 italic">{item.context}</p>
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-gray-300 text-xs mb-1 mt-3">Suggestions</h4>
                        <div className="space-y-2 mt-2">
                            {item.suggestions.map((suggestion, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:border-teal-400/30 transition-colors group"
                                >
                                    <p className="text-sm text-gray-200 flex-1 break-words">
                                        <span className="font-bold text-teal-400 mr-1">{index + 1}.</span> {suggestion}
                                    </p>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <TTSButton text={suggestion} id={`sugg-${cardIndex}-${index}`} currentPlaying={currentAudio} onPlay={onTTS} />
                                        <button onClick={() => handleCopySuggestion(suggestion, index)} className="p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
                                            <AnimatePresence mode="wait" initial={false}>
                                                {copiedSuggestionIndex === index ? <CheckIcon /> : <ClipboardIcon />}
                                            </AnimatePresence>
                                        </button>
                                        <button onClick={() => onImplementSuggestion(item.originalText, suggestion)} className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1.5 rounded-lg transition-all transform hover:scale-105">
                                            <ImplementIcon /> <span className="hidden sm:inline">Implement</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

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
    const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
    const analyzerRef = useRef<HTMLDivElement>(null);

    const isLoading = !!loadingAction;

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(text.trim() === '' ? 0 : words.length);
        setCharCount(text.length);
    }, [text]);

    useEffect(() => {
        if (!text.trim()) return;
        const timeout = setTimeout(async () => {
            setIsRealtimeHumanizing(true);
            try {
                let result: string | null = null;
                try {
                    const res = await fetch('/humanize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, mode: humanizeMode }),
                    });
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
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
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
        catch (err: any) { setError('Prediction failed.'); }
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

    return (
        <div className="space-y-6" ref={analyzerRef}>
            <AnimatePresence>
                {isStyleSetupOpen && <WritingStyleSetup onSave={(p) => { setWritingStyle(p); localStorage.setItem('userWritingStyle', JSON.stringify(p)); setIsStyleSetupOpen(false); }} onClose={() => setIsStyleSetupOpen(false)} initialProfile={writingStyle} />}
                {isHistoryPanelOpen && <HistoryPanel history={analysisHistory} onSelect={(item) => { setText(item.text); setResults([{ ...item.result, fileName: 'From History' }]); setIsHistoryPanelOpen(false); }} onDelete={(id) => setAnalysisHistory(prev => prev.filter(i => i.id !== id))} onClear={() => setAnalysisHistory([])} onClose={() => setIsHistoryPanelOpen(false)} />}
                {isCloudPickerOpen && <CloudPicker onClose={() => setIsCloudPickerOpen(false)} onSelect={(f) => { setText(`[Imported: ${f.name}]\nSample content...`); setIsCloudPickerOpen(false); }} allowedMimeTypes={['text/plain']} />}
            </AnimatePresence>

            <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-400 ml-2">Text Input</label>
                    <button onClick={() => setIsHistoryPanelOpen(true)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-teal-300 transition-colors"><HistoryIcon /><span>History</span></button>
                 </div>
                <div className="relative group">
                    <textarea
                        value={text}
                        onChange={(e) => e.target.value.length <= CHAR_LIMIT && setText(e.target.value)}
                        placeholder="Paste text for forensic analysis..."
                        className={`w-full h-48 p-4 pr-12 bg-black/20 rounded-2xl outline-none border transition-all ${!text && !isLoading ? 'animate-border-pulse border-white/10' : 'border-white/10'}`}
                        disabled={isLoading}
                    />
                    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                        <button onClick={() => handleUniversalTTS(text, 'input-main')} disabled={isLoading || !text.trim()} className={`p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 ${currentAudioId?.startsWith('input-main') ? 'bg-teal-500/10 text-teal-300' : ''}`}>
                            {currentAudioId === 'input-main-loading' ? <Spinner /> : currentAudioId === 'input-main' ? <AudioWaveIcon /> : <SpeakerIcon />}
                            <span className="text-xs font-semibold hidden sm:inline">Audio Reader</span>
                        </button>
                         <button onClick={handlePredictText} disabled={isLoading} className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:scale-105 transition-all flex items-center gap-2">
                             {loadingAction === 'predict' ? <Spinner /> : <SparklesIcon />}
                             <span className="text-xs font-semibold hidden sm:inline">Auto-Predict</span>
                         </button>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2 px-2 text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                        <button onClick={() => fileUploadRef.current?.click()} className="flex items-center gap-2 hover:text-teal-300 transition-all"><TextUploadIcon /><span>Local File</span></button>
                        <button onClick={() => setIsCloudPickerOpen(true)} className="flex items-center gap-2 hover:text-blue-400 transition-all"><CloudIcon /><span>Cloud</span></button>
                        <input type="file" ref={fileUploadRef} className="hidden" accept="text/plain,.txt" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const r = new FileReader();
                                r.onload = (ev) => setText((ev.target?.result as string).substring(0, CHAR_LIMIT));
                                r.readAsText(file);
                            }
                        }} />
                        <button onClick={() => { setText(''); stopAudio(); }} className={`flex items-center gap-2 ${text && !isLoading ? 'hover:text-amber-400' : 'text-gray-600'}`} disabled={!text || isLoading}><ClearIcon /><span>Clear</span></button>
                    </div>
                    <span>{wordCount} Words | {charCount}/{CHAR_LIMIT} Chars</span>
                </div>
                <AnimatePresence>
                    {prediction && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 p-4 bg-teal-900/30 border border-teal-500/30 rounded-xl flex items-center justify-between shadow-xl">
                            <p className="text-gray-200 text-sm italic">"...{prediction}"</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPrediction(null)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Dismiss</button>
                                <button onClick={() => { setText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + prediction); setPrediction(null); }} className="px-4 py-1.5 text-xs font-bold text-black bg-teal-400 hover:bg-teal-300 rounded-lg">Accept</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center justify-center pt-4">
                <button onClick={handleAnalyze} disabled={isLoading || !text.trim()} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all font-semibold min-w-[200px] flex items-center justify-center">
                    {loadingAction === 'analyze' ? <><Spinner /> Analyzing...</> : 'Analyze Text'}
                </button>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={handleHumanize} disabled={isLoading || !text.trim()} className="px-6 py-3 rounded-2xl bg-gradient-to-br from-teal-400/30 to-amber-400/20 border border-white/10 hover:scale-105 transition-all font-semibold min-w-[160px] flex items-center justify-center gap-2">
                        {loadingAction === 'humanize' || isRealtimeHumanizing ? <><Spinner /> {isRealtimeHumanizing ? 'Rewriting...' : 'Humanizing...'}</> : <><HumanizerIcon /> <span>Humanize</span></>}
                    </button>
                    <select
                        value={humanizeMode}
                        onChange={(e) => setHumanizeMode(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-200 cursor-pointer outline-none hover:border-teal-400/40 transition-colors"
                    >
                        <option value="casual">Casual</option>
                        <option value="professional">Professional</option>
                        <option value="bypass">Undetectable</option>
                        <option value="shorten">Shorten</option>
                        <option value="expand">Expand</option>
                    </select>
                </div>
                <button onClick={() => setIsStyleSetupOpen(true)} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold min-w-[200px] flex items-center justify-center gap-2"><PersonalizeIcon /> <span>{writingStyle ? "Edit Style" : "Train AI Style"}</span></button>
                <div ref={improvementRef} className="relative inline-flex rounded-2xl shadow-sm">
                    <button onClick={() => handleImprovement(improvementStyle)} disabled={isLoading || !text.trim()} className="px-6 py-3 rounded-l-2xl bg-white/5 border border-r-0 border-white/10 hover:bg-white/10 font-semibold min-w-[200px] flex items-center justify-center gap-2">
                        {loadingAction === 'improve' ? <Spinner /> : (improvementOptions.find(o => o.key === improvementStyle)?.icon)}
                        <span>{loadingAction === 'improve' ? 'Processing...' : (improvementOptions.find(o => o.key === improvementStyle)?.label)}</span>
                    </button>
                    <button onClick={() => setIsImprovementDropdownOpen(!isImprovementDropdownOpen)} className="px-3 py-3 rounded-r-2xl bg-white/5 border border-white/10 hover:bg-white/10"><ChevronDownIcon /></button>
                    <AnimatePresence>
                        {isImprovementDropdownOpen && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-2 w-56 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-20 right-0">
                                <ul className="p-1">
                                    {improvementOptions.map(option => (
                                        <li key={option.key}><button onClick={() => { setImprovementStyle(option.key); setIsImprovementDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-teal-500/10 rounded-md flex items-center gap-3"><span>{option.icon}</span><span>{option.label}</span></button></li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>{error && <ErrorDisplay message={error} onDismiss={() => setError(null)} />}</AnimatePresence>

            {/* Empty state hero — shown when no results exist yet */}
            <AnimatePresence>
                {!correctedText && !rephrasedGptResults && (!results || results.length === 0) && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center py-10 gap-5 select-none pointer-events-none"
                    >
                        <motion.img
                            src="/logo3.png"
                            alt="HayL3ditor"
                            className="w-56 sm:w-72 object-contain"
                            style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.35))' }}
                            animate={{
                                filter: [
                                    'drop-shadow(0 0 14px rgba(236,72,153,0.25))',
                                    'drop-shadow(0 0 28px rgba(168,85,247,0.55)) drop-shadow(0 0 50px rgba(129,140,248,0.2))',
                                    'drop-shadow(0 0 14px rgba(236,72,153,0.25))',
                                ],
                                opacity: [0.75, 1, 0.75],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div className="flex flex-col items-center gap-1.5">
                            <p className="text-[11px] font-black tracking-[0.35em] uppercase"
                                style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                AI Forensics Platform
                            </p>
                            <p className="text-[10px] text-gray-600 tracking-widest">Paste text above and run an analysis to begin</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {correctedText && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-200">Humanized Version</h2>
                        <div className="flex gap-2">
                             <TTSButton text={correctedText} id="corrected-main" currentPlaying={currentAudioId} onPlay={handleUniversalTTS} />
                             <button onClick={() => { navigator.clipboard.writeText(correctedText); setIsCorrectedTextCopied(true); setTimeout(() => setIsCorrectedTextCopied(false), 2000); }} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 px-4 rounded-lg flex items-center gap-2 text-sm">
                                {isCorrectedTextCopied ? <><CheckIcon /> Copied!</> : <><ClipboardIcon /> Copy Result</>}
                             </button>
                        </div>
                    </div>
                    <CorrectedTextView text={correctedText} originalText={lastHumanizedTextRef.current || text} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />
                </div>
            )}

            {rephrasedGptResults && <RephrasedGptResultsView results={rephrasedGptResults} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />}
            
            {results && results.length > 0 && (
                <div className="space-y-6 border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2"><DocumentIcon className="text-teal-400"/>Analysis Report</h2>
                        <button onClick={() => {
                            const all = results.map(r => `AI Likelihood: ${r.aiLikelihood}%\n` + r.analysis.map(a => `Snippet: ${a.originalText}\nReason: ${a.reason}`).join('\n\n')).join('\n---\n');
                            navigator.clipboard.writeText(all);
                            setIsAllCopied(true);
                            setTimeout(() => setIsAllCopied(false), 2000);
                        }} className="bg-white/5 border border-white/10 text-white py-2 px-4 rounded-lg flex items-center gap-2 text-sm min-w-[190px]">
                            {isAllCopied ? <><CheckIcon /> Copied!</> : <><ClipboardIcon /> Copy Full Report</>}
                        </button>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex flex-col md:flex-row items-center justify-center gap-8">
                         <div className="flex-shrink-0"><Gauge score={results[0].aiLikelihood} /></div>
                         <div className="text-center md:text-left">
                            <h2 className="text-2xl font-semibold text-gray-100">AI Likelihood Score</h2>
                            <p className="text-gray-300 mt-2 max-w-md">Our neural analyst has scanned your text for patterns commonly associated with large language models. The score above reflects structural confidence.</p>
                         </div>
                    </div>
                    {results[0].analysis.map((item, index) => <AnalysisCard key={index} cardIndex={index} item={item} onImplementSuggestion={handleImplementSuggestion} onTTS={handleUniversalTTS} currentAudio={currentAudioId} />)}
                </div>
            )}
        </div>
    );
};

export default TextAnalyzer;