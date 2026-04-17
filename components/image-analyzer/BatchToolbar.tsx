import React from 'react';
import { motion } from 'framer-motion';
import Spinner from '../Spinner';
import { DescribeIcon, BackgroundIcon, WatermarkIcon, UpscaleIcon } from '../Icons';
import type { BatchItem } from './types';

interface Props {
    items: BatchItem[];
    onSmartAnalysisAll: () => void;
    onBatchProcess: (action: 'analyze' | 'describe' | 'tag' | 'color') => void;
    onBatchEdit: (editType: 'bg' | 'watermark' | 'upscale') => void;
    onClearAll: () => void;
}

const BatchToolbar: React.FC<Props> = ({ items, onSmartAnalysisAll, onBatchProcess, onBatchEdit, onClearAll }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-sm font-semibold text-gray-300 ml-2">{items.length} Image{items.length !== 1 ? 's' : ''} Selected</span>
            <button onClick={onClearAll} className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                Clear List
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
                <span className="w-full text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1 mb-1">Analysis Tools</span>
                <button onClick={onSmartAnalysisAll} disabled={items.some(i => !!i.loadingAction)} className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-teal-500/30 to-blue-500/20 text-teal-200 border border-teal-500/40 hover:from-teal-500/40 hover:to-blue-500/30 hover:scale-[1.01] transition-all text-xs font-black flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'smart') ? <><Spinner /> Running Smart Pipeline...</> : '⚡ Run Smart Analysis (All)'}
                </button>
                <button onClick={() => onBatchProcess('analyze')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 hover:scale-[1.02] transition-all text-xs font-bold flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'analyze') ? <Spinner /> : 'Analyze All Images'}
                </button>
                <button onClick={() => onBatchProcess('describe')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 hover:scale-[1.02] transition-all text-xs font-semibold flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'describe') ? <Spinner /> : <><DescribeIcon /> Describe All Images</>}
                </button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-900/10 to-black/30 border border-purple-500/20 relative overflow-hidden">
                <span className="w-full text-[10px] uppercase tracking-wider text-purple-300 font-bold px-1 mb-1">AI Smart Editing</span>
                <button onClick={() => onBatchEdit('bg')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'edit-bg') ? <Spinner /> : <><BackgroundIcon /> Batch Remove BG</>}
                </button>
                <button onClick={() => onBatchEdit('watermark')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'edit-watermark') ? <Spinner /> : <><WatermarkIcon /> AI Watermark Remover (Auto)</>}
                </button>
                <button onClick={() => onBatchEdit('upscale')} disabled={items.some(i => !!i.loadingAction)} className="w-full px-3 py-2.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 hover:scale-[1.01] transition-all text-xs font-bold flex items-center justify-center gap-2">
                    {items.some(i => i.loadingAction === 'edit-upscale') ? <Spinner /> : <><UpscaleIcon /> Batch AI Upscale &amp; Enhance</>}
                </button>
            </div>
        </div>
    </motion.div>
);

export default BatchToolbar;
