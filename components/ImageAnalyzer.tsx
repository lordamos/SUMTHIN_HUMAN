
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImage, describeImage, generateImageTags, editImage, getDominantColors, generateImagePrompt, classifyImageStyle } from '../services/geminiService';
import type { ImageAnalysisResult, ImageAnalysisItem, ImageTagsResult, ImageDraftState, DominantColorsResult, CloudFile, CloudProvider, ImageStyleResult, CategoryScore } from '../types';
import Gauge from './Gauge';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import ImageEditor from './ImageEditor';
import CloudPicker from './CloudPicker';
import { 
    UploadIcon, DownloadIcon, DescribeIcon, ClipboardIcon, CheckIcon, 
    FilterIcon, TagsIcon, TrashIcon, ClearIcon, EditIcon, BackgroundIcon, 
    WatermarkIcon, UndoIcon, MagicWandIcon, ZoomInIcon, ZoomOutIcon, UndoIcon as ResetIcon,
    UpscaleIcon, SaveIcon, DiskIcon, PaletteIcon, CloudIcon, GoogleDriveIcon, DropboxIcon
} from './Icons';

type LoadingAction = 'analyze' | 'describe' | 'tag' | 'color' | 'smart' | 'edit-bg' | 'edit-watermark' | 'edit-upscale' | 'cloud' | 'prompt' | 'style' | 'make-human' | null;

interface BatchItem {
    id: string;
    file: File | { name: string; type: string }; 
    preview: string;
    originalPreview: string; 
    loadingAction: LoadingAction;
    result: ImageAnalysisResult | null;
    description: string | null;
    tags: ImageTagsResult | null;
    colorResult: DominantColorsResult | null;
    promptResult: string | null;
    styleResult: ImageStyleResult | null;
    isPromptCopied: boolean;
    error: string | null;
    selectedFilter: string;
    isDescriptionCopied: boolean;
    isTagsCopied: boolean;
    isEdited: boolean;
    showSuccess: boolean; 
    draft: ImageDraftState | null;
    precisionMode: boolean;
}

const filters = [
  { id: 'none', name: 'None' },
  { id: 'grayscale', name: 'Grayscale' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'invert', name: 'Invert' },
];

const filterClasses: { [key: string]: string } = {
    grayscale: 'grayscale',
    sepia: 'sepia',
    invert: 'invert',
    none: '',
};

const ImageInspector: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [src]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || isHovered) {
                e.preventDefault();
                const delta = -Math.sign(e.deltaY) * 0.2;
                setScale(s => Math.min(Math.max(1, s + delta), 8));
            }
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [isHovered]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-black/40 cursor-default"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsDragging(false); }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
            <img 
                src={src} 
                alt={alt} 
                className={className} 
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center center',
                    willChange: 'transform'
                }}
                draggable={false}
            />
            
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 transition-opacity duration-200 ${isHovered || scale > 1 ? 'opacity-100' : 'opacity-0'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(1, s - 0.5)); }}
                    className="p-1 hover:text-teal-400 text-gray-300 transition-colors"
                >
                    <ZoomOutIcon />
                </button>
                <span className="text-[10px] font-mono w-8 text-center text-gray-300">{Math.round(scale * 100)}%</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(8, s + 0.5)); }}
                    className="p-1 hover:text-teal-400 text-gray-300 transition-colors"
                >
                    <ZoomInIcon />
                </button>
                {scale > 1 && (
                    <>
                        <div className="w-px h-3 bg-white/20 mx-1"></div>
                        <button 
                            onClick={handleReset}
                            className="p-1 hover:text-amber-400 text-gray-300 transition-colors"
                            title="Reset Zoom"
                        >
                            <ResetIcon />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailedAnalysisItem: React.FC<{ item: ImageAnalysisItem }> = ({ item }) => (
    <details className="bg-black/20 rounded-xl border border-white/10 group transition-all duration-300 ease-in-out hover:border-teal-500/30" open>
        <summary className="p-3 list-none flex justify-between items-center cursor-pointer text-sm font-semibold text-gray-200">
            <span>{item.feature}</span>
            <span className="transform transition-transform duration-300 group-open:rotate-90 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </span>
        </summary>
        <div className="px-3 pb-3">
            <div className="space-y-2 border-t border-white/10 pt-2">
                <div>
                    <h5 className="font-semibold text-teal-400 text-xs">Reasoning:</h5>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.reason}</p>
                </div>
                <div>
                    <h5 className="font-semibold text-gray-300 text-xs">Recommendation:</h5>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.recommendation}</p>
                </div>
            </div>
        </div>
    </details>
);

const ColorPaletteView: React.FC<{ result: DominantColorsResult }> = ({ result }) => {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <PaletteIcon className="text-blue-400" /> Dominant Colors
            </h3>
            <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                {result.colors.map((color, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div 
                            className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg transition-transform group-hover:scale-110 cursor-pointer" 
                            style={{ backgroundColor: color.hex }}
                            title={`${color.name} (${color.percentage}%)`}
                            onClick={() => {
                                navigator.clipboard.writeText(color.hex);
                                alert(`Copied ${color.hex} to clipboard!`);
                            }}
                        />
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{color.hex}</p>
                            <p className="text-[9px] text-gray-500 font-mono">{color.percentage}%</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const TagsView: React.FC<{ tags: ImageTagsResult }> = ({ tags }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const allTags = Object.values(tags).flat().join(', ');
        navigator.clipboard.writeText(allTags).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const categoryTitles: { [key: string]: string } = {
        subjects: 'Subjects',
        objects: 'Objects',
        setting: 'Setting',
        style: 'Style',
        colors: 'Colors',
        composition: 'Composition'
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TagsIcon /> Generated Tags
                </h3>
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                    {isCopied ? 'Copied' : 'Copy All'}
                </button>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                {Object.entries(tags).map(([category, tagList]) => (
                    tagList && (tagList as string[]).length > 0 && (
                        <div key={category}>
                            <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">{categoryTitles[category] || category}</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {(tagList as string[]).map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-black/30 text-gray-300 text-xs rounded-md border border-white/5">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

interface BatchItemCardProps {
    item: BatchItem;
    onRemove: () => void;
    onRevert: () => void;
    onProcess: (id: string, action: 'analyze' | 'describe' | 'tag' | 'color') => void;
    onUpdate: (id: string, updates: Partial<BatchItem>) => void;
    onDownload: (item: BatchItem) => void;
    onEdit: () => void;
    isExporting: string | null;
    onSaveToCloud: (id: string, provider: CloudProvider) => void;
    onSmartAnalysis: (id: string) => void;
    onGeneratePrompt: (id: string) => void;
    onClassifyStyle: (id: string) => void;
    onMakeHuman: (id: string) => void;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item, onRemove, onRevert, onProcess, onUpdate, onDownload, onEdit, isExporting, onSaveToCloud, onSmartAnalysis, onGeneratePrompt, onClassifyStyle, onMakeHuman }) => {
    const isLoading = !!item.loadingAction;
    const [isHumanizingDesc, setIsHumanizingDesc] = useState(false);

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
            if (data.humanized_text) {
                onUpdate(item.id, { description: data.humanized_text });
            }
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
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: item.precisionMode ? 'linear-gradient(90deg, transparent, rgba(251,146,60,0.8), rgba(239,68,68,0.8), transparent)' : 'linear-gradient(90deg, transparent, rgba(20,184,166,0.4), rgba(139,92,246,0.4), transparent)' }} />
            {/* Precision mode glow */}
            {item.precisionMode && <div className="absolute -inset-px rounded-3xl pointer-events-none" style={{ background: 'transparent', boxShadow: '0 0 30px -5px rgba(251,146,60,0.15) inset' }} />}
            <div className="p-5 flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-square lg:aspect-auto group/image min-h-[250px] lg:h-auto">
                        <AnimatePresence>
                            {(item.loadingAction && item.loadingAction.startsWith('edit')) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none"
                                >
                                    <Spinner />
                                    <span className="text-xs text-teal-300 mt-2 font-semibold animate-pulse">
                                        {item.loadingAction === 'edit-bg' ? 'Removing Background...' : 
                                        item.loadingAction === 'edit-watermark' ? 'Fixing Watermark...' : 
                                        'Upscaling Image...'}
                                    </span>
                                </motion.div>
                            )}
                            
                            {item.showSuccess && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-teal-500/5"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        className="bg-teal-500/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-3"
                                    >
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
                                    <motion.div 
                                        className="absolute inset-0 bg-teal-400/10"
                                        animate={{ opacity: [0, 0.3, 0] }}
                                        transition={{ duration: 1, repeat: 1 }}
                                    />
                                    <motion.div 
                                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                                        initial={{ x: '-100%', y: '-100%' }}
                                        animate={{ x: '100%', y: '100%' }}
                                        transition={{ duration: 1.2, ease: "easeInOut" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity z-10">
                            <button 
                                onClick={onEdit}
                                className="p-2 rounded-full bg-black/60 text-white hover:bg-purple-500/80 transition-colors backdrop-blur-sm shadow-lg"
                                title="Open Magic Editor"
                            >
                                <MagicWandIcon />
                            </button>
                             {item.isEdited && (
                                <button 
                                    onClick={onRevert}
                                    className="p-2 rounded-full bg-black/60 text-white hover:bg-amber-500/80 transition-colors backdrop-blur-sm shadow-lg"
                                    title="Revert to Original"
                                >
                                    <UndoIcon />
                                </button>
                            )}
                            <button 
                                onClick={onRemove}
                                className="p-2 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors backdrop-blur-sm shadow-lg"
                                title="Remove image"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                        {item.isEdited && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm shadow-lg z-10 pointer-events-none">
                                EDITED
                            </div>
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
                            <div className="flex gap-1.5">
                                <button onClick={() => onDownload(item)} title="Download" className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs font-semibold flex items-center justify-center gap-1 text-gray-400 hover:text-white">
                                    <DownloadIcon className="scale-75" /> Save
                                </button>
                                <button onClick={() => onSaveToCloud(item.id, 'google-drive')} title="Google Drive" disabled={!!isExporting} className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs flex items-center justify-center">
                                    {isExporting === `${item.id}-google-drive` ? <Spinner /> : <GoogleDriveIcon className="scale-50" />}
                                </button>
                                <button onClick={() => onSaveToCloud(item.id, 'dropbox')} title="Dropbox" disabled={!!isExporting} className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs flex items-center justify-center text-blue-400">
                                    {isExporting === `${item.id}-dropbox` ? <Spinner /> : <DropboxIcon className="scale-50" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                    <AnimatePresence mode="wait">
                        {item.error && (
                             <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <ErrorDisplay message={item.error} onDismiss={() => onUpdate(item.id, { error: null })} />
                             </motion.div>
                        )}

                        {item.result && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
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
                            <motion.div
                                key="description"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <DescribeIcon /> Description
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleHumanizeDescription}
                                            disabled={isHumanizingDesc || isLoading}
                                            className="text-xs text-teal-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
                                        >
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
                            <motion.div
                                key="tags"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <TagsView tags={item.tags} />
                            </motion.div>
                        )}

                        {item.colorResult && (
                            <motion.div
                                key="colors"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ColorPaletteView result={item.colorResult} />
                            </motion.div>
                        )}

                        {item.promptResult && (
                            <motion.div
                                key="promptResult"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3"
                            >
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
                            <motion.div
                                key="styleResult"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-3"
                            >
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

const ImageAnalyzer: React.FC = () => {
    const [items, setItems] = useState<BatchItem[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);

    const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    // Draft persistence synchronization
    useEffect(() => {
        const savedDrafts = localStorage.getItem('imageDrafts');
        if (savedDrafts) {
            try {
                const draftsMap = JSON.parse(savedDrafts);
                setItems(prev => prev.map(item => ({
                    ...item,
                    draft: draftsMap[item.id] || null
                })));
            } catch (e) {
                console.error("Failed to parse drafts", e);
            }
        }
    }, []);

    const saveDraftsToStorage = useCallback((updatedItems: BatchItem[]) => {
        const draftsMap: Record<string, ImageDraftState> = {};
        // Keep storage clean: only save drafts that are recent (max 10 drafts to avoid localstorage limits)
        const sortedWithDrafts = [...updatedItems]
            .filter(i => i.draft)
            .sort((a, b) => (b.draft?.timestamp || 0) - (a.draft?.timestamp || 0))
            .slice(0, 10);

        sortedWithDrafts.forEach(item => {
            if (item.draft) draftsMap[item.id] = item.draft;
        });

        try {
            localStorage.setItem('imageDrafts', JSON.stringify(draftsMap));
        } catch (e) {
            console.error("LocalStorage error:", e);
            setGlobalError("Storage limit reached. Older drafts were discarded.");
        }
    }, []);

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            const newItems: BatchItem[] = [];
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    setGlobalError('Some files were skipped because they are not valid images.');
                    return;
                }
                const previewUrl = URL.createObjectURL(file);
                newItems.push({
                    id: generateId(),
                    file,
                    preview: previewUrl,
                    originalPreview: previewUrl,
                    loadingAction: null,
                    result: null,
                    description: null,
                    tags: null,
                    colorResult: null,
                    promptResult: null,
                    styleResult: null,
                    isPromptCopied: false,
                    error: null,
                    selectedFilter: 'none',
                    isDescriptionCopied: false,
                    isTagsCopied: false,
                    isEdited: false,
                    showSuccess: false,
                    draft: null,
                    precisionMode: false,
                } as BatchItem);
            });
            setItems(prev => [...prev, ...newItems]);
            setGlobalError(null);
            setTimeout(() => {
                newItems.forEach(item => processItem(item.id, 'analyze'));
            }, 200);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const removeItem = (id: string) => {
        setItems(prev => {
            const itemToRemove = prev.find(item => item.id === id);
            if (itemToRemove) {
                if (itemToRemove.preview.startsWith('blob:')) URL.revokeObjectURL(itemToRemove.preview);
                if (itemToRemove.originalPreview.startsWith('blob:')) URL.revokeObjectURL(itemToRemove.originalPreview);
            }
            const updated = prev.filter(item => item.id !== id);
            saveDraftsToStorage(updated);
            return updated;
        });
    };

    const revertItem = (id: string) => {
        setItems(prev => {
            const updated = prev.map(item => 
                item.id === id ? { ...item, preview: item.originalPreview, isEdited: false, draft: null } : item
            );
            saveDraftsToStorage(updated);
            return updated;
        });
    };

    const clearAll = () => {
        items.forEach(item => {
            if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
            if (item.originalPreview.startsWith('blob:')) URL.revokeObjectURL(item.originalPreview);
        });
        setItems([]);
        localStorage.removeItem('imageDrafts');
        setGlobalError(null);
    };

    const fileToBase64 = (file: File | Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                if (result) {
                    resolve(result.split(',')[1]);
                } else {
                    reject(new Error("File reader produced no result."));
                }
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
                reject(new Error("Could not read the image file."));
            };
            reader.readAsDataURL(file);
        });
    };
    
    const getBase64FromItem = async (item: BatchItem): Promise<string> => {
        try {
            if (item.preview.startsWith('data:')) {
                return item.preview.split(',')[1];
            }
            
            if (item.preview === item.originalPreview && item.file instanceof File) {
                return await fileToBase64(item.file);
            }
            
            const response = await fetch(item.preview);
            if (!response.ok) throw new Error("Failed to fetch image blob.");
            const blob = await response.blob();
            return await fileToBase64(blob);
        } catch (err) {
            console.error("Error getting base64:", err);
            throw new Error("Could not access image data.");
        }
    };

    const processItem = async (id: string, action: 'analyze' | 'describe' | 'tag' | 'color') => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, loadingAction: action, error: null } : item
        ));

        try {
            const item = items.find(i => i.id === id);
            if (!item) return;

            const base64Image = await getBase64FromItem(item);
            const mimeType = item.file.type;

            let updates: Partial<BatchItem> = { loadingAction: null };

            if (action === 'analyze') {
                const result = await analyzeImage(base64Image, mimeType);
                updates.result = result;
            } else if (action === 'describe') {
                const desc = await describeImage(base64Image, mimeType);
                updates.description = desc;
                updates.result = null; 
                updates.tags = null;
                updates.colorResult = null;
            } else if (action === 'tag') {
                const tags = await generateImageTags(base64Image, mimeType);
                updates.tags = tags;
                updates.result = null;
                updates.description = null;
                updates.colorResult = null;
            } else if (action === 'color') {
                const colors = await getDominantColors(base64Image, mimeType);
                updates.colorResult = colors;
                updates.result = null;
                updates.description = null;
                updates.tags = null;
            }

            setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setItems(prev => prev.map(i => 
                i.id === id ? { ...i, loadingAction: null, error: errorMessage } : i
            ));
        }
    };

    const processBatch = async (action: 'analyze' | 'describe' | 'tag' | 'color') => {
        const promises = items.map(item => processItem(item.id, action));
        await Promise.all(promises);
    };

    const processSmartAnalysis = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'smart', error: null } : i));

        try {
            const base64Image = await getBase64FromItem(item);
            const mimeType = item.file.type;

            const [result, description, tags, colorResult] = await Promise.all([
                analyzeImage(base64Image, mimeType),
                describeImage(base64Image, mimeType),
                generateImageTags(base64Image, mimeType),
                getDominantColors(base64Image, mimeType),
            ]);

            let humanizedDescription = description;
            try {
                const res = await fetch('/humanize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: description, mode: 'bypass' }),
                });
                const data = await res.json();
                if (data.humanized_text && !data.fallback) humanizedDescription = data.humanized_text;
            } catch {}

            setItems(prev => prev.map(i => i.id === id ? {
                ...i,
                loadingAction: null,
                result,
                description: humanizedDescription,
                tags,
                colorResult,
            } : i));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Smart analysis failed.';
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: msg } : i));
        }
    };

    const handleGeneratePrompt = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'prompt', error: null } : i));
        try {
            const base64Image = await getBase64FromItem(item);
            const result = await generateImagePrompt(base64Image, item.file.type);
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, promptResult: result } : i));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to generate prompt.';
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: msg } : i));
        }
    };

    const handleClassifyStyle = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'style', error: null } : i));
        try {
            const base64Image = await getBase64FromItem(item);
            const result = await classifyImageStyle(base64Image, item.file.type);
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, styleResult: result } : i));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to classify style.';
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: msg } : i));
        }
    };

    const handleMakeHuman = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'make-human', error: null } : i));
        try {
            const base64Image = await getBase64FromItem(item);
            let editPrompt = "Make this image look more natural and less AI-generated. Add subtle imperfections, organic texture variation, realistic noise and grain, natural lighting irregularities, and slight asymmetry that real cameras and real scenes would produce. The result should pass as a real photograph.";

            if (item.precisionMode) {
                try {
                    const res = await fetch('/precision-edit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64Image, prompt: editPrompt, edit_type: 'general' }),
                    });
                    const data = await res.json();
                    if (data.enhanced_prompt) editPrompt = data.enhanced_prompt;
                } catch {}
            }

            const edited = await editImage(base64Image, item.file.type, editPrompt);
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, preview: `data:${item.file.type};base64,${edited}`, isEdited: true } : i));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to humanize image.';
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: msg } : i));
        }
    };

    const processBatchEdit = async (editType: 'bg' | 'watermark' | 'upscale') => {
        let prompt = "";
        let actionType: LoadingAction = null;

        if (editType === 'bg') {
            prompt = "Completely remove the background, isolating the main subject on a plain white background. Ensure clean edges around hair and fine details.";
            actionType = 'edit-bg';
        } else if (editType === 'watermark') {
            prompt = "Remove all watermarks, logos, and text overlays from the image. Reconstruct the underlying image details seamlessly to make it look original.";
            actionType = 'edit-watermark';
        } else if (editType === 'upscale') {
            prompt = "Upscale this image to high resolution. Sharpen all details, remove artifacts, and enhance clarity while preserving all original features perfectly.";
            actionType = 'edit-upscale';
        }

        setItems(prev => prev.map(item => ({ ...item, loadingAction: actionType, error: null })));

        await Promise.all(items.map(async (item) => {
            try {
                const base64Image = await getBase64FromItem(item);
                const editedBase64 = await editImage(base64Image, item.file.type, prompt);
                
                setItems(prev => {
                    const updated = prev.map(i => i.id === item.id ? { 
                        ...i, 
                        loadingAction: null, 
                        preview: `data:${item.file.type};base64,${editedBase64}`,
                        isEdited: true,
                        showSuccess: true,
                        draft: null 
                    } : i);
                    saveDraftsToStorage(updated);
                    return updated;
                });

                setTimeout(() => {
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, showSuccess: false } : i));
                }, 2500);
            } catch (err) {
                 setItems(prev => prev.map(i => i.id === item.id ? { 
                    ...i, 
                    loadingAction: null, 
                    error: `Failed to ${editType}.`
                } : i));
            }
        }));
    };
    
    const updateItemState = (id: string, updates: Partial<BatchItem>) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleDownload = (item: BatchItem) => {
        const link = document.createElement('a');
        if (item.selectedFilter !== 'none' && !item.preview.startsWith('data:')) {
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             if (!ctx) return;
     
             const img = new Image();
             img.crossOrigin = 'anonymous';
             img.src = item.preview;
     
             img.onload = () => {
                 canvas.width = img.width;
                 canvas.height = img.height;
                 const cssFilterMap: { [key: string]: string } = {
                     grayscale: 'grayscale(100%)',
                     sepia: 'sepia(100%)',
                     invert: 'invert(100%)',
                     none: 'none',
                 };
                 ctx.filter = cssFilterMap[item.selectedFilter];
                 ctx.drawImage(img, 0, 0);
                 link.href = canvas.toDataURL(item.file.type);
                 link.download = `processed-${item.file.name}`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
             };
        } else {
            link.href = item.preview;
            link.download = `processed-${item.file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleEditorSave = (newImageBase64: string) => {
        if (editingItemId) {
            const targetId = editingItemId;
            setItems(prev => {
                const updated = prev.map(item => 
                    item.id === targetId 
                    ? { 
                        ...item, 
                        preview: `data:${item.file.type};base64,${newImageBase64}`,
                        isEdited: true,
                        showSuccess: true,
                        draft: null 
                      }
                    : item
                );
                saveDraftsToStorage(updated);
                return updated;
            });
            setTimeout(() => {
                setItems(prev => prev.map(i => i.id === targetId ? { ...i, showSuccess: false } : i));
            }, 3000);
            setEditingItemId(null);
        }
    };

    const handleEditorSaveDraft = (draft: ImageDraftState) => {
        if (editingItemId) {
            setItems(prev => {
                const updated = prev.map(item => 
                    item.id === editingItemId ? { ...item, draft } : item
                );
                saveDraftsToStorage(updated);
                return updated;
            });
        }
    };

    const handleCloudFileSelect = async (file: CloudFile, provider: CloudProvider) => {
        setIsCloudPickerOpen(false);
        const newItemId = generateId();
        const mockPreview = 'https://images.unsplash.com/photo-1620712943543-bcc4628c9759?q=80&w=400&auto=format&fit=crop';
        const newItem: BatchItem = {
            id: newItemId,
            file: { name: file.name, type: file.type },
            preview: mockPreview,
            originalPreview: mockPreview,
            loadingAction: null,
            result: null,
            description: null,
            tags: null,
            colorResult: null,
            promptResult: null,
            styleResult: null,
            isPromptCopied: false,
            error: null,
            selectedFilter: 'none',
            isDescriptionCopied: false,
            isTagsCopied: false,
            isEdited: false,
            showSuccess: false,
            draft: null
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleSaveToCloud = async (id: string, provider: CloudProvider) => {
        setIsExporting(`${id}-${provider}`);
        setTimeout(() => {
            setIsExporting(null);
            alert(`Image successfully saved to your ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'} account!`);
        }, 2000);
    };

    const editingItem = items.find(i => i.id === editingItemId);
    const [editorBase64, setEditorBase64] = useState<string | null>(null);
    
    useEffect(() => {
        if (editingItem) {
             getBase64FromItem(editingItem).then(setEditorBase64).catch(err => {
                 setGlobalError(err.message);
                 setEditingItemId(null);
             });
        } else {
            setEditorBase64(null);
        }
    }, [editingItem]);

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {editingItemId && editingItem && editorBase64 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-50">
                        <ImageEditor 
                            imageBase64={editorBase64} 
                            mimeType={editingItem.file.type}
                            initialDraft={editingItem.draft}
                            onClose={() => setEditingItemId(null)}
                            onSave={handleEditorSave}
                            onSaveDraft={handleEditorSaveDraft}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCloudPickerOpen && (
                    <CloudPicker 
                        onClose={() => setIsCloudPickerOpen(false)}
                        onSelect={handleCloudFileSelect}
                        allowedMimeTypes={['image/*']}
                    />
                )}
            </AnimatePresence>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                    className={`flex-1 p-8 rounded-2xl bg-black/20 border-2 border-dashed text-center transition-all cursor-pointer hover:border-teal-400/80 hover:bg-black/30 ${
                        isDragActive ? 'border-teal-400/80 bg-black/30' : 'border-white/10'
                    }`}
                >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileSelect(e.target.files)} multiple />
                    <div className="flex flex-col items-center text-gray-400">
                        <UploadIcon />
                        <p className="mt-2 text-sm font-medium text-gray-300">
                            {isDragActive ? 'Drop images here...' : 'Drag & drop or local upload'}
                        </p>
                    </div>
                </div>

                <div 
                    onClick={() => setIsCloudPickerOpen(true)}
                    className="sm:w-48 p-8 rounded-2xl bg-black/20 border-2 border-dashed border-white/10 text-center transition-all cursor-pointer hover:border-blue-400/80 hover:bg-black/30 flex flex-col items-center justify-center text-gray-400"
                >
                    <CloudIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium text-gray-300">Cloud Import</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Drive / Dropbox</p>
                </div>
            </div>

            <AnimatePresence>
                {globalError && <ErrorDisplay message={globalError} onDismiss={() => setGlobalError(null)} />}
            </AnimatePresence>

            {items.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                         <div className="flex gap-2 items-center">
                             <span className="text-sm font-semibold text-gray-300 ml-2">{items.length} Image{items.length !== 1 ? 's' : ''} Selected</span>
                         </div>
                         <button onClick={clearAll} className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                            <TrashIcon /> Clear List
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
                            <span className="w-full text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1 mb-1">Analysis Tools</span>
                             <button onClick={() => items.forEach(i => processSmartAnalysis(i.id))} disabled={items.some(i => !!i.loadingAction)} className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-teal-500/30 to-blue-500/20 text-teal-200 border border-teal-500/40 hover:from-teal-500/40 hover:to-blue-500/30 hover:scale-[1.01] transition-all text-xs font-black flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'smart') ? <><Spinner /> Running Smart Pipeline...</> : '⚡ Run Smart Analysis (All)'}
                            </button>
                             <button onClick={() => processBatch('analyze')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 hover:scale-[1.02] transition-all text-xs font-bold flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'analyze') ? <Spinner /> : 'Analyze All Images'}
                            </button>
                            <button onClick={() => processBatch('describe')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 hover:scale-[1.02] transition-all text-xs font-semibold flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'describe') ? <Spinner /> : <><DescribeIcon /> Describe All Images</>}
                            </button>
                         </div>
                         <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-900/10 to-black/30 border border-purple-500/20 relative overflow-hidden">
                            <span className="w-full text-[10px] uppercase tracking-wider text-purple-300 font-bold px-1 mb-1">AI Smart Editing</span>
                             <button onClick={() => processBatchEdit('bg')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'edit-bg') ? <Spinner /> : <><BackgroundIcon /> Batch Remove BG</>}
                            </button>
                             <button onClick={() => processBatchEdit('watermark')} disabled={items.some(i => !!i.loadingAction)} className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'edit-watermark') ? <Spinner /> : <><WatermarkIcon /> AI Watermark Remover (Auto)</>}
                            </button>
                            <button onClick={() => processBatchEdit('upscale')} disabled={items.some(i => !!i.loadingAction)} className="w-full px-3 py-2.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 hover:scale-[1.01] transition-all text-xs font-bold flex items-center justify-center gap-2">
                                {items.some(i => i.loadingAction === 'edit-upscale') ? <Spinner /> : <><UpscaleIcon /> Batch AI Upscale & Enhance</>}
                            </button>
                         </div>
                    </div>
                </motion.div>
            )}

            <div className="space-y-8">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <BatchItemCard 
                            key={item.id} 
                            item={item} 
                            onRemove={() => removeItem(item.id)}
                            onRevert={() => revertItem(item.id)}
                            onProcess={processItem}
                            onUpdate={updateItemState}
                            onDownload={handleDownload}
                            onEdit={() => setEditingItemId(item.id)}
                            isExporting={isExporting}
                            onSaveToCloud={handleSaveToCloud}
                            onSmartAnalysis={processSmartAnalysis}
                            onGeneratePrompt={handleGeneratePrompt}
                            onClassifyStyle={handleClassifyStyle}
                            onMakeHuman={handleMakeHuman}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ImageAnalyzer;
