import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon, CheckIcon } from '../Icons';
import TTSButton from './TTSButton';

interface Props {
    results: string[];
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
}

const RephrasedGptResultsView: React.FC<Props> = ({ results, onTTS, currentAudio }) => {
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
                                        <motion.span key="copied" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}><CheckIcon /></motion.span>
                                    ) : (
                                        <motion.span key="copy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}><ClipboardIcon /></motion.span>
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

export default RephrasedGptResultsView;
