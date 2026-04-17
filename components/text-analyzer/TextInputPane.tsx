import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WritingStyleProfile } from '../../types';
import Spinner from '../Spinner';
import {
    TextUploadIcon, ClearIcon, PersonalizeIcon, ChevronDownIcon,
    GrammarIcon, RewordIcon, RephraseGptIcon, ShortenIcon, LengthenIcon,
    SimplifyIcon, ReadabilityIcon, HumanizerIcon, SparklesIcon,
    SpeakerIcon, AudioWaveIcon,
} from '../Icons';

const improvementOptions = [
    { key: 'fix', label: 'Fix Spelling & Grammar', icon: <GrammarIcon /> },
    { key: 'reword', label: 'Reword Text', icon: <RewordIcon /> },
    { key: 'rephrase-gpt', label: 'Rephrase with GPT', icon: <RephraseGptIcon /> },
    { key: 'shorten', label: 'Make Shorter', icon: <ShortenIcon /> },
    { key: 'lengthen', label: 'Make Longer', icon: <LengthenIcon /> },
    { key: 'simplify', label: 'Simplify Language', icon: <SimplifyIcon /> },
    { key: 'readability', label: 'Improve Readability', icon: <ReadabilityIcon /> },
];

interface Props {
    text: string;
    onTextChange: (t: string) => void;
    wordCount: number;
    charCount: number;
    charLimit: number;
    isLoading: boolean;
    isRealtimeHumanizing: boolean;
    loadingAction: string | null;
    prediction: string | null;
    onDismissPrediction: () => void;
    onAcceptPrediction: () => void;
    writingStyle: WritingStyleProfile | null;
    onOpenHistory: () => void;
    onOpenStyleSetup: () => void;
    onAnalyze: () => void;
    onHumanize: () => void;
    onPredictText: () => void;
    onImprovement: (style: string) => void;
    humanizeMode: string;
    onHumanizeModeChange: (mode: string) => void;
    currentAudioId: string | null;
    onTTS: (text: string, id: string) => void;
    improvementStyle: string;
    onImprovementStyleChange: (s: string) => void;
    isImprovementDropdownOpen: boolean;
    onToggleImprovementDropdown: () => void;
    improvementRef: React.RefObject<HTMLDivElement>;
    onClear: () => void;
    onFileUpload: (file: File) => void;
}

const TextInputPane: React.FC<Props> = ({
    text, onTextChange, wordCount, charCount, charLimit, isLoading, isRealtimeHumanizing,
    loadingAction, prediction, onDismissPrediction, onAcceptPrediction, writingStyle,
    onOpenHistory, onOpenStyleSetup, onAnalyze, onHumanize, onPredictText, onImprovement,
    humanizeMode, onHumanizeModeChange, currentAudioId, onTTS,
    improvementStyle, onImprovementStyleChange, isImprovementDropdownOpen,
    onToggleImprovementDropdown, improvementRef, onClear, onFileUpload,
}) => {
    const fileUploadRef = useRef<HTMLInputElement>(null);

    return (
        <div className="w-full lg:w-1/2 flex flex-col bg-[#06060c]/60 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                <span className="text-[10px] font-bold tracking-wider text-pink-500">YOUR TEXT</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{wordCount} words · {charCount}/{charLimit}</span>
                    <button onClick={onOpenHistory} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-400 transition-colors">
                        <span>⏱</span><span>History</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative p-3 min-h-[220px]">
                <textarea
                    value={text}
                    onChange={(e) => e.target.value.length <= charLimit && onTextChange(e.target.value)}
                    placeholder="Paste text for forensic analysis..."
                    className={`w-full h-full min-h-[200px] p-3 pr-10 bg-transparent rounded-xl outline-none border transition-all resize-none text-slate-200 placeholder-slate-700 leading-relaxed ${!text && !isLoading ? 'border-white/10' : 'border-white/10 focus:border-pink-500/30'}`}
                    disabled={isLoading}
                />
                <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2">
                    <button onClick={() => onTTS(text, 'input-main')} disabled={isLoading || !text.trim()}
                        className={`p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs ${currentAudioId?.startsWith('input-main') ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' : ''}`}>
                        {currentAudioId === 'input-main-loading' ? <Spinner /> : currentAudioId === 'input-main' ? <AudioWaveIcon /> : <SpeakerIcon />}
                        <span className="hidden sm:inline">Audio</span>
                    </button>
                    <button onClick={onPredictText} disabled={isLoading}
                        className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:scale-105 transition-all flex items-center gap-1.5 text-xs">
                        {loadingAction === 'predict' ? <Spinner /> : <SparklesIcon />}
                        <span className="hidden sm:inline">Predict</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {prediction && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="mx-3 mb-2 p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3 shrink-0">
                        <p className="text-slate-200 text-xs italic flex-1 line-clamp-2">"...{prediction}"</p>
                        <div className="flex gap-1.5 shrink-0">
                            <button onClick={onDismissPrediction} className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded">Dismiss</button>
                            <button onClick={onAcceptPrediction} className="px-3 py-1 text-xs font-bold text-black bg-purple-400 hover:bg-purple-300 rounded-lg">Accept</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 py-3 border-t border-white/5 bg-[#06060c] shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2">
                        <button onClick={() => fileUploadRef.current?.click()}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors border border-white/5">
                            <TextUploadIcon /> File
                        </button>
                        <input type="file" ref={fileUploadRef} className="hidden" accept="text/plain,.txt" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onFileUpload(file);
                        }} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onOpenStyleSetup}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors border border-white/5">
                            <PersonalizeIcon /> {writingStyle ? 'Edit Style' : 'Train Style'}
                        </button>
                        <button onClick={onClear} disabled={!text || isLoading}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors border ${text && !isLoading ? 'text-slate-400 hover:text-red-400 border-white/5 bg-white/5 hover:bg-red-500/5' : 'text-slate-700 border-transparent'}`}>
                            <ClearIcon /> Clear
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={onAnalyze} disabled={isLoading || !text.trim()}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full border border-white/10 transition-colors disabled:opacity-40">
                        {loadingAction === 'analyze' ? <><Spinner /><span>Analyzing…</span></> : <span>Analyze</span>}
                    </button>

                    <div className="flex items-stretch rounded-full overflow-hidden border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.14))' }}>
                        <button onClick={onHumanize} disabled={isLoading || !text.trim()}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 hover:brightness-125 transition-all disabled:opacity-40">
                            {loadingAction === 'humanize' || isRealtimeHumanizing
                                ? <><Spinner /><span className="text-pink-300">{isRealtimeHumanizing ? 'Rewriting…' : 'Humanizing…'}</span></>
                                : <><HumanizerIcon /><span>Humanize</span></>}
                        </button>
                        <select value={humanizeMode} onChange={(e) => onHumanizeModeChange(e.target.value)}
                            className="bg-transparent border-l border-white/10 px-2 py-2 text-xs text-slate-300 cursor-pointer outline-none">
                            <option value="casual">Casual</option>
                            <option value="professional">Professional</option>
                            <option value="bypass">Undetectable</option>
                            <option value="shorten">Shorten</option>
                            <option value="expand">Expand</option>
                        </select>
                    </div>

                    <div ref={improvementRef} className="relative inline-flex rounded-full shadow-sm">
                        <button onClick={() => onImprovement(improvementStyle)} disabled={isLoading || !text.trim()}
                            className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-l-full border border-r-0 border-white/10 transition-colors disabled:opacity-40">
                            {loadingAction === 'improve' ? <Spinner /> : improvementOptions.find(o => o.key === improvementStyle)?.icon}
                            <span className="truncate max-w-[80px]">{loadingAction === 'improve' ? 'Processing…' : improvementOptions.find(o => o.key === improvementStyle)?.label}</span>
                        </button>
                        <button onClick={onToggleImprovementDropdown} className="px-2.5 py-2 rounded-r-full bg-white/5 border border-white/10 hover:bg-white/10">
                            <ChevronDownIcon />
                        </button>
                        <AnimatePresence>
                            {isImprovementDropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                    className="absolute bottom-full mb-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 left-0">
                                    <ul className="p-1">
                                        {improvementOptions.map(option => (
                                            <li key={option.key}>
                                                <button onClick={() => { onImprovementStyleChange(option.key); onToggleImprovementDropdown(); }}
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
    );
};

export default TextInputPane;
