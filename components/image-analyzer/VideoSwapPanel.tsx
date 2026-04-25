import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../Spinner';

interface JobStats {
    counts: Record<string, number>;
    total_jobs: number;
    output_bytes: number;
    oldest_job_age_seconds: number | null;
    ttl_seconds: number;
    processing_fps?: number;
}

interface RecentJob {
    id: string;
    status: 'running' | 'done' | 'error' | 'cancelled' | 'unknown';
    timestamp: number;
}

const STORAGE_KEY_RECENT_JOBS = 'recentVideoJobIds';
const MAX_RECENT_JOBS = 5;

const VALID_STATUSES: ReadonlySet<RecentJob['status']> = new Set(['running', 'done', 'error', 'cancelled', 'unknown']);

function loadRecentJobs(): RecentJob[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_RECENT_JOBS);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (j): j is RecentJob =>
                j !== null &&
                typeof j === 'object' &&
                typeof j.id === 'string' &&
                j.id.length > 0 &&
                VALID_STATUSES.has(j.status) &&
                typeof j.timestamp === 'number'
        );
    } catch {
        return [];
    }
}

function saveRecentJobs(jobs: RecentJob[]): void {
    try {
        localStorage.setItem(STORAGE_KEY_RECENT_JOBS, JSON.stringify(jobs));
    } catch { /* ignore */ }
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
    const [isProcessing, setIsProcessing] = useState(false);

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
        const interval = isProcessing ? 1_000 : 30_000;
        statsIntervalRef.current = setInterval(fetchStats, interval);
        return () => {
            if (statsIntervalRef.current !== null) clearInterval(statsIntervalRef.current);
        };
    }, [isProcessing]);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [videoFps, setVideoFps] = useState<number | null>(null);
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [completedJobId, setCompletedJobId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [frameInfo, setFrameInfo] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null);

    const [liveActive, setLiveActive] = useState(false);
    const [liveFaceFile, setLiveFaceFile] = useState<File | null>(null);
    const [liveFacePreview, setLiveFacePreview] = useState<string | null>(null);
    const [liveError, setLiveError] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(true);
    const liveFaceInputRef = useRef<HTMLInputElement>(null);

    const liveVideoRef = useRef<HTMLVideoElement | null>(null);
    const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const liveWebcamDisplayRef = useRef<HTMLVideoElement | null>(null);
    const liveResultRef = useRef<HTMLImageElement | null>(null);
    const liveSessionRef = useRef<string | null>(null);
    const liveActiveRef = useRef<boolean>(false);
    const liveLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const liveMediaStreamRef = useRef<MediaStream | null>(null);

    // Long-video warning threshold (seconds). null = disabled.
    const STORAGE_KEY_THRESHOLD = 'videoWarningThresholdSeconds';
    const DEFAULT_THRESHOLD = 5 * 60;
    const [warningThreshold, setWarningThreshold] = useState<number | null>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_THRESHOLD);
            if (raw === 'disabled') return null;
            if (raw !== null) {
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed) && parsed > 0) return parsed;
            }
        } catch { /* ignore */ }
        return DEFAULT_THRESHOLD;
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const [exportCopied, setExportCopied] = useState(false);
    const [exportError, setExportError] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    const applyThreshold = (value: number | null) => {
        setWarningThreshold(value);
        try {
            if (value === null) {
                localStorage.setItem(STORAGE_KEY_THRESHOLD, 'disabled');
            } else {
                localStorage.setItem(STORAGE_KEY_THRESHOLD, String(value));
            }
        } catch { /* ignore */ }
    };

    const handleExportSettings = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_THRESHOLD);
            const blob = JSON.stringify({
                version: 1,
                [STORAGE_KEY_THRESHOLD]: raw ?? String(DEFAULT_THRESHOLD),
            }, null, 2);
            navigator.clipboard.writeText(blob).then(() => {
                setExportCopied(true);
                setExportError(false);
                setTimeout(() => setExportCopied(false), 2000);
            }).catch(() => {
                setExportError(true);
                setTimeout(() => setExportError(false), 3000);
            });
        } catch {
            setExportError(true);
            setTimeout(() => setExportError(false), 3000);
        }
    };

    const handleImportSettings = () => {
        setImportError(null);
        setImportSuccess(false);
        try {
            const parsed = JSON.parse(importText.trim());
            if (typeof parsed !== 'object' || parsed === null) {
                setImportError('Invalid settings — expected a JSON object.');
                return;
            }
            const raw = parsed[STORAGE_KEY_THRESHOLD];
            if (raw === undefined) {
                setImportError('No video settings found in this blob.');
                return;
            }
            if (raw === 'disabled') {
                applyThreshold(null);
            } else {
                const num = parseInt(String(raw), 10);
                if (isNaN(num) || num <= 0) {
                    setImportError('Invalid threshold value in settings.');
                    return;
                }
                applyThreshold(num);
            }
            setImportSuccess(true);
            setImportText('');
            setTimeout(() => setImportSuccess(false), 2500);
        } catch {
            setImportError('Could not parse settings — make sure you paste the full JSON blob.');
        }
    };

    const [recentJobs, setRecentJobs] = useState<RecentJob[]>(() => loadRecentJobs());

    const upsertRecentJob = (id: string, status: RecentJob['status']) => {
        setRecentJobs(prev => {
            const without = prev.filter(j => j.id !== id);
            const updated: RecentJob[] = [{ id, status, timestamp: Date.now() }, ...without].slice(0, MAX_RECENT_JOBS);
            saveRecentJobs(updated);
            return updated;
        });
    };

    const removeRecentJob = (id: string) => {
        setRecentJobs(prev => {
            const updated = prev.filter(j => j.id !== id);
            saveRecentJobs(updated);
            return updated;
        });
    };

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
            stopLiveStream();
        };
    }, []);

    const startLookupPolling = (id: string) => {
        stopLookupPolling();
        lookupPollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/video-progress/${id}`);
                if (!res.ok) { stopLookupPolling(); setLookupStatus('not_found'); removeRecentJob(id); return; }
                const data = await res.json();
                setLookupProgress(data.progress ?? 0);
                setLookupFrameInfo({ current: data.frame ?? 0, total: data.total ?? 0 });
                if (data.status === 'done') {
                    stopLookupPolling();
                    setLookupStatus('done');
                    upsertRecentJob(id, 'done');
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
                    upsertRecentJob(id, 'error');
                } else if (data.status === 'cancelled') {
                    stopLookupPolling();
                    setLookupStatus('cancelled');
                    upsertRecentJob(id, 'cancelled');
                }
            } catch { /* transient network error — keep polling */ }
        }, 1500);
    };

    const handleLookup = async (overrideId?: string) => {
        const id = (overrideId ?? lookupInput).trim();
        if (!id) return;
        if (overrideId) setLookupInput(overrideId);
        stopLookupPolling();
        setLookupStatus('loading');
        setLookupBlobUrl(null);
        setLookupError(null);
        setLookupProgress(0);
        setLookupFrameInfo({ current: 0, total: 0 });
        try {
            const res = await fetch(`/video-progress/${id}`);
            if (!res.ok) { setLookupStatus('not_found'); removeRecentJob(id); return; }
            const data = await res.json();
            setLookupProgress(data.progress ?? 0);
            setLookupFrameInfo({ current: data.frame ?? 0, total: data.total ?? 0 });
            if (data.status === 'done') {
                setLookupStatus('done');
                upsertRecentJob(id, 'done');
                const resultRes = await fetch(`/video-result/${id}`);
                if (!resultRes.ok) { setLookupStatus('error'); setLookupError('Job finished but file could not be retrieved.'); return; }
                const blob = await resultRes.blob();
                setLookupBlobUrl(URL.createObjectURL(blob));
            } else if (data.status === 'running' || data.status === 'queued') {
                setLookupStatus('running');
                upsertRecentJob(id, 'running');
                startLookupPolling(id);
            } else if (data.status === 'error') {
                setLookupStatus('error');
                setLookupError(data.error || 'Processing failed.');
                upsertRecentJob(id, 'error');
            } else if (data.status === 'cancelled') {
                setLookupStatus('cancelled');
                upsertRecentJob(id, 'cancelled');
            } else {
                setLookupStatus('not_found');
                removeRecentJob(id);
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
                if (data.source_fps && data.source_fps > 0) {
                    setVideoFps(data.source_fps);
                }

                if (data.status === 'done') {
                    stopPolling();
                    setIsProcessing(false);
                    setCompletedJobId(id);
                    setJobId(null);
                    upsertRecentJob(id, 'done');
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
                    upsertRecentJob(id, 'cancelled');
                    fetchStats();
                } else if (data.status === 'error') {
                    stopPolling();
                    setIsProcessing(false);
                    setJobId(null);
                    setVideoError(data.error || 'Processing failed.');
                    upsertRecentJob(id, 'error');
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
        setVideoFps(null);
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
        setCompletedJobId(null);
        setCopied(false);
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
            upsertRecentJob(job_id, 'running');
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
        upsertRecentJob(id, 'cancelled');
        // Fire-and-forget cancel request to stop the backend job
        fetch(`/video-cancel/${id}`, { method: 'DELETE' }).catch(() => {});
        fetchStats();
    };

    const stopLiveStream = () => {
        liveActiveRef.current = false;
        if (liveLoopRef.current !== null) {
            clearTimeout(liveLoopRef.current);
            liveLoopRef.current = null;
        }
        if (liveMediaStreamRef.current) {
            liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
            liveMediaStreamRef.current = null;
        }
        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }
        if (liveWebcamDisplayRef.current) {
            liveWebcamDisplayRef.current.srcObject = null;
        }
        if (liveResultRef.current && liveResultRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(liveResultRef.current.src);
            liveResultRef.current.src = '';
        }
        if (liveSessionRef.current) {
            fetch(`/webcam-swap/session?session=${liveSessionRef.current}`, { method: 'DELETE' }).catch(() => {});
            liveSessionRef.current = null;
        }
    };

    const handleLiveFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLiveFaceFile(file);
        setLiveFacePreview(URL.createObjectURL(file));
        stopLiveStream();
        setLiveActive(false);
        setLiveError(null);
        e.target.value = '';
    };

    const startCaptureLoop = (session: string) => {
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 8;

        const loop = async () => {
            if (!liveActiveRef.current) return;
            const video = liveVideoRef.current;
            const canvas = liveCanvasRef.current;
            if (!video || !canvas || video.readyState < 2) {
                if (liveActiveRef.current) liveLoopRef.current = setTimeout(loop, 100);
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
                if (!blob || !liveActiveRef.current) return;
                const fd = new FormData();
                fd.append('frame', blob, 'frame.jpg');
                try {
                    const res = await fetch(`/webcam-swap/frame?session=${session}`, { method: 'POST', body: fd });
                    if (res.ok && liveResultRef.current && liveActiveRef.current) {
                        const resultBlob = await res.blob();
                        const oldSrc = liveResultRef.current.src;
                        liveResultRef.current.src = URL.createObjectURL(resultBlob);
                        if (oldSrc && oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
                        consecutiveErrors = 0;
                    } else if (!res.ok) {
                        consecutiveErrors++;
                    }
                } catch {
                    consecutiveErrors++;
                }
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    stopLiveStream();
                    setLiveActive(false);
                    setLiveError('Lost connection to the server. Please try restarting the live stream.');
                    return;
                }
                if (liveActiveRef.current) liveLoopRef.current = setTimeout(loop, 0);
            }, 'image/jpeg', 0.8);
        };
        loop();
    };

    const handleStartLive = async () => {
        if (!liveFaceFile) return;
        setLiveError(null);
        try {
            const formData = new FormData();
            formData.append('face', liveFaceFile);
            const res = await fetch('/webcam-swap/session', { method: 'POST', body: formData });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Session error ${res.status}`);
            }
            const { session } = await res.json();
            liveSessionRef.current = session;

            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            liveMediaStreamRef.current = mediaStream;

            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = mediaStream;
                await new Promise<void>(resolve => {
                    const v = liveVideoRef.current!;
                    v.onloadedmetadata = () => resolve();
                });
                await liveVideoRef.current.play();
            }
            if (liveWebcamDisplayRef.current) {
                liveWebcamDisplayRef.current.srcObject = mediaStream;
                await liveWebcamDisplayRef.current.play().catch(() => {});
            }

            if (liveCanvasRef.current && liveVideoRef.current) {
                liveCanvasRef.current.width = liveVideoRef.current.videoWidth || 640;
                liveCanvasRef.current.height = liveVideoRef.current.videoHeight || 480;
            }

            liveActiveRef.current = true;
            setLiveActive(true);
            startCaptureLoop(session);
        } catch (err) {
            const name = err instanceof DOMException ? err.name : '';
            const msg = err instanceof Error ? err.message : 'Failed to start live stream.';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || /permission|denied|notallowed|not allowed/i.test(msg)) {
                setLiveError('Camera access denied. Please allow camera access in your browser and try again.');
            } else {
                setLiveError(msg);
            }
            stopLiveStream();
        }
    };

    const handleStopLive = () => {
        stopLiveStream();
        setLiveActive(false);
        setLiveError(null);
    };

    const pct = Math.round(progress * 100);

    const isLongVideo = warningThreshold !== null && videoDuration !== null && videoDuration > warningThreshold;

    const estimatedProcessingSeconds = (() => {
        if (!videoDuration || !jobStats?.processing_fps || jobStats.processing_fps <= 0) return null;
        const sourceFps = videoFps ?? 25;
        return Math.ceil((videoDuration * sourceFps) / jobStats.processing_fps);
    })();

    const formatEstimatedTime = (seconds: number): string => {
        if (seconds < 60) return `~${seconds}s`;
        const h = Math.floor(seconds / 3600);
        const m = Math.ceil((seconds % 3600) / 60);
        if (h > 0) return `~${h}h ${m}m`;
        return `~${m} min`;
    };

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
                                This video is <span className="font-bold">{formatDuration(videoDuration!)}</span> long.{' '}
                                {estimatedProcessingSeconds !== null
                                    ? <>Rough estimated processing time: <span className="font-bold">{formatEstimatedTime(estimatedProcessingSeconds)}</span> (may vary).</>
                                    : <>Processing may take a while.</>
                                }{' '}
                                You can still proceed, but expect a longer wait.
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

                    {completedJobId && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8"
                        >
                            <span className="text-[10px] text-gray-500 shrink-0">Job ID</span>
                            <span className="flex-1 font-mono text-[10px] text-gray-300 truncate">{completedJobId}</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(completedJobId).then(() => {
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }).catch(() => {});
                                }}
                                className="text-[10px] shrink-0 transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10"
                                style={{ color: copied ? '#34d399' : '#9ca3af' }}
                                title="Copy job ID"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </motion.div>
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
                                {recentJobs.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Recent jobs</p>
                                        {recentJobs.map(job => {
                                            const statusColor: Record<RecentJob['status'], string> = {
                                                done: 'text-cyan-400',
                                                running: 'text-emerald-400',
                                                error: 'text-red-400',
                                                cancelled: 'text-yellow-400',
                                                unknown: 'text-gray-500',
                                            };
                                            const statusLabel: Record<RecentJob['status'], string> = {
                                                done: 'done',
                                                running: 'running',
                                                error: 'error',
                                                cancelled: 'cancelled',
                                                unknown: '?',
                                            };
                                            const ageSeconds = (Date.now() - job.timestamp) / 1000;
                                            return (
                                                <div key={job.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8">
                                                    <span className={`text-[9px] font-bold uppercase shrink-0 ${statusColor[job.status]}`}>{statusLabel[job.status]}</span>
                                                    <span className="flex-1 font-mono text-[10px] text-gray-300 truncate">{job.id}</span>
                                                    <span className="text-[9px] text-gray-500 shrink-0">{formatAge(ageSeconds)} ago</span>
                                                    {job.status === 'done' && (
                                                        <a
                                                            href={`/video-result/${job.id}`}
                                                            download="face_swapped.mp4"
                                                            className="text-[10px] shrink-0 px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 hover:text-teal-200 transition-colors"
                                                        >
                                                            ⬇ Download
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => { if (!lookupOpen) setLookupOpen(true); handleLookup(job.id); }}
                                                        className="text-[10px] shrink-0 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => removeRecentJob(job.id)}
                                                        title="Dismiss"
                                                        className="text-[10px] shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                        onClick={() => handleLookup()}
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
                    {/* Warning threshold settings */}
                    <div className="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
                        <button
                            onClick={() => setSettingsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <span>⚙️ Video settings</span>
                            <span className="text-gray-600">{settingsOpen ? '▲' : '▼'}</span>
                        </button>

                        {settingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-3 pb-3 space-y-3"
                            >
                                <div>
                                    <p className="text-[10px] text-gray-500 mb-2">
                                        Long-video warning threshold — show a warning when the selected video exceeds this length.
                                        {warningThreshold !== null
                                            ? <span className="text-amber-400/80"> Currently: {formatDuration(warningThreshold)}</span>
                                            : <span className="text-gray-500"> Currently: disabled</span>
                                        }
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: 'Off', value: null },
                                            { label: '2 min', value: 2 * 60 },
                                            { label: '5 min', value: 5 * 60 },
                                            { label: '10 min', value: 10 * 60 },
                                            { label: '15 min', value: 15 * 60 },
                                            { label: '30 min', value: 30 * 60 },
                                        ].map(({ label, value }) => {
                                            const active = warningThreshold === value;
                                            const wouldWarn = value !== null && videoDuration !== null && videoDuration > value;
                                            const wouldNotWarn = value !== null && videoDuration !== null && videoDuration <= value;
                                            const inactiveStyle = wouldWarn
                                                    ? 'border-amber-500/30 bg-amber-500/8 text-amber-400/70 hover:text-amber-300 hover:border-amber-500/50'
                                                    : wouldNotWarn
                                                    ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400/70 hover:text-emerald-300 hover:border-emerald-500/50'
                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20';
                                            return (
                                                <button
                                                    key={label}
                                                    onClick={() => applyThreshold(value)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${active ? 'border-amber-500/60 bg-amber-500/20 text-amber-300' : inactiveStyle}`}
                                                >
                                                    {label}
                                                    {wouldWarn && (
                                                        <span title="Your video would trigger this warning" className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 inline-block" />
                                                    )}
                                                    {wouldNotWarn && (
                                                        <span title="Your video is within this limit" className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 inline-block" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {/* Live preview note */}
                                    <div className="mt-2">
                                        {videoDuration !== null && warningThreshold !== null ? (
                                            videoDuration > warningThreshold ? (
                                                <p className="text-[10px] text-amber-400/90">
                                                    ⚠ Your current video ({formatDuration(videoDuration)}) would trigger this warning.
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-emerald-400/90">
                                                    ✓ Your current video ({formatDuration(videoDuration)}) is within the {formatDuration(warningThreshold)} limit — no warning will appear.
                                                </p>
                                            )
                                        ) : videoDuration !== null && warningThreshold === null ? (
                                            <p className="text-[10px] text-gray-500">
                                                Warning is disabled — no alert will appear regardless of video length.
                                            </p>
                                        ) : warningThreshold !== null ? (
                                            <p className="text-[10px] text-gray-500">
                                                Videos over {formatDuration(warningThreshold)} will show a warning before processing.
                                                <span className="ml-1 text-amber-400/60">● would warn</span>
                                                <span className="ml-1.5 text-emerald-400/60">● within limit</span>
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-gray-500">
                                                Warning is disabled — pick a threshold to enable it.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={customMinutes}
                                        onChange={e => setCustomMinutes(e.target.value)}
                                        placeholder="Custom (min)"
                                        className="w-32 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                                    />
                                    <button
                                        onClick={() => {
                                            const mins = Math.min(999, Math.max(0.1, parseFloat(customMinutes)));
                                            if (!isNaN(mins) && mins > 0) {
                                                applyThreshold(Math.round(mins * 60));
                                                setCustomMinutes('');
                                            }
                                        }}
                                        disabled={!customMinutes || isNaN(parseFloat(customMinutes)) || parseFloat(customMinutes) <= 0}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all disabled:opacity-40"
                                    >
                                        Set
                                    </button>
                                </div>
                                <div className="border-t border-white/8 pt-3 space-y-2">
                                    <p className="text-[10px] text-gray-500">Export or import these settings as a JSON blob to carry them across browsers or share with teammates.</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleExportSettings}
                                            className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${exportError ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'}`}
                                        >
                                            {exportCopied ? '✓ Copied!' : exportError ? '⚠ Copy failed' : '📋 Export settings'}
                                        </button>
                                        <button
                                            onClick={() => { setImportOpen(o => !o); setImportError(null); setImportSuccess(false); setImportText(''); }}
                                            className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
                                        >
                                            📥 Import settings
                                        </button>
                                    </div>
                                    {importOpen && (
                                        <div className="space-y-2">
                                            <textarea
                                                value={importText}
                                                onChange={e => { setImportText(e.target.value); setImportError(null); setImportSuccess(false); }}
                                                placeholder='Paste your settings JSON here, e.g. {"version":1,"videoWarningThresholdSeconds":"300"}'
                                                rows={4}
                                                className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none font-mono"
                                            />
                                            {importError && (
                                                <p className="text-[10px] text-red-400">{importError}</p>
                                            )}
                                            {importSuccess && (
                                                <p className="text-[10px] text-emerald-400">✓ Settings applied successfully.</p>
                                            )}
                                            <button
                                                onClick={handleImportSettings}
                                                disabled={!importText.trim()}
                                                className="w-full px-3 py-1.5 rounded-lg text-[10px] font-black border border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-all disabled:opacity-40"
                                            >
                                                Apply imported settings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}

            {videoMode === 'live' && (
                <motion.div key="live-mode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                    <p className="text-xs text-gray-500 text-center">Stream your webcam feed with your face swapped in real time.</p>

                    {/* Hidden elements that must stay in the DOM at all times */}
                    <canvas ref={liveCanvasRef} className="hidden" />
                    <video ref={liveVideoRef} autoPlay playsInline muted className="hidden" />

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

                    {liveError && (
                        <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                            {liveError}
                        </div>
                    )}

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

                    {/* Live status bar + toggle — only shown while active */}
                    {liveActive && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[9px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block"></span>
                                LIVE
                            </span>
                            <button
                                onClick={() => setShowOriginal(v => !v)}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                            >
                                {showOriginal ? 'Hide original' : 'Show original'}
                            </button>
                        </div>
                    )}

                    {/* Inactive placeholder */}
                    {!liveActive && (
                        <div className="rounded-2xl overflow-hidden border border-rose-400/20 bg-black/40 min-h-[200px] flex items-center justify-center">
                            <p className="text-xs text-gray-600 py-8">Live preview will appear here when streaming starts</p>
                        </div>
                    )}

                    {/* Always-rendered panels — CSS controls visibility so refs stay stable */}
                    <div className={liveActive ? `grid gap-3 ${showOriginal ? 'grid-cols-2' : 'grid-cols-1'}` : 'hidden'}>
                        <div className={`rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col ${liveActive && showOriginal ? '' : 'hidden'}`}>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center py-1.5">Original</p>
                            <video
                                ref={liveWebcamDisplayRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full object-cover"
                            />
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-rose-400/20 bg-black/40 flex flex-col">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center py-1.5">Swapped</p>
                            <img
                                ref={liveResultRef}
                                alt="Live webcam face swap"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default VideoSwapPanel;
