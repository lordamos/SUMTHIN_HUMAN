import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImages } from '../../services/geminiService';

type GenMode = 'image' | 'video';

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
}

interface VideoJob {
    jobId: string;
    prompt: string;
    status: 'starting' | 'processing' | 'done' | 'error';
    videoUrl: string | null;
    errorMsg: string | null;
}

const Spinner: React.FC<{ small?: boolean }> = ({ small }) => (
    <svg className={`animate-spin ${small ? 'w-3 h-3' : 'w-4 h-4'}`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
);


const GeneratePanel: React.FC = () => {
    const [genMode, setGenMode] = useState<GenMode>('image');

    const [imgPrompt, setImgPrompt] = useState('');
    const [numOutputs, setNumOutputs] = useState(1);
    const [imgLoading, setImgLoading] = useState(false);
    const [imgError, setImgError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
    const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopVideoPoll = () => {
        if (videoPollRef.current !== null) {
            clearInterval(videoPollRef.current);
            videoPollRef.current = null;
        }
    };

    const handleGenerateImage = async () => {
        if (!imgPrompt.trim()) return;
        setImgLoading(true);
        setImgError(null);
        try {
            const dataUrls = await generateImages(imgPrompt.trim(), numOutputs);
            const newImages: GeneratedImage[] = dataUrls.map(url => ({
                id: Math.random().toString(36).slice(2),
                url,
                prompt: imgPrompt.trim(),
                timestamp: Date.now(),
            }));
            setGeneratedImages(prev => [...newImages, ...prev]);
        } catch (err) {
            setImgError(err instanceof Error ? err.message : 'Image generation failed.');
        } finally {
            setImgLoading(false);
        }
    };

    const pollVideoStatus = (jobId: string) => {
        stopVideoPoll();
        videoPollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/generate/video/${jobId}`);
                const data = await res.json();
                if (!res.ok) {
                    stopVideoPoll();
                    setVideoJob(prev => prev ? { ...prev, status: 'error', errorMsg: data.error || 'Unknown error' } : null);
                    return;
                }
                const status = data.status;
                if (status === 'succeeded') {
                    stopVideoPoll();
                    setVideoJob(prev => prev ? { ...prev, status: 'done', videoUrl: data.url } : null);
                    setVideoLoading(false);
                } else if (status === 'failed' || status === 'canceled') {
                    stopVideoPoll();
                    setVideoJob(prev => prev ? { ...prev, status: 'error', errorMsg: data.error || 'Video generation failed.' } : null);
                    setVideoLoading(false);
                } else {
                    setVideoJob(prev => prev ? { ...prev, status: status === 'starting' ? 'starting' : 'processing' } : null);
                }
            } catch {
                // network hiccup — keep polling
            }
        }, 4000);
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt.trim()) return;
        stopVideoPoll();
        setVideoLoading(true);
        setVideoError(null);
        setVideoJob(null);
        try {
            const res = await fetch('/generate/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: videoPrompt.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
            const job: VideoJob = {
                jobId: data.job_id,
                prompt: videoPrompt.trim(),
                status: 'starting',
                videoUrl: null,
                errorMsg: null,
            };
            setVideoJob(job);
            pollVideoStatus(data.job_id);
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'Failed to start video generation.');
            setVideoLoading(false);
        }
    };

    const handleDownloadImage = (url: string, index: number) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-4">
            <div className="flex rounded-2xl overflow-hidden border border-white/[0.07] bg-black/30 p-1 gap-1">
                <button
                    onClick={() => setGenMode('image')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${genMode === 'image' ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    🖼 Image
                </button>
                <button
                    onClick={() => setGenMode('video')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${genMode === 'video' ? 'bg-orange-500/25 text-orange-300 border border-orange-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    🎬 Video
                </button>
            </div>

            <AnimatePresence mode="wait">
                {genMode === 'image' && (
                    <motion.div key="img-gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prompt</label>
                            <textarea
                                value={imgPrompt}
                                onChange={e => setImgPrompt(e.target.value)}
                                placeholder="Describe the image you want to create…"
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-fuchsia-500/50 resize-none"
                                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerateImage(); }}
                            />
                            <p className="text-[9px] text-gray-600 mt-1">Powered by Gemini · Free · ~5-10 seconds per image</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Number of Images</label>
                            <div className="flex gap-1.5">
                                {[1, 2, 4].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setNumOutputs(n)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${numOutputs === n ? 'border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-300' : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {imgError && (
                            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">{imgError}</div>
                        )}

                        <button
                            onClick={handleGenerateImage}
                            disabled={imgLoading || !imgPrompt.trim()}
                            className="w-full py-3 rounded-xl text-sm font-black border border-fuchsia-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.2), rgba(168,85,247,0.12))' }}
                        >
                            {imgLoading ? <><Spinner small /> Generating…</> : '✨ Generate Image'}
                        </button>

                        {generatedImages.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Results</p>
                                <div className={`grid gap-3 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <AnimatePresence>
                                        {generatedImages.map((img, i) => (
                                            <motion.div
                                                key={img.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40"
                                            >
                                                <img src={img.url} alt={img.prompt} className="w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadImage(img.url, i)}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                                    >
                                                        ⬇ Download
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(img.url, '_blank')}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                                    >
                                                        ↗ Open
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {generatedImages.length === 0 && !imgLoading && (
                            <div className="flex items-center justify-center py-10 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                <p className="text-xs text-gray-600">Generated images will appear here</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {genMode === 'video' && (
                    <motion.div key="vid-gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prompt</label>
                            <textarea
                                value={videoPrompt}
                                onChange={e => setVideoPrompt(e.target.value)}
                                placeholder="Describe the video you want to create… (e.g. A cinematic shot of a wolf running through a snowy forest)"
                                rows={4}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                            />
                            <p className="text-[9px] text-gray-600 mt-1">Powered by Wan 2.1 · 480p · ~1-3 min to generate</p>
                        </div>

                        {videoError && (
                            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">{videoError}</div>
                        )}

                        <button
                            onClick={handleGenerateVideo}
                            disabled={videoLoading || !videoPrompt.trim()}
                            className="w-full py-3 rounded-xl text-sm font-black border border-orange-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,179,8,0.12))' }}
                        >
                            {videoLoading ? <><Spinner small /> Working…</> : '🎬 Generate Video'}
                        </button>

                        {videoJob && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                {(videoJob.status === 'starting' || videoJob.status === 'processing') && (
                                    <div className="px-4 py-4 rounded-2xl border border-orange-400/20 bg-black/30 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-orange-300">
                                            <Spinner small />
                                            <span>{videoJob.status === 'starting' ? 'Starting generation…' : 'Generating video…'}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">This usually takes 1–3 minutes. You can leave and come back.</p>
                                        <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400"
                                                animate={{ width: ['20%', '80%', '20%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {videoJob.status === 'done' && videoJob.videoUrl && (
                                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                                        <video
                                            src={videoJob.videoUrl}
                                            controls
                                            autoPlay
                                            loop
                                            className="w-full rounded-2xl border border-orange-400/20 bg-black"
                                        />
                                        <a
                                            href={videoJob.videoUrl}
                                            download="generated-video.mp4"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-2.5 rounded-xl text-xs font-black text-center border border-orange-400/50 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all"
                                        >
                                            ⬇ Download Video
                                        </a>
                                    </motion.div>
                                )}

                                {videoJob.status === 'error' && (
                                    <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                                        {videoJob.errorMsg || 'Video generation failed.'}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {!videoJob && !videoLoading && (
                            <div className="flex items-center justify-center py-10 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                <p className="text-xs text-gray-600">Generated video will appear here</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GeneratePanel;
