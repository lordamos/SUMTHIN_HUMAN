import type { ImageAnalysisResult, ImageTagsResult, ImageDraftState, DominantColorsResult, CloudProvider, ImageStyleResult } from '../../types';

export type LoadingAction = 'analyze' | 'describe' | 'tag' | 'color' | 'smart' | 'edit-bg' | 'edit-watermark' | 'edit-upscale' | 'cloud' | 'prompt' | 'style' | 'make-human' | 'face-swap' | 'face-swap-multi' | 'outfit-swap' | 'detect-faces' | null;

export interface BatchItem {
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
    detectedFaces?: { index: number; bbox: [number, number, number, number] }[];
    imgOrigDims?: { w: number; h: number };
}

export interface BatchItemCardProps {
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
    onFaceSwap: (id: string, sourceB64: string, faceIndices: number[], model: string) => void;
    onOutfitSwap: (id: string, textureOrPrompt: string, mode: 'texture' | 'ai', model: string) => void;
    onDetectFaces: (id: string) => void;
}

export const filters = [
    { id: 'none', name: 'None' },
    { id: 'grayscale', name: 'Grayscale' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'invert', name: 'Invert' },
];

export const filterClasses: { [key: string]: string } = {
    grayscale: 'grayscale',
    sepia: 'sepia',
    invert: 'invert',
    none: '',
};
