import React from 'react';
import { Activity } from 'lucide-react';
import type { BatchResult } from './types';
import Gauge from '../Gauge';
import { ClipboardIcon, CheckIcon } from '../Icons';

interface Props {
    results: BatchResult[] | null;
    aiScore: number | null;
    onCopyAll: () => void;
    isCopied: boolean;
}

const AIScoreCard: React.FC<Props> = ({ results, aiScore, onCopyAll, isCopied }) => {
    const hasResults = !!results && results.length > 0;
    return (
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
                                <button onClick={onCopyAll} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10">
                                    {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-600 italic">Paste text to scan</span>
                        )}
                    </div>
                    {hasResults && results ? (
                        <div className="mt-2 flex flex-col sm:flex-row items-center gap-3">
                            <div className="shrink-0"><Gauge score={results[0].aiLikelihood} /></div>
                            <p className="text-xs text-slate-500 leading-relaxed">Neural pattern analysis complete. Score reflects structural AI-writing confidence.</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 italic mt-1">Click Analyze to run forensic scan</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIScoreCard;
