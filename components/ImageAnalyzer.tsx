import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImage, describeImage, generateImageTags, editImage, getDominantColors, generateImagePrompt, classifyImageStyle } from '../services/geminiService';
import type { ImageDraftState } from '../types';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import ImageEditor from './ImageEditor';
import type { BatchItem, LoadingAction } from './image-analyzer/types';
import BatchItemCard from './image-analyzer/BatchItemCard';
import VideoSwapPanel from './image-analyzer/VideoSwapPanel';
import GeneratePanel from './image-analyzer/GeneratePanel';
import UploadZone from './image-analyzer/UploadZone';
import BatchToolbar from './image-analyzer/BatchToolbar';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const ImageAnalyzer: React.FC = () => {
    const [mainMode, setMainMode] = useState<'image' | 'video' | 'generate'>('image');
    const [items, setItems] = useState<BatchItem[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editorBase64, setEditorBase64] = useState<string | null>(null);

    useEffect(() => {
        const savedDrafts = localStorage.getItem('imageDrafts');
        if (savedDrafts) {
            try {
                const draftsMap = JSON.parse(savedDrafts);
                setItems(prev => prev.map(item => ({ ...item, draft: draftsMap[item.id] || null })));
            } catch (e) { console.error("Failed to parse drafts", e); }
        }
    }, []);

    const saveDraftsToStorage = useCallback((updatedItems: BatchItem[]) => {
        const draftsMap: Record<string, ImageDraftState> = {};
        [...updatedItems].filter(i => i.draft).sort((a, b) => (b.draft?.timestamp || 0) - (a.draft?.timestamp || 0)).slice(0, 10)
            .forEach(item => { if (item.draft) draftsMap[item.id] = item.draft; });
        try { localStorage.setItem('imageDrafts', JSON.stringify(draftsMap)); }
        catch { setGlobalError("Storage limit reached. Older drafts were discarded."); }
    }, []);

    const makeNewItem = (file: File): BatchItem => {
        const previewUrl = URL.createObjectURL(file);
        return {
            id: generateId(), file, preview: previewUrl, originalPreview: previewUrl,
            loadingAction: null, result: null, description: null, tags: null,
            colorResult: null, promptResult: null, styleResult: null,
            isPromptCopied: false, error: null, selectedFilter: 'none',
            isDescriptionCopied: false, isTagsCopied: false, isEdited: false,
            showSuccess: false, draft: null, precisionMode: false,
        } as BatchItem;
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newItems: BatchItem[] = [];
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) { setGlobalError('Some files were skipped — not valid images.'); return; }
            newItems.push(makeNewItem(file));
        });
        setItems(prev => [...prev, ...newItems]);
        setGlobalError(null);
        newItems.forEach(item => processItem(item.id, 'analyze'));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
        else if (e.type === 'dragleave') setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files);
    };

    const removeItem = (id: string) => {
        setItems(prev => {
            const it = prev.find(i => i.id === id);
            if (it) { if (it.preview.startsWith('blob:')) URL.revokeObjectURL(it.preview); if (it.originalPreview.startsWith('blob:')) URL.revokeObjectURL(it.originalPreview); }
            const updated = prev.filter(i => i.id !== id);
            saveDraftsToStorage(updated);
            return updated;
        });
    };

    const revertItem = (id: string) => {
        setItems(prev => {
            const updated = prev.map(item => item.id === id ? { ...item, preview: item.originalPreview, isEdited: false, draft: null } : item);
            saveDraftsToStorage(updated);
            return updated;
        });
    };

    const clearAll = () => {
        items.forEach(item => { if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview); if (item.originalPreview.startsWith('blob:')) URL.revokeObjectURL(item.originalPreview); });
        setItems([]); localStorage.removeItem('imageDrafts'); setGlobalError(null);
    };

    const fileToBase64 = (file: File | Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => { const r = reader.result as string; if (r) resolve(r.split(',')[1]); else reject(new Error("Reader produced no result.")); };
            reader.onerror = () => reject(new Error("Could not read the image file."));
            reader.readAsDataURL(file);
        });

    const getBase64FromItem = async (item: BatchItem): Promise<string> => {
        if (item.preview.startsWith('data:')) return item.preview.split(',')[1];
        if (item.preview === item.originalPreview && item.file instanceof File) return await fileToBase64(item.file);
        const res = await fetch(item.preview);
        if (!res.ok) throw new Error("Failed to fetch image blob.");
        return await fileToBase64(await res.blob());
    };

    const processItem = async (id: string, action: 'analyze' | 'describe' | 'tag' | 'color') => {
        let snapshot: BatchItem | undefined;
        setItems(prev => {
            const found = prev.find(i => i.id === id);
            if (found) snapshot = found;
            return prev.map(i => i.id === id ? { ...i, loadingAction: action, error: null } : i);
        });
        try {
            const item = snapshot;
            if (!item) return;
            const base64Image = await getBase64FromItem(item);
            const mimeType = item.file.type;
            let updates: Partial<BatchItem> = { loadingAction: null };
            if (action === 'analyze') { updates.result = await analyzeImage(base64Image, mimeType); }
            else if (action === 'describe') { updates.description = await describeImage(base64Image, mimeType); updates.result = null; updates.tags = null; updates.colorResult = null; }
            else if (action === 'tag') { updates.tags = await generateImageTags(base64Image, mimeType); updates.result = null; updates.description = null; updates.colorResult = null; }
            else if (action === 'color') { updates.colorResult = await getDominantColors(base64Image, mimeType); updates.result = null; updates.description = null; updates.tags = null; }
            setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        } catch (err) {
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'An unexpected error occurred.' } : i));
        }
    };

    const processBatch = async (action: 'analyze' | 'describe' | 'tag' | 'color') => { await Promise.all(items.map(item => processItem(item.id, action))); };

    const processSmartAnalysis = async (id: string) => {
        let item: BatchItem | undefined;
        setItems(prev => {
            item = prev.find(i => i.id === id);
            return prev.map(i => i.id === id ? { ...i, loadingAction: 'smart', error: null } : i);
        });
        if (!item) return;
        try {
            const base64Image = await getBase64FromItem(item);
            const mimeType = item.file.type;
            const [result, description, tags, colorResult] = await Promise.all([analyzeImage(base64Image, mimeType), describeImage(base64Image, mimeType), generateImageTags(base64Image, mimeType), getDominantColors(base64Image, mimeType)]);
            let humanizedDescription = description;
            try { const res = await fetch('/humanize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: description, mode: 'bypass' }) }); const data = await res.json(); if (data.humanized_text && !data.fallback) humanizedDescription = data.humanized_text; } catch {}
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, result, description: humanizedDescription, tags, colorResult } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Smart analysis failed.' } : i)); }
    };

    const handleGeneratePrompt = async (id: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'prompt', promptResult: null, error: null } : i));
        try {
            const result = await generateImagePrompt(await getBase64FromItem(item), item.file.type);
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, promptResult: result } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Failed to generate prompt.' } : i)); }
    };

    const handleClassifyStyle = async (id: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'style', error: null } : i));
        try { const result = await classifyImageStyle(await getBase64FromItem(item), item.file.type); setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, styleResult: result } : i)); }
        catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Failed to classify style.' } : i)); }
    };

    const handleMakeHuman = async (id: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'make-human', error: null } : i));
        try {
            const base64Image = await getBase64FromItem(item);
            let editPrompt = "Make this image look more natural and less AI-generated. Add subtle imperfections, organic texture variation, realistic noise and grain, natural lighting irregularities, and slight asymmetry.";
            if (item.precisionMode) {
                try { const res = await fetch('/precision-edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image, prompt: editPrompt, edit_type: 'general' }) }); const data = await res.json(); if (data.enhanced_prompt) editPrompt = data.enhanced_prompt; } catch {}
            }
            const edited = await editImage(base64Image, item.file.type, editPrompt);
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, preview: `data:${item.file.type};base64,${edited}`, isEdited: true } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Failed to humanize image.' } : i)); }
    };

    const handleDetectFaces = async (id: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'detect-faces', error: null } : i));
        try {
            const res = await fetch('/detect-faces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: await getBase64FromItem(item) }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Face detection failed.');
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, detectedFaces: data.faces || [], imgOrigDims: { w: data.img_w, h: data.img_h }, error: data.faces?.length === 0 ? 'No faces detected.' : null } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Face detection failed.' } : i)); }
    };

    const handleFaceSwap = async (id: string, sourceB64: string, faceIndices: number[], model: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'face-swap', error: null } : i));
        try {
            const res = await fetch('/face-swap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: sourceB64, target: await getBase64FromItem(item), faceIndices, model }) });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Face swap failed.');
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, preview: `data:image/png;base64,${data.image}`, isEdited: true, detectedFaces: undefined, imgOrigDims: undefined } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Face swap failed.' } : i)); }
    };

    const handleOutfitSwap = async (id: string, textureOrPrompt: string, mode: 'texture' | 'ai', model: string) => {
        const item = items.find(i => i.id === id); if (!item) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: 'outfit-swap', error: null } : i));
        try {
            const imageB64 = await getBase64FromItem(item);
            if (mode === 'ai') {
                const res = await fetch('/outfit-swap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageB64, mode: 'ai', prompt: textureOrPrompt }) });
                const data = await res.json();
                if (!res.ok || data.error) throw new Error(data.error || 'Outfit AI failed.');
                const editedB64 = await editImage(imageB64, item.file.type, data.prompt);
                setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, preview: `data:${item.file.type};base64,${editedB64}`, isEdited: true } : i));
                return;
            }
            const res = await fetch('/outfit-swap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageB64, texture: textureOrPrompt, mode: 'texture' }) });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Outfit swap failed.');
            setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, preview: `data:image/png;base64,${data.image}`, isEdited: true } : i));
        } catch (err) { setItems(prev => prev.map(i => i.id === id ? { ...i, loadingAction: null, error: err instanceof Error ? err.message : 'Outfit swap failed.' } : i)); }
    };

    const processBatchEdit = async (editType: 'bg' | 'watermark' | 'upscale') => {
        const prompts: Record<string, { prompt: string; action: LoadingAction }> = {
            bg: { prompt: "Remove the background, isolating the main subject on a plain white background.", action: 'edit-bg' },
            watermark: { prompt: "Remove all watermarks, logos, and text overlays. Reconstruct underlying image details seamlessly.", action: 'edit-watermark' },
            upscale: { prompt: "Upscale to high resolution. Sharpen all details, remove artifacts, enhance clarity while preserving all original features.", action: 'edit-upscale' },
        };
        const { prompt, action } = prompts[editType];
        setItems(prev => prev.map(item => ({ ...item, loadingAction: action, error: null })));
        await Promise.all(items.map(async (item) => {
            try {
                const editedBase64 = await editImage(await getBase64FromItem(item), item.file.type, prompt);
                setItems(prev => { const updated = prev.map(i => i.id === item.id ? { ...i, loadingAction: null, preview: `data:${item.file.type};base64,${editedBase64}`, isEdited: true, showSuccess: true, draft: null } : i); saveDraftsToStorage(updated); return updated; });
                setTimeout(() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, showSuccess: false } : i)), 2500);
            } catch { setItems(prev => prev.map(i => i.id === item.id ? { ...i, loadingAction: null, error: `Failed to ${editType}.` } : i)); }
        }));
    };

    const updateItemState = (id: string, updates: Partial<BatchItem>) => setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));

    const handleDownload = (item: BatchItem) => {
        const link = document.createElement('a');
        link.href = item.preview;
        link.download = `processed-${item.file.name}`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleEditorSave = (newImageBase64: string) => {
        if (!editingItemId) return;
        const targetId = editingItemId;
        setItems(prev => { const updated = prev.map(item => item.id === targetId ? { ...item, preview: `data:${item.file.type};base64,${newImageBase64}`, isEdited: true, showSuccess: true, draft: null } : item); saveDraftsToStorage(updated); return updated; });
        setTimeout(() => setItems(prev => prev.map(i => i.id === targetId ? { ...i, showSuccess: false } : i)), 3000);
        setEditingItemId(null);
    };

    const handleEditorSaveDraft = (draft: ImageDraftState) => {
        if (!editingItemId) return;
        setItems(prev => { const updated = prev.map(item => item.id === editingItemId ? { ...item, draft } : item); saveDraftsToStorage(updated); return updated; });
    };

    const editingItem = items.find(i => i.id === editingItemId);

    useEffect(() => {
        if (editingItem) {
            getBase64FromItem(editingItem).then(setEditorBase64).catch(err => { setGlobalError(err.message); setEditingItemId(null); });
        } else { setEditorBase64(null); }
    }, [editingItem]);

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {editingItemId && editingItem && editorBase64 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-50">
                        <ImageEditor imageBase64={editorBase64} mimeType={editingItem.file.type} initialDraft={editingItem.draft} onClose={() => setEditingItemId(null)} onSave={handleEditorSave} onSaveDraft={handleEditorSaveDraft} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex rounded-2xl overflow-hidden border border-white/[0.07] bg-black/30 p-1 gap-1">
                <button onClick={() => setMainMode('image')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainMode === 'image' ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300'}`}>🖼 Image Mode</button>
                <button onClick={() => setMainMode('video')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainMode === 'video' ? 'bg-purple-500/25 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'}`}>🎬 Video &amp; Live</button>
                <button onClick={() => setMainMode('generate')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainMode === 'generate' ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30' : 'text-gray-500 hover:text-gray-300'}`}>✨ Generate</button>
            </div>

            <AnimatePresence mode="wait">
                {mainMode === 'video' && (
                    <motion.div key="video-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="rounded-3xl p-5" style={{ background: 'linear-gradient(145deg, rgba(12,12,22,0.97), rgba(6,6,14,0.99))', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <VideoSwapPanel />
                    </motion.div>
                )}
                {mainMode === 'generate' && (
                    <motion.div key="generate-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="rounded-3xl p-5" style={{ background: 'linear-gradient(145deg, rgba(12,12,22,0.97), rgba(6,6,14,0.99))', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <GeneratePanel />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {mainMode === 'image' && (
                    <motion.div key="image-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                        <AnimatePresence>
                            {items.length === 0 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-6 gap-4 select-none pointer-events-none">
                                    <motion.img src="/logo3.png" alt="HayL3ditor" className="w-48 sm:w-64 object-contain"
                                        animate={{ filter: ['brightness(1.15) drop-shadow(0 0 6px rgba(255,255,255,0.2)) drop-shadow(0 0 14px rgba(236,72,153,0.4))', 'brightness(1.25) drop-shadow(0 0 28px rgba(168,85,247,0.6))', 'brightness(1.15) drop-shadow(0 0 14px rgba(236,72,153,0.4))'], opacity: [0.72, 1, 0.72] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-[11px] font-black tracking-[0.35em] uppercase" style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Image Engine</p>
                                        <p className="text-[10px] text-gray-600 tracking-widest">Upload images to activate the swap &amp; forensics engine</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <UploadZone isDragActive={isDragActive} onDrag={handleDrag} onDrop={handleDrop} onFileSelect={handleFileSelect} />

                        <AnimatePresence>
                            {globalError && <ErrorDisplay message={globalError} onDismiss={() => setGlobalError(null)} />}
                        </AnimatePresence>

                        {items.length > 0 && (
                            <BatchToolbar
                                items={items}
                                onSmartAnalysisAll={() => items.forEach(i => processSmartAnalysis(i.id))}
                                onBatchProcess={processBatch}
                                onBatchEdit={processBatchEdit}
                                onClearAll={clearAll}
                            />
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
                                        onSmartAnalysis={processSmartAnalysis}
                                        onGeneratePrompt={handleGeneratePrompt}
                                        onClassifyStyle={handleClassifyStyle}
                                        onMakeHuman={handleMakeHuman}
                                        onFaceSwap={handleFaceSwap}
                                        onOutfitSwap={handleOutfitSwap}
                                        onDetectFaces={handleDetectFaces}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageAnalyzer;
