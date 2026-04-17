import React from 'react';
import { ListTodo } from 'lucide-react';
import type { TextAnalysisItem } from '../../types';
import AnalysisCard from './AnalysisCard';

interface Props {
    analysis: TextAnalysisItem[];
    hasResults: boolean;
    onImplementSuggestion: (original: string, suggestion: string) => void;
    onTTS: (text: string, id: string) => void;
    currentAudio: string | null;
}

const SuggestionsCard: React.FC<Props> = ({ analysis, hasResults, onImplementSuggestion, onTTS, currentAudio }) => (
    <div className={`bg-slate-900/40 border border-l-2 rounded-lg p-3 relative overflow-hidden group transition-colors ${hasResults && analysis.length > 0 ? 'border-slate-700 border-l-amber-500/60' : 'border-slate-800 border-l-amber-500/20 hover:border-slate-700'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex items-start gap-3 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${hasResults && analysis.length > 0 ? 'border border-amber-500/40 bg-amber-500/10' : 'border border-slate-700/50 bg-slate-950/50'}`}>
                <ListTodo className={`w-4 h-4 ${hasResults && analysis.length > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-300">Actionable Suggestions</span>
                    {hasResults && analysis.length > 0 && (
                        <span className="text-xs text-slate-500 shrink-0">{analysis.length} pattern{analysis.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
                {hasResults && analysis.length > 0 ? (
                    <div className="space-y-4 mt-1">
                        {analysis.map((item, index) => (
                            <AnalysisCard key={index} cardIndex={index} item={item} onImplementSuggestion={onImplementSuggestion} onTTS={onTTS} currentAudio={currentAudio} />
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
);

export default SuggestionsCard;
