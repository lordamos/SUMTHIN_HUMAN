import React from 'react';
import Spinner from '../Spinner';
import { AudioWaveIcon, SpeakerIcon } from '../Icons';

interface Props {
    text: string;
    id: string;
    currentPlaying: string | null;
    onPlay: (text: string, id: string) => void;
    className?: string;
}

const TTSButton: React.FC<Props> = ({ text, id, currentPlaying, onPlay, className }) => {
    const isPlaying = currentPlaying === id;
    const isGenerating = currentPlaying === `${id}-loading`;

    return (
        <button
            onClick={() => onPlay(text, id)}
            disabled={isGenerating && !isPlaying}
            className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-teal-300 transition-all ${className ?? ''} ${isPlaying ? 'border-teal-500/30 bg-teal-500/10' : ''}`}
            title="Read Aloud"
        >
            {isGenerating ? <Spinner /> : isPlaying ? <AudioWaveIcon /> : <SpeakerIcon className="w-3.5 h-3.5" />}
        </button>
    );
};

export default TTSButton;
