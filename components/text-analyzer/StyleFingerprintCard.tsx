import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { WritingStyleProfile } from '../../types';
import RephrasedGptResultsView from './RephrasedGptResultsView';

interface Props {
    rephrasedGptResults: string[] | null;
    writingStyle: WritingStyleProfile | null;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
}

const StyleFingerprintCard: React.FC<Props> = ({ rephrasedGptResults, writingStyle, onTTS, currentAudio }) => (
    <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${(rephrasedGptResults || writingStyle) ? 'border-slate-700 border-l-indigo-500/60' : 'border-slate-800 border-l-indigo-500/20 hover:border-slate-700'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex items-start gap-3 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${(rephrasedGptResults || writingStyle) ? 'border border-indigo-500/40 bg-indigo-500/10' : 'border border-slate-700/50 bg-slate-950/50'}`}>
                <BarChart2 className={`w-4 h-4 ${(rephrasedGptResults || writingStyle) ? 'text-indigo-400' : 'text-slate-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-300 block mb-1.5">Style Fingerprint</span>
                {rephrasedGptResults ? (
                    <RephrasedGptResultsView results={rephrasedGptResults} onTTS={onTTS} currentAudio={currentAudio} />
                ) : writingStyle ? (
                    <div className="text-xs space-y-1">
                        {writingStyle.tone && <div className="flex items-center gap-2"><span className="text-slate-500">Tone:</span><span className="text-indigo-300 font-medium capitalize">{writingStyle.tone}</span></div>}
                        {writingStyle.complexity && <div className="flex items-center gap-2"><span className="text-slate-500">Complexity:</span><span className="text-indigo-300 font-medium capitalize">{writingStyle.complexity}</span></div>}
                        {writingStyle.useContractions && <div className="flex items-center gap-2"><span className="text-slate-500">Contractions:</span><span className="text-indigo-300 font-medium capitalize">{writingStyle.useContractions}</span></div>}
                        <p className="text-slate-600 italic text-[10px] mt-1">Style active — use "Rephrase with GPT" to apply</p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-600 italic">No analysis yet</span>
                )}
            </div>
        </div>
    </div>
);

export default StyleFingerprintCard;
