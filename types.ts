
export enum AnalysisType {
  Text,
  Image,
}

export interface TextAnalysisItem {
  originalText: string;
  reason: string;
  context: string;
  suggestions: string[];
  confidenceScore: number;
}

export interface TextAnalysisResult {
  aiLikelihood: number;
  analysis: TextAnalysisItem[];
}

export interface ImageAnalysisItem {
  feature: string;
  reason: string;
  recommendation: string;
}

export interface CategoryScore {
  name: string;
  score: number;
}

export interface ImageAnalysisResult {
  aiLikelihood: number;
  categoryScores: CategoryScore[];
  analysis: ImageAnalysisItem[];
}

export interface ImageStyleResult {
  style: string;
  confidence: number;
  reasoning: string;
  alternates: string[];
}

export interface ColorInfo {
  hex: string;
  name: string;
  percentage: number;
}

export interface DominantColorsResult {
  colors: ColorInfo[];
}

export interface ImageTagsResult {
  subjects: string[];
  objects: string[];
  setting: string[];
  style: string[];
  colors: string[];
  composition: string[];
}

export interface WritingStyleProfile {
  description: string;
  tone: string;
  useContractions: 'yes' | 'no';
  complexity: 'simple' | 'complex';
  sample: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  result: TextAnalysisResult;
  timestamp: number;
}

export interface ImageDraftState {
  currentImage: string;
  history: string[];
  historyIndex: number;
  maskDataUrl?: string;
  timestamp: number;
}

export type CloudProvider = 'google-drive' | 'dropbox';

export interface CloudFile {
  id: string;
  name: string;
  type: string;
  size?: number;
  thumbnailUrl?: string;
  contentUrl?: string;
}
