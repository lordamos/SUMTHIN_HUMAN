import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../Spinner';

interface JobStats {
    counts: Record<string, number>;
    total_jobs: number;
    output_bytes: number;
    oldest_job_age_seconds: number | null;
    ttl_seconds: number;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatAge(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

const VideoSwapPanel: React.FC = () => {
    const [videoMode, setVideoMode] = useState<'video' | 'live'>('video');
    const [jobStats, setJobStats] = useState<JobStats | null>(null);
    const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/video-jobs/stats');
            if (res.ok) setJobStats(await res.json());
        } catch {
            // Non-critical — ignore silently
        }
    };

    useEffect(() => {
        fetchStats();
        statsIntervalRef.current = setInterval(fetchStats, 30_000);
        return () => {
            if (statsIntervalRef.current !== null) clearInterval(statsIntervalRef.current);
        };
    }, []);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
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

    // Job lookup state
    const [lookupOpen, setLookupOpen] = useState(false);
    const [lookupInput, setLookupInput] = useState('');
    const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'done' | 'running' | 'error' | 'cancelled' | 'not_found'>('idle');
    const [lookupDownloadUrl, setLookupDownloadUrl] = useState<string | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupProgress, setLookupProgress] = useState(0);
    const [lookupFrameInfo, setLookupFrameInfo] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const lookupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lookupBlobUrlRef = useRef<string | null>(null);

    const stopLookupPolling = () => {
        if (lookupPollRef.current !== null) {
            clearInterval(lookupPollRef.current);
            lookupPollRef.current = null;
        }
    };

    const setLookupBlobUrl = (url: string | null) => {
        if (lookupBlobUrlRef.current) {
            URL.revokeObjectURL(lookupBlobUrlRef.current);
        }
        lookupBlobUrlRef.current = url;
        setLookupDownloadUrl(url);
    };

    useEffect(() => {
        return () => {
            stopLookupPolling();
            if (lookupBlobUrlRef.current) URL.revokeObjectURL(lookupBlobUrlRef.current);
        };
    }, []);

    const startLookupPolling = (id: string) => {
        stopLookupPolling();
        lookupPollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/video-progress/${id}`);
                if (!res.ok) { stopLookupPolling(); setLookupStatus('not_found'); return; }
                const data = await res.json();
                setLookupProgress(data.progress ?? 0);
                setLookupFrameInfo({ current: data.frame ?? 0, total: data.total ?? 0 });
                if (data.status === 'done') {
                    stopLookupPolling();
                    setLookupStatus('done');
                    try {
                        const resultRes = await fetch(`/video-result/${id}`);
                        if (!resultRes.ok) throw new Error('Failed to fetch result.');
                        const blob = await resultRes.blob();
                        setLookupBlobUrl(URL.createObjectURL(blob));
                    } catch {
                        setLookupStatus('error');
                        setLookupError('Job finished but could not retrieve the file.');
                    }
                } else if (data.status === 'error') {
                    stopLookupPolling();
                    setLookupStatus('error');
                    setLookupError(data.error || 'Processing failed.');
                } else if (data.status === 'cancelled') {
                    stopLookupPolling();
                    setLookupStatus('cancelled');
                }
            } catch { /* transient network error — keep polling */ }
        }, 1500);
    };

    const handleLookup = async () => {
        const id = lookupInput.trim();
        if (!id) return;
        stopLookupPolling();
        setLookupStatus('loading');
        setLookupBlobUrl(null);
        setLookupError(null);
        setLookupProgress(0);
        setLookupFrameInfo({ current: 0, total: 0 });
        try {
            const res = await fetch(`/video-progress/${id}`);
            if (!res.ok) { setLookupStatus('not_found'); return; }
            const data = await res.json();
            setLookupProgress(data.progress ?? 0);
            setLookupFrameInfo({ current: data.frame ?? 0, total: data.total ?? 0 });
            if (data.status === 'done') {
                setLookupStatus('done');
                const resultRes = await fetch(`/video-result/${id}`);
                if (!resultRes.ok) { setLookupStatus('error'); setLookupError('Job finished but file could not be retrieved.'); return; }
                const blob = await resultRes.blob();
                setLookupBlobUrl(URL.createObjectURL(blob));
            } else if (data.status === 'running' || data.status === 'queued') {
                setLookupStatus('running');
                startLookupPolling(id);
            } else if (data.status === 'error') {
                setLookupStatus('error');
                setLookupError(data.error || 'Processing failed.');
            } else if (data.status === 'cancelled') {
                setLookupStatus('cancelled');
            } else {
                setLookupStatus('not_found');
            }
        } catch {
            setLookupStatus('not_found');
        }
    };

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
                    fetchStats();
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
                    fetchStats();
                } else if (data.status === 'error') {
                    stopPolling();
                    setIsProcessing(false);
                    setJobId(null);
                    setVideoError(data.error || 'Processing failed.');
                    fetchStats();
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
        setVideoThumbnail(null);
        setVideoDuration(null);
        setDownloadUrl(null);
        e.target.value = '';

        const url = URL.createObjectURL(file);
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.muted = true;
        vid.src = url;

        let captured = false;
        let urlRevoked = false;

        const cleanup = () => {
            if (!urlRevoked) {
                urlRevoked = true;
                URL.revokeObjectURL(url);
            }
        };

        const captureFrame = () => {
            if (captured) return;
            captured = true;
            const canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth || 320;
            canvas.height = vid.videoHeight || 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                setVideoThumbnail(canvas.toDataURL('image/jpeg', 0.7));
            }
            cleanup();
        };

        vid.addEventListener('loadedmetadata', () => {
            setVideoDuration(vid.duration);
            // Seek to a small positive offset to ensure 'seeked' fires in all browsers
            vid.currentTime = Math.min(0.1, vid.duration / 2);
        });

        vid.addEventListener('seeked', captureFrame, { once: true });

        // Fallback: capture on loadeddata in case seeked does not fire
        vid.addEventListener('loadeddata', captureFrame, { once: true });

        vid.addEventListener('error', cleanup, { once: true });
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
            fetchStats();
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
        fetchStats();
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

    const LONG_VIDEO_THRESHOLD_SECONDS = 5 * 60;
    const isLongVideo = videoDuration !== null && videoDuration > LONG_VIDEO_THRESHOLD_SECONDS;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="space-y-5">
            {jobStats !== null && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/8 text-[10px] font-mono">
                    <span className="text-gray-500 uppercase tracking-widest font-bold">Storage</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                        {jobStats.output_bytes > 0 ? formatBytes(jobStats.output_bytes) : '0 B'} on disk
                    </span>
                    {jobStats.total_jobs > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                            {jobStats.total_jobs} job{jobStats.total_jobs !== 1 ? 's' : ''}
                            {Object.entries(jobStats.counts).map(([s, n]) => (
                                <span key={s} className={`ml-1.5 ${s === 'running' ? 'text-emerald-400' : s === 'done' ? 'text-cyan-400' : s === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
                                    {n} {s}
                                </span>
                            ))}
                        </span>
                    )}
                    {jobStats.oldest_job_age_seconds !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                            oldest: {formatAge(jobStats.oldest_job_age_seconds)}
                        </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                        TTL {formatAge(jobStats.ttl_seconds)}
                    </span>
                    {jobStats.total_jobs === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">clean</span>
                    )}
                </div>
            )}
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
                            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 transition-all min-h-[120px] relative overflow-hidden ${isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400/60 hover:bg-black/30'}`}
                        >
                            <input ref={videoInputRef} type="file" className="hidden" accept="video/*" onChange={handleVideoSelect} />
                            {videoThumbnail ? (
                                <div className="relative w-full">
                                    <img
                                        src={videoThumbnail}
                                        alt="Video preview"
                                        className="w-full h-24 object-cover rounded-xl border border-emerald-400/30"
                                    />
                                    {videoDuration !== null && (
                                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white font-bold">
                                            {formatDuration(videoDuration)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-2xl">🎬</span>
                            )}
                            <span className="text-xs font-bold text-gray-400 truncate max-w-full px-1">{videoFile ? videoFile.name : 'Select video'}</span>
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

                    {isLongVideo && (
                        <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                            <span className="mt-0.5 flex-shrink-0">⚠️</span>
                            <span>
                                This video is <span className="font-bold">{formatDuration(videoDuration!)}</span> long. Processing may take a while — you can still proceed, but expect a longer wait.
                            </span>
                        </div>
                    )}

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
                            {jobId && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8">
                                    <span className="text-[10px] text-gray-500 shrink-0">Job ID</span>
                                    <span className="flex-1 font-mono text-[10px] text-gray-300 truncate">{jobId}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(jobId)}
                                        className="text-[10px] text-gray-500 hover:text-gray-200 transition-colors shrink-0"
                                        title="Copy job ID"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
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

                    {/* Job lookup — retrieve a previous result by ID */}
                    <div className="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
                        <button
                            onClick={() => {
                                setLookupOpen(o => !o);
                                if (lookupOpen) { stopLookupPolling(); setLookupStatus('idle'); setLookupInput(''); setLookupBlobUrl(null); setLookupError(null); }
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <span>🔍 Retrieve a previous job</span>
                            <span className="text-gray-600">{lookupOpen ? '▲' : '▼'}</span>
                        </button>

                        {lookupOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-3 pb-3 space-y-2.5"
                            >
                                <p className="text-[10px] text-gray-500">Paste your job ID below to check the status or download your result.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={lookupInput}
                                        onChange={e => setLookupInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                                        placeholder="e.g. abc123..."
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <button
                                        onClick={handleLookup}
                                        disabled={!lookupInput.trim() || lookupStatus === 'loading'}
                                        className="px-3 py-2 rounded-lg text-xs font-black border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                                    >
                                        {lookupStatus === 'loading' ? '…' : 'Check'}
                                    </button>
                                </div>

                                {lookupStatus === 'running' && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                                            <span className="flex items-center gap-1"><Spinner />Still processing…</span>
                                            <span className="font-mono text-emerald-300">{Math.round(lookupProgress * 100)}%{lookupFrameInfo.total > 0 && <span className="text-gray-500"> — {lookupFrameInfo.current}/{lookupFrameInfo.total}</span>}</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${Math.round(lookupProgress * 100)}%` }} transition={{ ease: 'linear', duration: 0.4 }} />
                                        </div>
                                    </div>
                                )}

                                {lookupStatus === 'done' && lookupDownloadUrl && (
                                    <motion.a
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        href={lookupDownloadUrl}
                                        download="face_swapped.mp4"
                                        className="block w-full py-2.5 rounded-xl text-xs font-black text-center border border-teal-400/50 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all"
                                    >
                                        ⬇️ Download Face-Swapped Video
                                    </motion.a>
                                )}

                                {lookupStatus === 'error' && (
                                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-400">
                                        {lookupError || 'This job encountered an error.'}
                                    </div>
                                )}

                                {lookupStatus === 'cancelled' && (
                                    <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-[10px] text-yellow-400">
                                        This job was cancelled.
                                    </div>
                                )}

                                {lookupStatus === 'not_found' && (
                                    <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400">
                                        No job found with that ID. It may have expired or the ID is incorrect.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
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
