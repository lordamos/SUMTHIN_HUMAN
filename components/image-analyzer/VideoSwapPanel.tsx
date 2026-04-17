import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../Spinner';

const VideoSwapPanel: React.FC = () => {
    const [videoMode, setVideoMode] = useState<'video' | 'live'>('video');

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [frameInfo, setFrameInfo] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null);

    const [liveActive, setLiveActive] = useState(false);
    const [liveFaceFile, setLiveFaceFile] = useState<File | null>(null);
    const [liveFacePreview, setLiveFacePreview] = useState<string | null>(null);
    const [liveStreamUrl, setLiveStreamUrl] = useState<string | null>(null);
    const liveFaceInputRef = useRef<HTMLInputElement>(null);

    const stopPolling = () => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const startPolling = (id: string) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/video-progress/${id}`);
                if (!res.ok) return;
                const data = await res.json();

                setProgress(data.progress ?? 0);
                setFrameInfo({ current: data.frame ?? 0, total: data.total ?? 0 });

                if (data.status === 'done') {
                    stopPolling();
                    setIsProcessing(false);
                    setJobId(null);
                    // Fetch the result video
                    try {
                        const resultRes = await fetch(`/video-result/${id}`);
                        if (!resultRes.ok) {
                            const errData = await resultRes.json().catch(() => ({}));
                            throw new Error(errData.error || 'Failed to fetch result.');
                        }
                        const blob = await resultRes.blob();
                        setDownloadUrl(URL.createObjectURL(blob));
                    } catch (err) {
                        setVideoError(err instanceof Error ? err.message : 'Could not retrieve result video.');
                    }
                } else if (data.status === 'cancelled') {
                    stopPolling();
                    setIsProcessing(false);
                    setJobId(null);
                    setProgress(0);
                    setFrameInfo({ current: 0, total: 0 });
                } else if (data.status === 'error') {
                    stopPolling();
                    setIsProcessing(false);
                    setJobId(null);
                    setVideoError(data.error || 'Processing failed.');
                }
            } catch {
                // Transient network error — keep polling
            }
        }, 1000);
    };

    const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFaceFile(file);
        setFacePreview(URL.createObjectURL(file));
        setDownloadUrl(null);
        e.target.value = '';
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(file);
        setDownloadUrl(null);
        e.target.value = '';
    };

    const handleSubmitVideo = async () => {
        if (!videoFile || !faceFile) {
            setVideoError('Please select both a video and a face image.');
            return;
        }
        setIsProcessing(true);
        setVideoError(null);
        setDownloadUrl(null);
        setProgress(0);
        setFrameInfo({ current: 0, total: 0 });

        try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('face', faceFile);
            const res = await fetch('/video-face-swap', { method: 'POST', body: formData });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Server error ${res.status}`);
            }
            const { job_id } = await res.json();
            setJobId(job_id);
            startPolling(job_id);
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'Video face swap failed.');
            setIsProcessing(false);
        }
    };

    const handleCancel = (cancelledJobId?: string) => {
        const id = cancelledJobId ?? jobId;
        if (!id) return;
        // Stop polling and reset UI immediately — don't wait for the backend
        stopPolling();
        setIsProcessing(false);
        setJobId(null);
        setProgress(0);
        setFrameInfo({ current: 0, total: 0 });
        // Fire-and-forget cancel request to stop the backend job
        fetch(`/video-cancel/${id}`, { method: 'DELETE' }).catch(() => {});
    };

    const handleLiveFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLiveFaceFile(file);
        setLiveFacePreview(URL.createObjectURL(file));
        setLiveActive(false);
        setLiveStreamUrl(null);
        e.target.value = '';
    };

    const handleStartLive = async () => {
        if (!liveFaceFile) return;
        try {
            const formData = new FormData();
            formData.append('face', liveFaceFile);
            const res = await fetch('/webcam-swap/session', { method: 'POST', body: formData });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Session error ${res.status}`);
            }
            const { session } = await res.json();
            setLiveStreamUrl(`/webcam-swap?session=${session}`);
            setLiveActive(true);
        } catch (err) {
            console.error('Failed to start live session:', err);
        }
    };

    const handleStopLive = () => {
        setLiveActive(false);
        setLiveStreamUrl(null);
    };

    const pct = Math.round(progress * 100);

    return (
        <div className="space-y-5">
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <button
                    onClick={() => { setVideoMode('video'); handleStopLive(); }}
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${videoMode === 'video' ? 'bg-emerald-500/25 text-emerald-300 border-r border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    🎬 Video
                </button>
                <button
                    onClick={() => setVideoMode('live')}
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${videoMode === 'live' ? 'bg-rose-500/25 text-rose-300' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    📡 Live
                </button>
            </div>

            {videoMode === 'video' && (
                <motion.div key="video-mode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                    <p className="text-xs text-gray-500 text-center">Upload a video + a face image to get a face-swapped output video.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                            onClick={() => !isProcessing && videoInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 transition-all min-h-[120px] ${isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400/60 hover:bg-black/30'}`}
                        >
                            <input ref={videoInputRef} type="file" className="hidden" accept="video/*" onChange={handleVideoSelect} />
                            <span className="text-2xl">🎬</span>
                            <span className="text-xs font-bold text-gray-400">{videoFile ? videoFile.name : 'Select video'}</span>
                            {videoFile && <span className="text-[10px] text-emerald-400 font-bold">✓ Ready</span>}
                        </div>

                        <div
                            onClick={() => !isProcessing && faceInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 transition-all min-h-[120px] relative overflow-hidden ${isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-pink-400/60 hover:bg-black/30'}`}
                        >
                            <input ref={faceInputRef} type="file" className="hidden" accept="image/*" onChange={handleFaceSelect} />
                            {facePreview ? (
                                <img src={facePreview} alt="Source face" className="w-16 h-16 rounded-full object-cover border-2 border-pink-400/50" />
                            ) : (
                                <span className="text-2xl">👤</span>
                            )}
                            <span className="text-xs font-bold text-gray-400">{faceFile ? faceFile.name : 'Select source face'}</span>
                            {faceFile && <span className="text-[10px] text-pink-400 font-bold">✓ Ready</span>}
                        </div>
                    </div>

                    {videoError && (
                        <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">{videoError}</div>
                    )}

                    {/* Progress bar — shown during processing */}
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Spinner />
                                    Processing…
                                </span>
                                <span className="font-mono text-emerald-300 font-bold">
                                    {pct}%
                                    {frameInfo.total > 0 && (
                                        <span className="text-gray-500 font-normal ml-1">
                                            — frame {frameInfo.current} / {frameInfo.total}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                    style={{ width: `${pct}%` }}
                                    transition={{ ease: 'linear', duration: 0.4 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmitVideo}
                            disabled={isProcessing || !videoFile || !faceFile}
                            className="flex-1 py-3 rounded-xl text-sm font-black border border-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.12))' }}
                        >
                            {isProcessing ? 'Processing…' : '🚀 Swap Faces in Video'}
                        </button>

                        {isProcessing && (
                            <button
                                onClick={() => handleCancel()}
                                className="px-4 py-3 rounded-xl text-sm font-black border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all flex items-center gap-2"
                            >
                                ✕ Cancel
                            </button>
                        )}
                    </div>

                    {downloadUrl && (
                        <motion.a
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            href={downloadUrl}
                            download="face_swapped.mp4"
                            className="block w-full py-3 rounded-xl text-sm font-black text-center border border-teal-400/50 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all"
                        >
                            ⬇️ Download Face-Swapped Video
                        </motion.a>
                    )}
                </motion.div>
            )}

            {videoMode === 'live' && (
                <motion.div key="live-mode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                    <p className="text-xs text-gray-500 text-center">Stream your webcam feed with your face swapped in real time.</p>

                    <div
                        onClick={() => liveFaceInputRef.current?.click()}
                        className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-rose-400/60 hover:bg-black/30 transition-all"
                    >
                        <input ref={liveFaceInputRef} type="file" className="hidden" accept="image/*" onChange={handleLiveFaceSelect} />
                        {liveFacePreview ? (
                            <img src={liveFacePreview} alt="Live source face" className="w-14 h-14 rounded-full object-cover border-2 border-rose-400/50 flex-shrink-0" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-gray-300">{liveFaceFile ? liveFaceFile.name : 'Select source face image'}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">This face will replace yours in the live stream</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleStartLive}
                            disabled={!liveFaceFile || liveActive}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {liveActive ? '📡 Streaming...' : '▶ Start Live'}
                        </button>
                        <button
                            onClick={handleStopLive}
                            disabled={!liveActive}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black border border-gray-500/30 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-all disabled:opacity-40"
                        >
                            ■ Stop
                        </button>
                    </div>

                    {liveActive && liveStreamUrl && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl overflow-hidden border border-rose-400/20 bg-black/40 relative"
                        >
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[9px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block"></span>
                                LIVE
                            </div>
                            <img
                                src={liveStreamUrl}
                                alt="Live webcam face swap"
                                className="w-full rounded-2xl"
                                onError={() => { setLiveActive(false); setLiveStreamUrl(null); }}
                            />
                        </motion.div>
                    )}

                    {!liveActive && (
                        <div className="flex items-center justify-center py-8 rounded-2xl border border-dashed border-white/5 bg-black/20">
                            <p className="text-xs text-gray-600">Live preview will appear here when streaming starts</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default VideoSwapPanel;
