import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BatchItem, BatchItemCardProps, LoadingAction } from './types';
import { filterClasses, filters } from './types';
import ImageInspector from './ImageInspector';
import DetailedAnalysisItem from './DetailedAnalysisItem';
import ColorPaletteView from './ColorPaletteView';
import TagsView from './TagsView';
import Gauge from '../Gauge';
import Spinner from '../Spinner';
import ErrorDisplay from '../ErrorDisplay';
import {
    DownloadIcon, DescribeIcon, ClipboardIcon, CheckIcon,
    FilterIcon, TrashIcon, UndoIcon, MagicWandIcon,
    PaletteIcon, DiskIcon
} from '../Icons';

const BatchItemCard: React.FC<BatchItemCardProps> = ({
    item, onRemove, onRevert, onProcess, onUpdate, onDownload, onEdit,
    onSmartAnalysis, onGeneratePrompt,
    onClassifyStyle, onMakeHuman, onFaceSwap, onOutfitSwap, onDetectFaces
}) => {
    const isLoading = !!item.loadingAction;
    const [isHumanizingDesc, setIsHumanizingDesc] = useState(false);
    const [swapModel, setSwapModel] = useState<'fast' | 'pro' | 'nano'>('fast');
    const [selectedFaceIndices, setSelectedFaceIndices] = useState<number[]>([]);
    const [outfitMode, setOutfitMode] = useState<'texture' | 'ai'>('texture');
    const [aiOutfitPrompt, setAiOutfitPrompt] = useState('');
    const faceSwapInputRef = useRef<HTMLInputElement>(null);
    const outfitSwapInputRef = useRef<HTMLInputElement>(null);
    const faceCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = faceCanvasRef.current;
        const container = imageContainerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { offsetWidth: cw, offsetHeight: ch } = container;
        canvas.width = cw;
        canvas.height = ch;
        ctx.clearRect(0, 0, cw, ch);

        const faces = item.detectedFaces;
        const dims = item.imgOrigDims;
        if (!faces || !dims || faces.length === 0) return;

        const scaleX = cw / dims.w;
        const scaleY = ch / dims.h;

        faces.forEach(f => {
            const [x1, y1, x2, y2] = f.bbox;
            const sx = x1 * scaleX, sy = y1 * scaleY;
            const sw = (x2 - x1) * scaleX, sh = (y2 - y1) * scaleY;
            const isSelected = selectedFaceIndices.includes(f.index);

            ctx.strokeStyle = isSelected ? '#10b981' : '#f59e0b';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.shadowColor = isSelected ? '#10b981' : '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.strokeRect(sx, sy, sw, sh);

            ctx.fillStyle = isSelected ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.15)';
            ctx.fillRect(sx, sy, sw, sh);

            ctx.shadowBlur = 0;
            ctx.fillStyle = isSelected ? '#10b981' : '#f59e0b';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`Face ${f.index + 1}${isSelected ? ' ✓' : ''}`, sx + 4, sy + 14);
        });
    }, [item.detectedFaces, selectedFaceIndices, item.imgOrigDims]);

    useEffect(() => {
        setSelectedFaceIndices([]);
    }, [item.preview]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = faceCanvasRef.current;
        const dims = item.imgOrigDims;
        const faces = item.detectedFaces;
        if (!canvas || !dims || !faces || faces.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (canvas.width / rect.width);
        const py = (e.clientY - rect.top) * (canvas.height / rect.height);

        const scaleX = canvas.width / dims.w;
        const scaleY = canvas.height / dims.h;

        const clicked = faces.find(f => {
            const [x1, y1, x2, y2] = f.bbox;
            return px >= x1 * scaleX && px <= x2 * scaleX && py >= y1 * scaleY && py <= y2 * scaleY;
        });

        if (clicked) {
            setSelectedFaceIndices(prev =>
                prev.includes(clicked.index)
                    ? prev.filter(i => i !== clicked.index)
                    : [...prev, clicked.index]
            );
        }
    };

    const readFileAsBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleFaceSwapFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const b64 = await readFileAsBase64(file);
        onFaceSwap(item.id, b64, selectedFaceIndices, swapModel);
        e.target.value = '';
    };

    const handleOutfitSwapFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const b64 = await readFileAsBase64(file);
        onOutfitSwap(item.id, b64, 'texture', swapModel);
        e.target.value = '';
    };

    const handleCopyDescription = () => {
        if (!item.description) return;
        navigator.clipboard.writeText(item.description).then(() => {
            onUpdate(item.id, { isDescriptionCopied: true });
            setTimeout(() => onUpdate(item.id, { isDescriptionCopied: false }), 2000);
        });
    };

    const handleHumanizeDescription = async () => {
        if (!item.description) return;
        setIsHumanizingDesc(true);
        try {
            const res = await fetch('/humanize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: item.description, mode: 'bypass' }),
            });
            const data = await res.json();
            if (data.humanized_text) onUpdate(item.id, { description: data.humanized_text });
        } catch {}
        finally { setIsHumanizingDesc(false); }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl relative overflow-hidden group"
            style={{
                background: 'linear-gradient(145deg, rgba(12,12,22,0.97), rgba(6,6,14,0.99))',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset'
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: item.precisionMode ? 'linear-gradient(90deg, transparent, rgba(251,146,60,0.8), rgba(239,68,68,0.8), transparent)' : 'linear-gradient(90deg, transparent, rgba(20,184,166,0.4), rgba(139,92,246,0.4), transparent)' }} />
            {item.precisionMode && <div className="absolute -inset-px rounded-3xl pointer-events-none" style={{ background: 'transparent', boxShadow: '0 0 30px -5px rgba(251,146,60,0.15) inset' }} />}
            <div className="p-5 flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <div ref={imageContainerRef} className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-square lg:aspect-auto group/image min-h-[250px] lg:h-auto">
                        {item.detectedFaces && item.detectedFaces.length > 0 && (
                            <canvas
                                ref={faceCanvasRef}
                                onClick={handleCanvasClick}
                                className="absolute inset-0 z-20 cursor-crosshair"
                                style={{ width: '100%', height: '100%' }}
                                title="Click a face to select/deselect it"
                            />
                        )}
                        <AnimatePresence>
                            {(item.loadingAction && item.loadingAction.startsWith('edit')) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                                    <Spinner />
                                    <span className="text-xs text-teal-300 mt-2 font-semibold animate-pulse">
                                        {item.loadingAction === 'edit-bg' ? 'Removing Background...' : item.loadingAction === 'edit-watermark' ? 'Fixing Watermark...' : 'Upscaling Image...'}
                                    </span>
                                </motion.div>
                            )}
                            {item.showSuccess && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-teal-500/5">
                                    <motion.div initial={{ scale: 0.8, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-teal-500/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
                                        <div className="w-5 h-5 flex items-center justify-center text-white bg-white/20 rounded-full"><CheckIcon className="scale-75" /></div>
                                        <span className="text-xs font-black text-white uppercase tracking-[0.15em] drop-shadow-sm">Changes Applied</span>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ImageInspector
                            src={item.preview}
                            alt="Preview"
                            className={`w-full h-full object-contain transition-all duration-300 ${filterClasses[item.selectedFilter]}`}
                        />

                        <AnimatePresence>
                            {item.showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 pointer-events-none rounded-2xl border-4 border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.6)]"
                                    transition={{ duration: 0.4 }}
                                >
                                    <motion.div className="absolute inset-0 bg-teal-400/10" animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 1, repeat: 1 }} />
                                    <motion.div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent" initial={{ x: '-100%', y: '-100%' }} animate={{ x: '100%', y: '100%' }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity z-10">
                            <button onClick={onEdit} className="p-2 rounded-full bg-black/60 text-white hover:bg-purple-500/80 transition-colors backdrop-blur-sm shadow-lg" title="Open Magic Editor">
                                <MagicWandIcon />
                            </button>
                            {item.isEdited && (
                                <button onClick={onRevert} className="p-2 rounded-full bg-black/60 text-white hover:bg-amber-500/80 transition-colors backdrop-blur-sm shadow-lg" title="Revert to Original">
                                    <UndoIcon />
                                </button>
                            )}
                            <button onClick={onRemove} className="p-2 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm shadow-lg" title="Remove image">
                                <TrashIcon />
                            </button>
                        </div>
                        {item.isEdited && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm shadow-lg z-10 pointer-events-none">EDITED</div>
                        )}
                        {item.draft && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-teal-500/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm shadow-lg z-10 animate-pulse flex items-center gap-1">
                                <DiskIcon /> DRAFT SAVED
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <p className="text-xs text-gray-400 truncate flex-1" title={item.file.name}>{item.file.name}</p>
                        <button
                            onClick={() => onUpdate(item.id, { precisionMode: !item.precisionMode })}
                            title="Toggle Precision Mode — uses face/body detection for smarter edits"
                            className={`ml-2 flex-shrink-0 flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full transition-all ${item.precisionMode ? 'bg-orange-500/30 border border-orange-400/50 text-orange-300' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-orange-400 hover:border-orange-500/30'}`}
                        >
                            🎯 {item.precisionMode ? 'PRECISION ON' : 'PRECISION'}
                        </button>
                    </div>

                    {/* Filter selector */}
                    <div className="flex gap-1.5 flex-wrap px-1">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => onUpdate(item.id, { selectedFilter: f.id })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${item.selectedFilter === f.id ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300'}`}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    {/* ── SECTION: Analysis ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(20,184,166,0.04)' }}>
                        <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-teal-500/70">🧠 Analysis</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 p-2">
                            <button onClick={() => onProcess(item.id, 'analyze')} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.result ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-teal-500/15 hover:text-teal-300'}`}>
                                {item.loadingAction === 'analyze' ? <Spinner /> : '🔍 Analyze'}
                            </button>
                            <button onClick={() => onProcess(item.id, 'describe')} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.description ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-amber-500/10 hover:text-amber-300'}`}>
                                {item.loadingAction === 'describe' ? <Spinner /> : '📝 Describe'}
                            </button>
                            <button onClick={() => onProcess(item.id, 'tag')} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.tags ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-purple-500/10 hover:text-purple-300'}`}>
                                {item.loadingAction === 'tag' ? <Spinner /> : '🏷 Tags'}
                            </button>
                            <button onClick={() => onProcess(item.id, 'color')} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.colorResult ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-blue-500/10 hover:text-blue-300'}`}>
                                {item.loadingAction === 'color' ? <Spinner /> : '🎨 Colors'}
                            </button>
                        </div>
                    </div>

                    {/* ── SECTION: AI Intelligence ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(139,92,246,0.04)' }}>
                        <div className="px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-violet-500/70">⚡ AI Intelligence</span>
                        </div>
                        <div className="flex flex-col gap-1.5 p-2">
                            <button onClick={() => onSmartAnalysis(item.id)} disabled={isLoading} className="w-full px-2 py-2 rounded-xl text-xs font-black border border-teal-500/25 transition-all flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(99,102,241,0.1))' }}>
                                {item.loadingAction === 'smart' ? <><Spinner /> Running...</> : '⚡ Smart Analysis (Full Pipeline)'}
                            </button>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button onClick={() => onGeneratePrompt(item.id)} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.promptResult ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-violet-500/10 hover:text-violet-300'}`}>
                                    {item.loadingAction === 'prompt' ? <Spinner /> : '🔮 Gen Prompt'}
                                </button>
                                <button onClick={() => onClassifyStyle(item.id)} disabled={isLoading} className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${item.styleResult ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-sky-500/10 hover:text-sky-300'}`}>
                                    {item.loadingAction === 'style' ? <Spinner /> : '🧬 Style DNA'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION: Transform ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(239,68,68,0.03)' }}>
                        <div className="px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/70">🎨 Transform</span>
                            {item.precisionMode && <span className="ml-2 text-[9px] font-bold text-orange-400/80">🎯 Precision Active</span>}
                        </div>
                        <div className="flex flex-col gap-1.5 p-2">
                            <button onClick={() => onMakeHuman(item.id)} disabled={isLoading} className="w-full px-2 py-2 rounded-xl text-xs font-black border border-rose-500/30 transition-all flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.1))' }}>
                                {item.loadingAction === 'make-human' ? <><Spinner /> {item.precisionMode ? 'Precision Humanizing...' : 'Humanizing...'}</> : `🧠 Make More Human${item.precisionMode ? ' 🎯' : ''}`}
                            </button>
                        </div>
                    </div>

                    {/* ── SECTION: Swap Engine ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(16,185,129,0.04)' }}>
                        <div className="px-3 py-1.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70">🔄 Swap Engine</span>
                            <select
                                value={swapModel}
                                onChange={e => setSwapModel(e.target.value as 'fast' | 'pro' | 'nano')}
                                className="text-[9px] font-bold rounded-md px-1.5 py-0.5 border border-white/10 bg-black/40 text-gray-300 cursor-pointer"
                            >
                                <option value="fast">⚡ Fast</option>
                                <option value="pro">🔥 Pro (Realism+)</option>
                                <option value="nano">🍌 Nano Banana</option>
                            </select>
                        </div>

                        <div className="p-2 flex flex-col gap-2">
                            <button
                                onClick={() => onDetectFaces(item.id)}
                                disabled={isLoading}
                                className="w-full px-2 py-1.5 rounded-xl text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                            >
                                {item.loadingAction === ('detect-faces' as LoadingAction)
                                    ? <><Spinner /> Detecting...</>
                                    : item.detectedFaces
                                        ? `🎯 ${item.detectedFaces.length} face${item.detectedFaces.length !== 1 ? 's' : ''} detected — click to re-scan`
                                        : '🎯 Detect Faces (click-to-select)'}
                            </button>

                            {item.detectedFaces && item.detectedFaces.length > 0 && (
                                <div className="flex flex-wrap gap-1 px-0.5">
                                    {item.detectedFaces.map(f => (
                                        <button
                                            key={f.index}
                                            onClick={() => setSelectedFaceIndices(prev =>
                                                prev.includes(f.index) ? prev.filter(i => i !== f.index) : [...prev, f.index]
                                            )}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${selectedFaceIndices.includes(f.index) ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50' : 'bg-white/[0.04] text-gray-500 border-white/10 hover:text-amber-300 hover:border-amber-500/30'}`}
                                        >
                                            Face {f.index + 1} {selectedFaceIndices.includes(f.index) ? '✓' : ''}
                                        </button>
                                    ))}
                                    {selectedFaceIndices.length > 0 && (
                                        <button onClick={() => setSelectedFaceIndices([])} className="text-[9px] text-red-400/70 hover:text-red-400 px-1">✕ clear</button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => faceSwapInputRef.current?.click()}
                                disabled={isLoading}
                                className="w-full px-2 py-2 rounded-xl text-xs font-black border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
                                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))' }}
                            >
                                {item.loadingAction === 'face-swap' || item.loadingAction === 'face-swap-multi'
                                    ? <><Spinner /> Swapping{swapModel === 'pro' ? ' + Realism Boost' : ''}...</>
                                    : `👤 Face Swap ${selectedFaceIndices.length > 0 ? `(${selectedFaceIndices.length} selected)` : '(all faces)'}`}
                            </button>

                            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                                <div className="flex border-b border-white/[0.06]">
                                    <button onClick={() => setOutfitMode('texture')} className={`flex-1 py-1 text-[9px] font-bold transition-all ${outfitMode === 'texture' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-500 hover:text-cyan-400'}`}>🖼 Texture</button>
                                    <button onClick={() => setOutfitMode('ai')} className={`flex-1 py-1 text-[9px] font-bold transition-all ${outfitMode === 'ai' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-purple-400'}`}>✨ AI Prompt</button>
                                </div>
                                {outfitMode === 'texture' ? (
                                    <button
                                        onClick={() => outfitSwapInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="w-full px-2 py-2 text-xs font-bold text-gray-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-cyan-500/10"
                                    >
                                        {item.loadingAction === 'outfit-swap' ? <><Spinner /> Swapping Outfit...</> : '👕 Select texture image'}
                                    </button>
                                ) : (
                                    <div className="p-2 flex flex-col gap-1.5">
                                        <input
                                            type="text"
                                            placeholder="e.g. hoodie, cyber armor, formal suit..."
                                            value={aiOutfitPrompt}
                                            onChange={e => setAiOutfitPrompt(e.target.value)}
                                            className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/40"
                                        />
                                        <button
                                            onClick={() => aiOutfitPrompt.trim() && onOutfitSwap(item.id, aiOutfitPrompt, 'ai', swapModel)}
                                            disabled={isLoading || !aiOutfitPrompt.trim()}
                                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                                        >
                                            {item.loadingAction === 'outfit-swap' ? <><Spinner /> Applying...</> : '✨ Apply AI Outfit'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input ref={faceSwapInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleFaceSwapFileSelect} />
                            <input ref={outfitSwapInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleOutfitSwapFileSelect} />
                        </div>
                    </div>

                    {/* ── SECTION: Studio ── */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500/80">✏️ Studio</span>
                        </div>
                        <div className="p-2 flex flex-col gap-1.5">
                            <button onClick={onEdit} disabled={isLoading} className={`w-full px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${item.isEdited || item.draft ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-purple-500/10 hover:text-purple-300'}`}>
                                <div className="scale-75"><MagicWandIcon /></div>
                                {item.draft ? '✦ Resume Draft' : '✦ Magic Editor'}
                            </button>
                            <button onClick={() => onDownload(item)} title="Download" className="w-full py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs font-semibold flex items-center justify-center gap-1 text-gray-400 hover:text-white">
                                <DownloadIcon className="scale-75" /> Download
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                    <AnimatePresence mode="wait">
                        {item.error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <ErrorDisplay message={item.error} onDismiss={() => onUpdate(item.id, { error: null })} />
                            </motion.div>
                        )}

                        {item.result && (
                            <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="flex items-center gap-6 p-4 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/5">
                                    <div className="scale-75 -ml-4 -my-4">
                                        <Gauge score={item.result.aiLikelihood} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Analysis Result</h3>
                                        <p className="text-sm text-gray-400">Likelihood of AI generation.</p>
                                    </div>
                                </div>

                                {item.result.categoryScores && item.result.categoryScores.length > 0 && (
                                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Forensic Score Breakdown</p>
                                        {item.result.categoryScores.map((cat, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">{cat.name}</span>
                                                    <span className={`font-bold ${cat.score >= 70 ? 'text-red-400' : cat.score >= 40 ? 'text-amber-400' : 'text-teal-400'}`}>{cat.score}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.score}%` }}
                                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        className={`h-full rounded-full ${cat.score >= 70 ? 'bg-red-500' : cat.score >= 40 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {item.result.analysis.map((analysisItem, idx) => (
                                        <DetailedAnalysisItem key={idx} item={analysisItem} />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {item.description && (
                            <motion.div key="description" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <DescribeIcon /> Description
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleHumanizeDescription} disabled={isHumanizingDesc || isLoading} className="text-xs text-teal-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all">
                                            {isHumanizingDesc ? <><Spinner /> Rewriting...</> : '✦ Humanize'}
                                        </button>
                                        <button onClick={handleCopyDescription} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                            {item.isDescriptionCopied ? <CheckIcon /> : <ClipboardIcon />}
                                            {item.isDescriptionCopied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed">
                                    {item.description}
                                </div>
                            </motion.div>
                        )}

                        {item.tags && (
                            <motion.div key="tags" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <TagsView tags={item.tags} />
                            </motion.div>
                        )}

                        {item.colorResult && (
                            <motion.div key="colors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <ColorPaletteView result={item.colorResult} />
                            </motion.div>
                        )}

                        {item.promptResult && (
                            <motion.div key="promptResult" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-violet-300 flex items-center gap-2">🔮 Reverse-Engineered Prompt</h3>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.promptResult!).then(() => {
                                                onUpdate(item.id, { isPromptCopied: true });
                                                setTimeout(() => onUpdate(item.id, { isPromptCopied: false }), 2000);
                                            });
                                        }}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        {item.isPromptCopied ? <CheckIcon /> : <ClipboardIcon />}
                                        {item.isPromptCopied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-gray-200 leading-relaxed italic">
                                    {item.promptResult}
                                </div>
                            </motion.div>
                        )}

                        {item.styleResult && (
                            <motion.div key="styleResult" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-3">
                                <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Style DNA</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-white">{item.styleResult.style}</span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded-lg ${item.styleResult.confidence >= 70 ? 'bg-teal-500/20 text-teal-300' : item.styleResult.confidence >= 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-gray-400'}`}>{item.styleResult.confidence}% confident</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">{item.styleResult.reasoning}</p>
                                {item.styleResult.alternates && item.styleResult.alternates.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-xs text-gray-500">Also could be:</span>
                                        {item.styleResult.alternates.map((alt, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">{alt}</span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {!item.result && !item.description && !item.tags && !item.colorResult && !item.error && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 py-12">
                                {item.isEdited ? (
                                    <div className="text-center">
                                        <MagicWandIcon />
                                        <p className="text-sm mt-2">Image Edited Successfully.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                            <span className="text-2xl">?</span>
                                        </div>
                                        <p className="text-sm">Select an action to process this image.</p>
                                    </>
                                )}
                            </div>
                        )}

                        {isLoading && !item.loadingAction?.startsWith('edit') && (
                            <div className="h-full flex items-center justify-center py-12">
                                <Spinner />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default BatchItemCard;
