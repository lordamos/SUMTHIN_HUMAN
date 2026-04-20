import React, { useState } from 'react';
import type { ImageAnalysisItem } from '../../types';
import { md } from '../../utils/md';

interface Props {
    item: ImageAnalysisItem;
}

const DetailedAnalysisItem: React.FC<Props> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
                <span className="text-sm font-medium text-gray-300 flex-1 pr-4">{item.originalText}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.confidenceScore > 70 ? 'bg-red-500/20 text-red-300' : item.confidenceScore > 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'}`}>
                    {item.confidenceScore}%
                </span>
                <span className="ml-2 text-gray-500">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 bg-white/[0.02]">
                    <div className="text-sm text-gray-400 pt-3 leading-relaxed" dangerouslySetInnerHTML={md(item.reason)} />
                    {item.suggestions?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-teal-400 mb-2">Suggestions</p>
                            <ul className="space-y-1">
                                {item.suggestions.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                                        <span className="text-teal-500 font-bold flex-shrink-0">{i + 1}.</span>
                                        <span dangerouslySetInnerHTML={md(s)} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DetailedAnalysisItem;
