import React from 'react';
import { User } from 'lucide-react';
import Spinner from '../Spinner';
import { ClipboardIcon, CheckIcon } from '../Icons';
import TTSButton from './TTSButton';
import CorrectedTextView from './CorrectedTextView';

interface Props {
    correctedText: string | null;
    originalText: string;
    aiScore: number | null;
    hasResults: boolean;
    isRealtimeHumanizing: boolean;
    isCopied: boolean;
    onCopy: () => void;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
}

const HumanPatternCard: React.FC<Props> = ({
    correctedText, originalText, aiScore, hasResults, isRealtimeHumanizing,
    isCopied, onCopy, onTTS, currentAudio,
}) => (
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
                                <TTSButton text={correctedText} id="corrected-main" currentPlaying={currentAudio} onPlay={onTTS} />
                                <button onClick={onCopy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
                                    {isCopied ? <><CheckIcon /><span>Copied!</span></> : <><ClipboardIcon /><span>Copy</span></>}
                                </button>
                            </>
                        )}
                        {isRealtimeHumanizing && <span className="text-xs text-pink-400 flex items-center gap-1"><Spinner /><span>Rewriting…</span></span>}
                    </div>
                </div>
                {correctedText ? (
                    <CorrectedTextView text={correctedText} originalText={originalText} onTTS={onTTS} currentAudio={currentAudio} />
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
);

export default HumanPatternCard;
