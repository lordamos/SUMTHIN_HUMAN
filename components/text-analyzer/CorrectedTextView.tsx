import React from 'react';
import { motion } from 'framer-motion';
import TTSButton from './TTSButton';

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

interface Props {
    text: string;
    originalText?: string;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
}

const CorrectedTextView: React.FC<Props> = ({ text, originalText, onTTS, currentAudio }) => (
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

export default CorrectedTextView;
