import type { TextAnalysisResult } from '../../types';

export type BatchResult = TextAnalysisResult & { fileName: string };
export type LoadingAction = 'analyze' | 'improve' | 'tone' | 'humanize' | 'predict' | 'audio' | 'cloud' | null;
