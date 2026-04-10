
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImage, describeImage, generateImageTags, editImage, getDominantColors } from '../services/geminiService';
import type { ImageAnalysisResult, ImageAnalysisItem, ImageTagsResult, ImageDraftState, DominantColorsResult, CloudFile, CloudProvider } from '../types';
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

type LoadingAction = 'analyze' | 'describe' | 'tag' | 'color' | 'smart' | 'edit-bg' | 'edit-watermark' | 'edit-upscale' | 'cloud' | null;

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
    error: string | null;
    selectedFilter: string;
    isDescriptionCopied: boolean;
    isTagsCopied: boolean;
    isEdited: boolean;
    showSuccess: boolean; 
    draft: ImageDraftState | null;
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
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item, onRemove, onRevert, onProcess, onUpdate, onDownload, onEdit, isExporting, onSaveToCloud, onSmartAnalysis }) => {
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
            className="p-6 rounded-3xl bg-black/20 border border-white/10 relative overflow-hidden group"
        >
            <div className="flex flex-col lg:flex-row gap-6 items-start">
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

                    <div className="text-xs text-gray-400 truncate w-full px-1" title={item.file.name}>
                        {item.file.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onProcess(item.id, 'analyze')}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                item.result 
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {item.loadingAction === 'analyze' ? <Spinner /> : 'Analyze'}
                        </button>
                        <button
                            onClick={() => onProcess(item.id, 'describe')}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                item.description
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                            }`}
                        >
                             {item.loadingAction === 'describe' ? <Spinner /> : 'Describe'}
                        </button>
                        <button
                            onClick={() => onProcess(item.id, 'tag')}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                item.tags
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                            }`}
                        >
                             {item.loadingAction === 'tag' ? <Spinner /> : 'Tags'}
                        </button>
                        <button
                            onClick={() => onProcess(item.id, 'color')}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                item.colorResult
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                            }`}
                        >
                             {item.loadingAction === 'color' ? <Spinner /> : 'Colors'}
                        </button>
                        <button
                            onClick={onEdit}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30 transition-all flex items-center justify-center gap-2 ${item.isEdited || item.draft ? 'text-purple-300 border-purple-500/30 bg-purple-500/10' : ''}`}
                        >
                             <div className="scale-75 flex items-center justify-center"><MagicWandIcon /></div> 
                             {item.draft ? 'Resume' : 'Editor'}
                        </button>
                        <button
                            onClick={() => onSmartAnalysis(item.id)}
                            disabled={isLoading}
                            className="col-span-2 px-3 py-2 rounded-lg text-xs font-bold border border-teal-500/40 bg-gradient-to-r from-teal-500/20 to-blue-500/10 text-teal-300 hover:from-teal-500/30 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {item.loadingAction === 'smart' ? <><Spinner /> Running Pipeline...</> : '⚡ Smart Analysis'}
                        </button>
                        <div className="flex gap-1">
                             <button
                                onClick={() => onDownload(item)}
                                title="Download locally"
                                className="flex-1 py-2 px-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-center"
                            >
                                <DownloadIcon className="scale-75" />
                            </button>
                            <button
                                onClick={() => onSaveToCloud(item.id, 'google-drive')}
                                title="Save to Google Drive"
                                disabled={!!isExporting}
                                className="flex-1 py-2 px-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-center"
                            >
                                {isExporting === `${item.id}-google-drive` ? <Spinner /> : <GoogleDriveIcon className="scale-50" />}
                            </button>
                            <button
                                onClick={() => onSaveToCloud(item.id, 'dropbox')}
                                title="Save to Dropbox"
                                disabled={!!isExporting}
                                className="flex-1 py-2 px-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-center"
                            >
                                {isExporting === `${item.id}-dropbox` ? <Spinner /> : <DropboxIcon className="scale-50 text-blue-400" />}
                            </button>
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
                    error: null,
                    selectedFilter: 'none',
                    isDescriptionCopied: false,
                    isTagsCopied: false,
                    isEdited: false,
                    showSuccess: false,
                    draft: null
                } as BatchItem);
            });
            setItems(prev => [...prev, ...newItems]);
            setGlobalError(null);
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
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ImageAnalyzer;
