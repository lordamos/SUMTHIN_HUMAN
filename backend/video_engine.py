"""
Video Face Swap Engine
Reads uploaded video frame-by-frame, applies InsightFace face swap to each frame,
and rebuilds the output video using MoviePy.

InsightFace initialization is delegated to face_engine.py so the model
is loaded only once and shared with ai_edit_engine.py.
"""
import cv2
import numpy as np
import os
import tempfile
import threading
from typing import Callable, Optional

import face_engine

# ---------------------------------------------------------------------------
# Core frame-swap helper
# ---------------------------------------------------------------------------

def swap_face_on_frame(frame_bgr: np.ndarray, src_face) -> np.ndarray:
    """Swap the first detected face in frame_bgr with src_face."""
    swapper = face_engine.get_swapper()
    if swapper is None:
        return frame_bgr
    faces = face_engine.get_faces(frame_bgr)
    if not faces:
        return frame_bgr
    result = frame_bgr.copy()
    result = swapper.get(result, faces[0], src_face, paste_back=True)
    return result


# ---------------------------------------------------------------------------
# Video face swap — main entry point
# ---------------------------------------------------------------------------

def process_video(
    video_path: str,
    source_img: np.ndarray,
    output_path: str = None,
    progress_callback: Optional[Callable[[int, int], None]] = None,
    cancel_event: Optional[threading.Event] = None,
    frame_skip: int = 2,
) -> str:
    """
    Process every frame of video_path, swap faces, write to output_path.
    Returns the output file path, or None if cancelled.

    frame_skip: run face detection + swap every `frame_skip` frames; frames
    in between reuse the last swapped result.  frame_skip=1 means every frame
    is processed (original behaviour); frame_skip=2 halves the work, etc.

    progress_callback(frame_num, total_frames) is called after every frame
    written, regardless of whether that frame was swapped or reused.
    cancel_event, when set, causes processing to stop early.
    """
    if not face_engine.init():
        raise RuntimeError("InsightFace not available.")

    face_app = face_engine.get_face_app()

    # Get source face embedding
    faces_source = face_app.get(source_img)
    if not faces_source:
        raise RuntimeError("No face detected in source image.")
    src_face = faces_source[0]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open video file.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

    if output_path is None:
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        output_path = tmp.name
        tmp.close()

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Clamp to a sane range so misconfiguration can't produce a broken video.
    frame_skip = max(1, int(frame_skip))

    cancelled = False
    frame_num = 0
    last_swapped: Optional[np.ndarray] = None
    try:
        while True:
            if cancel_event is not None and cancel_event.is_set():
                cancelled = True
                break
            ret, frame = cap.read()
            if not ret:
                break

            # Process this frame if it falls on a swap boundary; otherwise
            # reuse the previous result so face-less frames still look swapped.
            if (frame_num % frame_skip) == 0:
                last_swapped = swap_face_on_frame(frame, src_face)

            writer.write(last_swapped if last_swapped is not None else frame)
            frame_num += 1
            if progress_callback is not None:
                progress_callback(frame_num, total_frames)
    finally:
        cap.release()
        writer.release()

    if cancelled:
        # Remove partial output file
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception:
            pass
        return None

    # Skip re-encode if cancel was requested while frames were still writing
    if cancel_event is not None and cancel_event.is_set():
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception:
            pass
        return None

    # Re-encode with ffmpeg via moviepy to ensure browser-compatible H.264
    try:
        from moviepy import VideoFileClip
        silent_path = output_path.replace(".mp4", "_silent.mp4")
        clip = VideoFileClip(output_path)
        clip.write_videofile(silent_path, codec="libx264", audio=False,
                             logger=None, preset="ultrafast")
        clip.close()
        os.remove(output_path)

        # If cancel was signalled during re-encode, delete the finished file
        if cancel_event is not None and cancel_event.is_set():
            try:
                if os.path.exists(silent_path):
                    os.remove(silent_path)
            except Exception:
                pass
            return None

        # Mux audio from the original video into the re-encoded output.
        # Falls back to the silent file if the original has no audio track or
        # if ffmpeg is unavailable.
        final_path = output_path.replace(".mp4", "_final.mp4")
        try:
            import subprocess
            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", silent_path,   # processed video (no audio)
                    "-i", video_path,    # original upload (audio source)
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-map", "0:v:0",
                    "-map", "1:a:0",
                    "-shortest",
                    final_path,
                ],
                capture_output=True,
                timeout=120,
            )
            if result.returncode == 0 and os.path.exists(final_path):
                os.remove(silent_path)
            else:
                # Original had no audio or ffmpeg failed — use the silent file
                os.rename(silent_path, final_path)
        except Exception:
            # ffmpeg not available or timed out — use the silent file
            if os.path.exists(silent_path):
                os.rename(silent_path, final_path)

        return final_path
    except Exception:
        return output_path

