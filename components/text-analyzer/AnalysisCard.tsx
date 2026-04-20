import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TextAnalysisItem } from '../../types';
import { ClipboardIcon, CheckIcon, ImplementIcon } from '../Icons';
import TTSButton from './TTSButton';
import { md } from '../../utils/md';

interface Props {
    item: TextAnalysisItem;
    onImplementSuggestion: (original: string, suggestion: string) => void;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
    cardIndex: number;
}

const AnalysisCard: React.FC<Props> = ({ item, onImplementSuggestion, onTTS, currentAudio, cardIndex }) => {
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
                            <div className="text-sm text-teal-200/90 leading-relaxed pr-8" dangerouslySetInnerHTML={md(item.reason)} />
                        </div>
                    </div>
                    {item.context && (
                        <div className="border-t border-teal-800/50 pt-3">
                            <h4 className="font-semibold text-gray-300 text-xs mb-1">Context</h4>
                            <div className="text-sm text-gray-400 italic" dangerouslySetInnerHTML={md(item.context)} />
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
                                    <div className="text-sm text-gray-200 flex-1 break-words">
                                        <span className="font-bold text-teal-400 mr-1">{index + 1}.</span>
                                        <span dangerouslySetInnerHTML={md(suggestion)} />
                                    </div>
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

export default AnalysisCard;
