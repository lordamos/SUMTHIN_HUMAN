import React from 'react';
import { motion } from 'framer-motion';
import type { HistoryItem } from '../types';
import { TrashIcon } from './Icons';

interface HistoryPanelProps {
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
    onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onDelete, onClear, onClose }) => {
    
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (score: number) => {
        if (score > 75) return 'text-red-400';
        if (score > 40) return 'text-amber-400';
        return 'text-teal-400';
    };
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-md h-full bg-gray-800 border-l border-white/10 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-between border-b border-white/10">
                    <h2 className="text-lg font-semibold text-gray-100">Analysis History</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Close history panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {history.length > 0 ? (
                        <ul>
                            {history.map(item => (
                                <li key={item.id} className="border-b border-white/10 group">
                                    <div className="p-4 flex gap-4 items-start hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onSelect(item)}>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-200 line-clamp-2 break-words">
                                                {item.text}
                                            </p>
                                            <div className="text-xs text-gray-400 mt-2 flex items-center gap-4">
                                                <span>{formatDate(item.timestamp)}</span>
                                                <span className={`font-semibold ${getScoreColor(item.result.aiLikelihood)}`}>
                                                    {item.result.aiLikelihood}% AI
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                            className="p-2 rounded-full text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete this entry"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p>No history yet.</p>
                            <p className="text-sm mt-1">Your analysis results will appear here automatically.</p>
                        </div>
                    )}
                </main>

                {history.length > 0 && (
                    <footer className="p-4 border-t border-white/10">
                        <button
                            onClick={onClear}
                            className="w-full py-2 px-4 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <TrashIcon />
                            Clear All History
                        </button>
                    </footer>
                )}
            </motion.div>
        </motion.div>
    );
};

export default HistoryPanel;
