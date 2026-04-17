
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { editImage } from '../services/geminiService';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import type { ImageDraftState } from '../types';
import { 
    EraserIcon, MagicWandIcon, PlusIcon, BackgroundIcon, 
    BrushIcon, UndoIcon, CheckIcon, DownloadIcon, UploadIcon, 
    WatermarkIcon, MagicEraserIcon, HumanizerIcon, TrashIcon,
    UpscaleIcon, SparklesIcon, ImageIcon, SaveIcon, DiskIcon,
    CloneIcon, PencilIcon
} from './Icons';

interface ImageEditorProps {
    imageBase64: string;
    mimeType: string;
    initialDraft?: ImageDraftState | null;
    onClose: () => void;
    onSave: (newImageBase64: string) => void;
    onSaveDraft?: (draft: ImageDraftState) => void;
}

type ToolType = 'erase' | 'insert' | 'background' | 'watermark' | 'upscale' | 'humanize' | 'clone';

interface TutorialStep {
    targetId: string;
    title: string;
    description: string;
    position: 'left' | 'right' | 'top' | 'bottom' | 'center';
    toolToSelect?: ToolType;
}

const tutorialSteps: TutorialStep[] = [
    {
        targetId: 'welcome',
        title: 'Welcome to Magic Editor!',
        description: 'Take full control of your images with Gemini AI. This quick guide will show you how to use the essential tools.',
        position: 'center'
    },
    {
        targetId: 'tool-erase',
        title: 'Erase Tool',
        description: 'Need to remove something? Select Erase, then paint over any unwanted objects on the canvas.',
        position: 'right',
        toolToSelect: 'erase'
    },
    {
        targetId: 'tool-insert',
        title: 'Insert Tool',
        description: 'Add new elements anywhere! Paint a target area and describe what you want the AI to create there.',
        position: 'right',
        toolToSelect: 'insert'
    },
    {
        targetId: 'tool-clone',
        title: 'Clone Stamp',
        description: 'Manual retouching! First, "Pick Source" to select an area to copy, then paint over the target to clone pixels.',
        position: 'right',
        toolToSelect: 'clone'
    },
    {
        targetId: 'tool-background',
        title: 'Background Removal',
        description: 'Instantly isolate your subject. One click removes the entire background automatically.',
        position: 'right',
        toolToSelect: 'background'
    },
    {
        targetId: 'canvas',
        title: 'The Canvas',
        description: 'This is where you paint your target areas. Use the brush to highlight exactly what you want the AI to transform.',
        position: 'center'
    },
    {
        targetId: 'brush-settings',
        title: 'Brush Precision',
        description: 'Adjust the brush size for fine details or broad strokes. Accuracy helps the AI get better results!',
        position: 'left'
    },
    {
        targetId: 'apply-btn',
        title: 'Apply Magic',
        description: 'Once you are ready, hit Apply Changes to see the AI transform your image in seconds.',
        position: 'top'
    }
];

const exampleInsertPrompts = [
    "A vintage red car",
    "A sleeping ginger cat",
    "A bouquet of wildflowers",
    "A futuristic drone",
    "A wooden park bench",
    "A glowing neon sign"
];

const ImageEditor: React.FC<ImageEditorProps> = ({ imageBase64, mimeType, initialDraft, onClose, onSave, onSaveDraft }) => {
    const [currentImage, setCurrentImage] = useState<string>(initialDraft?.currentImage || imageBase64);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>('erase');
    const [brushSize, setBrushSize] = useState(20);
    const [isAdjustingBrush, setIsAdjustingBrush] = useState(false);
    const [promptText, setPromptText] = useState('');
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<number | null>(initialDraft?.timestamp || null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    
    const [tutorialIdx, setTutorialIdx] = useState<number | null>(null);
    const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);

    const [watermarkMode, setWatermarkMode] = useState<'auto' | 'manual'>('auto');

    // Clone tool states
    const [isCloneSampling, setIsCloneSampling] = useState(false);
    const [cloneSource, setCloneSource] = useState<{ x: number, y: number } | null>(null);
    const [cloneOffset, setCloneOffset] = useState<{ x: number, y: number } | null>(null);

    const [refImage, setRefImage] = useState<{ base64: string; mime: string; preview: string } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    // Secondary canvas for non-masking edits (like clone stamp)
    const paintCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasMask, setHasMask] = useState(!!initialDraft?.maskDataUrl);
    
    const b64ToBlobUrl = (b64: string, mime: string): string => {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return URL.createObjectURL(new Blob([arr], { type: mime }));
    };

    const blobUrlToB64 = async (url: string): Promise<string> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const allBlobUrlsRef = useRef<Set<string>>(new Set());

    const trackBlobUrl = (url: string): string => {
        allBlobUrlsRef.current.add(url);
        return url;
    };

    const [history, setHistory] = useState<string[]>(() => {
        const initial = trackBlobUrl(b64ToBlobUrl(initialDraft?.currentImage || imageBase64, mimeType));
        return [initial];
    });
    const [historyIndex, setHistoryIndex] = useState(0);

    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

    useEffect(() => {
        if (imageRef.current && canvasRef.current && containerRef.current && paintCanvasRef.current) {
            const img = imageRef.current;
            const maskCanvas = canvasRef.current;
            const paintCanvas = paintCanvasRef.current;
            const container = containerRef.current;

            const setupCanvas = () => {
                const maxWidth = container.clientWidth;
                const maxHeight = container.clientHeight; 
                
                let width = img.naturalWidth;
                let height = img.naturalHeight;
                
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                
                const displayWidth = width * ratio;
                const displayHeight = height * ratio;

                [maskCanvas, paintCanvas].forEach(c => {
                    c.width = width;
                    c.height = height;
                    c.style.width = `${displayWidth}px`;
                    c.style.height = `${displayHeight}px`;
                });

                img.style.width = `${displayWidth}px`;
                img.style.height = `${displayHeight}px`;

                // Load initial mask if it exists in the draft
                if (initialDraft?.maskDataUrl) {
                    const ctx = maskCanvas.getContext('2d');
                    const maskImg = new Image();
                    maskImg.onload = () => {
                        ctx?.drawImage(maskImg, 0, 0);
                    };
                    maskImg.src = initialDraft.maskDataUrl;
                }
            };

            if (img.complete) {
                setupCanvas();
            } else {
                img.onload = setupCanvas;
            }
        }
    }, [currentImage, activeTool]);

    useEffect(() => {
        return () => { allBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url)); };
    }, []);

    const handleSaveDraftInternal = useCallback((isAuto: boolean = false) => {
        if (onSaveDraft) {
            if (isAuto) setIsAutoSaving(true);
            
            const draft: ImageDraftState = {
                currentImage,
                history: [currentImage],
                historyIndex: 0,
                maskDataUrl: hasMask ? canvasRef.current?.toDataURL() : undefined,
                timestamp: Date.now()
            };
            
            try {
                onSaveDraft(draft);
                setLastSavedTime(draft.timestamp);
                if (!isAuto) {
                    setIsDraftSaved(true);
                    setTimeout(() => setIsDraftSaved(false), 2000);
                }
            } catch (e) {
                console.error("Failed to save draft:", e);
                if (!isAuto) setError("Local storage limit reached. Try clearing some drafts.");
            } finally {
                if (isAuto) setTimeout(() => setIsAutoSaving(false), 1000);
            }
        }
    }, [onSaveDraft, currentImage, history, historyIndex, hasMask]);

    useEffect(() => {
        const timer = setInterval(() => {
            handleSaveDraftInternal(true);
        }, AUTO_SAVE_INTERVAL);
        
        return () => clearInterval(timer);
    }, [handleSaveDraftInternal]);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenMagicEditorTutorialV2');
        if (!hasSeenTutorial) {
            setTutorialIdx(0);
        }
    }, []);

    const completeTutorial = () => {
        setTutorialIdx(null);
        localStorage.setItem('hasSeenMagicEditorTutorialV2', 'true');
    };

    const nextTutorial = () => {
        if (tutorialIdx !== null) {
            const nextIdx = tutorialIdx + 1;
            if (nextIdx < tutorialSteps.length) {
                const step = tutorialSteps[nextIdx];
                if (step.toolToSelect) {
                    setActiveTool(step.toolToSelect);
                    clearMask();
                }
                setTutorialIdx(nextIdx);
            } else {
                completeTutorial();
            }
        }
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (activeTool === 'background' || activeTool === 'upscale' || activeTool === 'humanize') return;
        
        const { x, y } = getCoordinates(e);

        if (activeTool === 'clone') {
            if (isCloneSampling) {
                setCloneSource({ x, y });
                setIsCloneSampling(false);
                return;
            }
            if (!cloneSource) {
                setError("Please 'Pick Source' before cloning.");
                return;
            }
            setCloneOffset({ x: cloneSource.x - x, y: cloneSource.y - y });
        }

        setIsDrawing(true);
        const targetCanvas = activeTool === 'clone' ? paintCanvasRef.current : canvasRef.current;
        const ctx = targetCanvas?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            if (activeTool === 'clone') {
                // Manual retouching setup
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = brushSize * (canvasRef.current!.width / 800);
            } else if (activeTool !== 'watermark' || watermarkMode === 'manual') {
                // Masking setup
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; 
                ctx.lineWidth = brushSize * (canvasRef.current!.width / 800); 
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current || !paintCanvasRef.current || !imageRef.current) return;
        e.preventDefault(); 
        const { x, y } = getCoordinates(e);
        
        if (activeTool === 'clone' && cloneOffset) {
            const ctx = paintCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.save();
                ctx.beginPath();
                // Simple circle brush for clone stamp
                const r = brushSize * (canvasRef.current!.width / 800) / 2;
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.clip();
                
                // Draw image with offset
                ctx.drawImage(
                    imageRef.current, 
                    x + cloneOffset.x - r, y + cloneOffset.y - r, r * 2, r * 2, // source
                    x - r, y - r, r * 2, r * 2 // dest
                );
                ctx.restore();
            }
        } else if (activeTool !== 'clone') {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx && (activeTool !== 'watermark' || watermarkMode === 'manual')) {
                ctx.lineTo(x, y);
                ctx.stroke();
                setHasMask(true);
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (activeTool === 'clone') {
                // For clone tool, we composite the paintCanvas back into the main image history
                applyManualRetouch();
            } else {
                const ctx = canvasRef.current?.getContext('2d');
                ctx?.closePath();
            }
        }
    };

    const applyManualRetouch = () => {
        if (!paintCanvasRef.current || !imageRef.current) return;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageRef.current.naturalWidth;
        tempCanvas.height = imageRef.current.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(imageRef.current, 0, 0);
        ctx.drawImage(paintCanvasRef.current, 0, 0);
        
        const resultBase64 = tempCanvas.toDataURL(mimeType).split(',')[1];
        
        const slicedOff = history.slice(historyIndex + 1);
        slicedOff.forEach(url => { URL.revokeObjectURL(url); allBlobUrlsRef.current.delete(url); });
        const newBlobUrl = trackBlobUrl(b64ToBlobUrl(resultBase64, mimeType));
        const newHistory = [...history.slice(0, historyIndex + 1), newBlobUrl];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentImage(resultBase64);
        
        // Clear paint canvas for next stroke
        const pCtx = paintCanvasRef.current.getContext('2d');
        pCtx?.clearRect(0, 0, paintCanvasRef.current.width, paintCanvasRef.current.height);
    };

    const clearMask = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHasMask(false);
        }
    };

    const handleUndo = async () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const blobUrl = history[newIndex];
            try {
                const b64 = await blobUrlToB64(blobUrl);
                setCurrentImage(b64);
            } catch {
                setError("Failed to undo — history entry unavailable.");
            }
            clearMask();
        }
    };

    const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setRefImage({
                    base64: result.split(',')[1],
                    mime: file.type,
                    preview: result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const compositeImageAndMask = async (): Promise<string> => {
        if (!canvasRef.current || !imageRef.current) return currentImage;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageRef.current.naturalWidth;
        tempCanvas.height = imageRef.current.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return currentImage;

        ctx.drawImage(imageRef.current, 0, 0);
        ctx.drawImage(canvasRef.current, 0, 0);

        return tempCanvas.toDataURL(mimeType).split(',')[1];
    };

    const handleApply = async () => {
        setIsLoading(true);
        setError(null);
        setShowSuccess(false);
        
        try {
            let inputImage = currentImage;
            let finalPrompt = "";

            if (activeTool === 'erase') {
                if (!hasMask) throw new Error("Please paint over the area you want to erase.");
                inputImage = await compositeImageAndMask();
                finalPrompt = promptText || "Remove the area highlighted in red and fill it in seamlessly matching the background.";
            } else if (activeTool === 'insert') {
                if (!hasMask) throw new Error("Please paint the area where you want to insert the object.");
                if (!promptText && !refImage) throw new Error("Please describe what to insert or provide a reference image.");
                
                inputImage = await compositeImageAndMask();
                finalPrompt = promptText ? `In the area highlighted in red, insert a ${promptText}. Ensure it blends perfectly with the lighting, shadows, and perspective of the scene.` : "In the area highlighted in red, insert an object matching the provided reference image.";
            } else if (activeTool === 'background') {
                finalPrompt = "Completely remove the background, isolating the main subject on a plain white background. Ensure clean edges around hair and fine details.";
            } else if (activeTool === 'watermark') {
                if (watermarkMode === 'manual' && hasMask) {
                    inputImage = await compositeImageAndMask();
                    finalPrompt = promptText || "Remove all watermarks, text, or logos highlighted in red. Reconstruct the underlying image details seamlessly to make it look original.";
                } else {
                    finalPrompt = "Scan the entire image. Remove all watermarks, logos, and text overlays automatically. Reconstruct the underlying image details seamlessly to make it look original.";
                }
            } else if (activeTool === 'upscale') {
                finalPrompt = "Upscale this image to high resolution. Sharpen all details, remove artifacts, and enhance clarity while preserving all original features perfectly.";
            } else if (activeTool === 'humanize') {
                finalPrompt = "Analyze this image for AI-generated artifacts such as unnatural textures, distorted facial features, or physical inconsistencies. Correct these artifacts to make the image look like a genuine, high-quality human photograph. Focus on anatomical accuracy and natural lighting.";
            } else if (activeTool === 'clone') {
                setIsLoading(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 1000);
                return;
            }

            const resultBase64 = await editImage(
                inputImage, 
                mimeType, 
                finalPrompt, 
                refImage?.base64, 
                refImage?.mime
            );

            const slicedOff2 = history.slice(historyIndex + 1);
            slicedOff2.forEach(url => { URL.revokeObjectURL(url); allBlobUrlsRef.current.delete(url); });
            const newBlobUrl2 = trackBlobUrl(b64ToBlobUrl(resultBase64, mimeType));
            const newHistory = [...history.slice(0, historyIndex + 1), newBlobUrl2];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setCurrentImage(resultBase64);
            clearMask();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply edit.");
        } finally {
            setIsLoading(false);
        }
    };

    const tools = [
        { id: 'erase', icon: <EraserIcon />, label: 'Erase Object', description: "Remove unwanted objects by painting over them.", requiresMask: true },
        { id: 'insert', icon: <PlusIcon />, label: 'Insert Object', description: "Add new elements by painting a target area and describing them.", requiresMask: true },
        { id: 'clone', icon: <CloneIcon />, label: 'Clone Stamp', description: "Copy pixels from one area to another. (Manual)", requiresMask: false },
        { id: 'humanize', icon: <HumanizerIcon />, label: 'AI Humanize', description: "Correct AI artifacts and inconsistencies for a more natural look.", requiresMask: false },
        { id: 'upscale', icon: <UpscaleIcon />, label: 'Upscale AI', description: "Enhance image resolution and detail using AI.", requiresMask: false },
        { id: 'background', icon: <BackgroundIcon />, label: 'Remove BG', description: "Automatically isolate the main subject and remove the background.", requiresMask: false },
        { id: 'watermark', icon: <WatermarkIcon />, label: 'Watermark AI', description: "Erase text, logos, or watermarks seamlessly.", requiresMask: true },
    ];

    const currentTutorialStep = tutorialIdx !== null ? tutorialSteps[tutorialIdx] : null;

    const formatLastSaved = (ts: number) => {
        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(ts));
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-in fade-in duration-200">
            <AnimatePresence>
                {tutorialIdx !== null && currentTutorialStep && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                        onClick={nextTutorial}
                    >
                        <div className="w-full h-full flex items-center justify-center pointer-events-none p-8">
                             <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-gray-800 border-2 border-teal-500 p-8 rounded-3xl shadow-[0_0_50px_rgba(20,184,166,0.3)] max-w-sm w-full pointer-events-auto relative"
                                onClick={(e) => e.stopPropagation()}
                             >
                                <div className="absolute -top-4 -right-4">
                                     <button onClick={completeTutorial} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">×</button>
                                </div>
                                <div className="flex items-center gap-3 mb-4 text-teal-400">
                                    <SparklesIcon />
                                    <h3 className="text-xl font-bold">{currentTutorialStep.title}</h3>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-8">
                                    {currentTutorialStep.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Step {tutorialIdx + 1} of {tutorialSteps.length}</span>
                                    <button 
                                        onClick={nextTutorial}
                                        className="px-6 py-2 bg-teal-500 text-black text-xs font-black rounded-xl hover:bg-teal-400 transition-all transform hover:scale-105"
                                    >
                                        {tutorialIdx === tutorialSteps.length - 1 ? 'Finish' : 'Next Step'}
                                    </button>
                                </div>

                                {currentTutorialStep.position === 'right' && <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-800 border-l-2 border-b-2 border-teal-500 rotate-45 transform -translate-y-1/2" />}
                                {currentTutorialStep.position === 'left' && <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-800 border-r-2 border-t-2 border-teal-500 rotate-45 transform -translate-y-1/2" />}
                             </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-gray-900">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MagicWandIcon /> Magic Editor
                    </h2>
                    <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/5">
                        <button 
                            onClick={handleUndo} 
                            disabled={historyIndex === 0 || isLoading}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300"
                            title="Undo"
                        >
                            <UndoIcon />
                        </button>
                    </div>
                    <div className="flex flex-col ml-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status:</span>
                            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                {isAutoSaving ? <><Spinner /> Syncing...</> : 'Work Ready'}
                            </span>
                        </div>
                        {lastSavedTime && (
                            <span className="text-[9px] text-gray-600 mt-0.5">Last saved: {formatLastSaved(lastSavedTime)}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleSaveDraftInternal(false)}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 border border-transparent hover:border-white/10"
                    >
                        <AnimatePresence mode="wait">
                            {isDraftSaved ? (
                                <motion.div key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                                    <CheckIcon /> Saved
                                </motion.div>
                            ) : (
                                <motion.div key="save" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="flex items-center gap-2 text-sm font-semibold">
                                    <DiskIcon className="scale-90" /> Save Draft
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">Cancel</button>
                    <button id="apply-btn" onClick={() => onSave(currentImage)} className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-black transition-colors flex items-center gap-2 text-sm">
                        <CheckIcon /> Done
                    </button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                <div id="sidebar" className={`w-20 bg-gray-800/50 border-r border-white/10 flex flex-col items-center py-6 gap-4 relative`}>
                    {tools.map(tool => (
                        <div key={tool.id} className="relative">
                            <button
                                id={`tool-${tool.id}`}
                                onMouseEnter={() => setHoveredToolId(tool.id)}
                                onMouseLeave={() => setHoveredToolId(null)}
                                onClick={() => { setActiveTool(tool.id as ToolType); clearMask(); }}
                                className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 text-[10px] font-medium w-16 ${
                                    activeTool === tool.id 
                                    ? 'bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.4)]' 
                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <div className="scale-110">{tool.icon}</div>
                                <span className="text-center leading-tight">{tool.label}</span>
                            </button>
                            
                            <AnimatePresence>
                                {hoveredToolId === tool.id && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[70] w-48 pointer-events-none"
                                    >
                                        <div className="bg-gray-800 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                                            <div className="text-teal-400 font-bold text-[10px] uppercase tracking-widest mb-1">{tool.label}</div>
                                            <div className="text-gray-200 text-xs leading-relaxed">{tool.description}</div>
                                        </div>
                                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 border-l border-b border-white/10 rotate-45" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {currentTutorialStep?.targetId === `tool-${tool.id}` && (
                                <motion.div 
                                    layoutId="tutorial-ring"
                                    className="absolute inset-0 rounded-xl border-2 border-teal-400 z-10 pointer-events-none"
                                    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div id="canvas" ref={containerRef} className={`flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-900 flex items-center justify-center overflow-hidden p-8 ${currentTutorialStep?.targetId === 'canvas' ? 'ring-4 ring-teal-500/50 z-[65]' : ''}`}>
                    <div className="relative shadow-2xl shadow-black">
                        <img ref={imageRef} src={`data:${mimeType};base64,${currentImage}`} alt="Editing" className="max-w-full max-h-full object-contain block pointer-events-none select-none" />
                        <canvas 
                            ref={canvasRef}
                            className={`absolute inset-0 touch-none z-10 ${
                                (activeTool === 'erase' || activeTool === 'insert' || (activeTool === 'watermark' && watermarkMode === 'manual')) ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
                            }`}
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        />
                        <canvas 
                            ref={paintCanvasRef}
                            className={`absolute inset-0 touch-none z-20 ${
                                activeTool === 'clone' ? (isCloneSampling ? 'cursor-alias' : 'cursor-crosshair') : 'pointer-events-none'
                            }`}
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        />
                         
                        {!isLoading && (activeTool === 'background' || activeTool === 'upscale' || activeTool === 'humanize' || (activeTool === 'watermark' && watermarkMode === 'auto')) && (
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                                <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center max-w-xs shadow-2xl">
                                    <div className="mb-2 text-teal-400 mx-auto w-8 h-8">
                                        {activeTool === 'upscale' ? <UpscaleIcon /> : activeTool === 'watermark' ? <WatermarkIcon /> : <MagicWandIcon />}
                                    </div>
                                    <h4 className="text-white font-semibold text-sm">
                                        {activeTool === 'upscale' ? 'Super Resolution' : activeTool === 'humanize' ? 'AI Humanizer' : activeTool === 'watermark' ? 'Watermark AI (Auto)' : 'Automatic Mode'}
                                    </h4>
                                    <p className="text-gray-400 text-xs mt-1">
                                        {activeTool === 'upscale' && "Enhance details and sharpness automatically."}
                                        {activeTool === 'humanize' && "Automatically identifies and corrects common AI artifacts across the entire image."}
                                        {activeTool === 'background' && "One-click background removal. No manual masking required."}
                                        {activeTool === 'watermark' && "AI is scanning the entire image to detect and remove watermarks automatically."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTool === 'clone' && !cloneSource && !isCloneSampling && (
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                                <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center max-w-xs shadow-2xl">
                                    <div className="mb-2 text-teal-400 mx-auto w-8 h-8"><CloneIcon /></div>
                                    <h4 className="text-white font-semibold text-sm">Clone Stamp Ready</h4>
                                    <p className="text-gray-400 text-xs mt-1">First, use the <b>Pick Source</b> button to select the area you want to copy from.</p>
                                </div>
                            </div>
                        )}

                         {isLoading && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                                <Spinner />
                                <span className="text-teal-300 font-semibold mt-4 animate-pulse">
                                    {activeTool === 'upscale' ? 'Upscaling Image...' : 'AI is processing...'}
                                </span>
                            </div>
                        )}

                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="absolute inset-0 z-50 bg-teal-500/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
                                >
                                    <div className="bg-black/80 text-teal-400 px-6 py-3 rounded-full border border-teal-500/40 shadow-2xl flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/40">
                                            <CheckIcon className="scale-75" />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest">Edit Applied</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Clone Source Preview Marker */}
                        {activeTool === 'clone' && cloneSource && (
                            <div 
                                className="absolute border-2 border-dashed border-teal-400 rounded-full pointer-events-none z-30 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                                style={{ 
                                    left: (cloneSource.x / (canvasRef.current?.width || 1)) * 100 + '%', 
                                    top: (cloneSource.y / (canvasRef.current?.height || 1)) * 100 + '%',
                                    width: brushSize * ((canvasRef.current?.clientWidth || 0) / (canvasRef.current?.width || 1)) + 'px',
                                    height: brushSize * ((canvasRef.current?.clientHeight || 0) / (canvasRef.current?.height || 1)) + 'px',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-teal-400 rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                    <AnimatePresence>{error && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md"><ErrorDisplay message={error} onDismiss={() => setError(null)} /></div>}</AnimatePresence>
                </div>

                <div className="w-80 bg-gray-800 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{tools.find(t => t.id === activeTool)?.label}</h3>
                        <p className="text-xs text-gray-400">
                            {activeTool === 'erase' && "Paint over the object you want to remove."}
                            {activeTool === 'insert' && "Paint area and describe object to insert."}
                            {activeTool === 'clone' && "Manual pixel cloning. Sample an area and paint it elsewhere."}
                            {activeTool === 'background' && "Automatically remove the background."}
                            {activeTool === 'watermark' && "Fix watermarks using AI detection or manual mask."}
                            {activeTool === 'upscale' && "AI enhancement for resolution and detail."}
                            {activeTool === 'humanize' && "Fixes anatomical errors and texture glitches."}
                        </p>
                    </div>

                    {activeTool === 'clone' && (
                        <div className="space-y-4 p-4 bg-black/20 rounded-xl border border-white/5">
                            <button 
                                onClick={() => setIsCloneSampling(!isCloneSampling)}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isCloneSampling ? 'bg-amber-500 text-black animate-pulse' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                            >
                                <PencilIcon className="scale-75" />
                                {isCloneSampling ? 'Click Canvas to Pick Source' : 'Pick Source Area'}
                            </button>
                            {cloneSource && !isCloneSampling && (
                                <p className="text-[10px] text-teal-400 text-center uppercase font-bold tracking-widest">Source Set. Start Painting.</p>
                            )}
                        </div>
                    )}

                    {activeTool === 'watermark' && (
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-300 block mb-2">Detection Mode</label>
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                                <button 
                                    onClick={() => { setWatermarkMode('auto'); clearMask(); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${watermarkMode === 'auto' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Automatic
                                </button>
                                <button 
                                    onClick={() => setWatermarkMode('manual')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${watermarkMode === 'manual' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Manual (Paint)
                                </button>
                            </div>
                        </div>
                    )}

                    {(activeTool === 'erase' || activeTool === 'insert' || activeTool === 'clone' || (activeTool === 'watermark' && watermarkMode === 'manual')) && (
                        <div id="brush-settings" className={`space-y-4 p-4 bg-black/20 rounded-xl border border-white/5 relative ${currentTutorialStep?.targetId === 'brush-settings' ? 'ring-2 ring-teal-500 z-[65]' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><BrushIcon /> Brush Size</label>
                                <span className="text-xs text-teal-400 font-mono">{brushSize}px</span>
                            </div>
                            <div className="h-24 w-full bg-black/40 rounded-lg flex items-center justify-center border border-white/5 overflow-hidden mb-4 relative">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] bg-[size:10px_10px]" />
                                <motion.div className="rounded-full bg-teal-500/30 border border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]" animate={{ width: brushSize, height: brushSize }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} />
                                {isAdjustingBrush && <span className="absolute bottom-2 right-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest animate-pulse">Preview</span>}
                            </div>
                            <input type="range" min="5" max="100" value={brushSize} onMouseDown={() => setIsAdjustingBrush(true)} onMouseUp={() => setIsAdjustingBrush(false)} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                            <button onClick={clearMask} className="w-full py-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors mt-2">Clear Mask</button>
                        </div>
                    )}

                    {activeTool === 'insert' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <ImageIcon className="scale-75 opacity-70" /> Reference Image <span className="text-[10px] text-gray-500 uppercase font-bold">(Optional)</span>
                                </label>
                                <div className="relative group">
                                    <div className={`w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${refImage ? 'border-teal-500/50 bg-black/40 shadow-inner' : 'border-white/10 bg-black/20 hover:border-teal-500/30'}`}>
                                        {refImage ? (
                                            <img src={refImage.preview} alt="Ref" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <UploadIcon className="mx-auto" />
                                                <span className="text-[10px] text-gray-500 block mt-2 font-semibold">GUIDE AI WITH AN IMAGE</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleRefImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {refImage && (
                                            <button onClick={(e) => { e.preventDefault(); setRefImage(null); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/80 shadow-xl backdrop-blur-md">
                                                <TrashIcon className="scale-75" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTool === 'erase' || activeTool === 'insert' || (activeTool === 'watermark' && watermarkMode === 'manual')) && (
                         <div id="prompt-area" className={`space-y-3`}>
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <SparklesIcon className="scale-75 opacity-70" /> {activeTool === 'insert' ? 'Object Description' : 'Advanced Guidance'}
                            </label>
                            <textarea
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder={activeTool === 'insert' ? "e.g., A vintage brass telescope on a tripod..." : "Additional details to help the AI..."}
                                className="w-full p-4 bg-black/20 rounded-xl border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500 outline-none resize-none h-32 transition-all shadow-inner"
                            />
                            {activeTool === 'insert' && (
                                <div className="space-y-2">
                                    <span className="text-[10px] text-gray-500 w-full font-bold uppercase tracking-widest pl-1">Quick Suggestions</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {exampleInsertPrompts.map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPromptText(prompt)}
                                                className="px-2.5 py-1.5 text-[10px] rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button
                            id="apply-btn-trigger"
                            onClick={handleApply}
                            disabled={isLoading || (activeTool === 'insert' && !promptText && !refImage)}
                            className={`w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-black font-extrabold shadow-xl shadow-teal-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative ${currentTutorialStep?.targetId === 'apply-btn' ? 'ring-2 ring-teal-300 z-[65]' : ''}`}
                        >
                            {isLoading ? <Spinner /> : <><MagicWandIcon /> {activeTool === 'clone' ? 'Finish Retouching' : 'Apply Changes'}</>}
                            {currentTutorialStep?.targetId === 'apply-btn' && (
                                <motion.div 
                                    className="absolute inset-0 rounded-xl border-4 border-teal-300 z-10 pointer-events-none"
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 0, 0.8] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
