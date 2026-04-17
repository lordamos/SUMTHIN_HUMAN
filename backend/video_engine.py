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

def process_video(video_path: str, source_img: np.ndarray,
                  output_path: str = None) -> str:
    """
    Process every frame of video_path, swap faces, write to output_path.
    Returns the output file path.
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

    if output_path is None:
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        output_path = tmp.name
        tmp.close()

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            swapped = swap_face_on_frame(frame, src_face)
            writer.write(swapped)
    finally:
        cap.release()
        writer.release()

    # Re-encode with ffmpeg via moviepy to ensure browser-compatible H.264
    try:
        from moviepy import VideoFileClip
        final_path = output_path.replace(".mp4", "_final.mp4")
        clip = VideoFileClip(output_path)
        clip.write_videofile(final_path, codec="libx264", audio=False,
                             logger=None, preset="ultrafast")
        clip.close()
        os.remove(output_path)
        return final_path
    except Exception:
        return output_path


# ---------------------------------------------------------------------------
# Webcam streaming helper (generator)
# ---------------------------------------------------------------------------

def webcam_swap_frames(source_img: np.ndarray, frame_skip: int = 2,
                       resize_w: int = 640, resize_h: int = 480):
    """
    Generator that yields JPEG-encoded frames from the default webcam,
    with face swap applied every `frame_skip` frames.
    Falls back to raw frames when InsightFace is unavailable.
    """
    if not face_engine.init():
        print("[video_engine] InsightFace not ready for webcam stream.")

    face_app = face_engine.get_face_app()
    faces_source = face_app.get(source_img) if face_app else []
    src_face = faces_source[0] if faces_source else None

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Webcam not available on this server.")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, resize_w)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resize_h)

    frame_count = 0
    last_swapped = None

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (resize_w, resize_h))
            frame_count += 1

            if src_face is not None and frame_count % frame_skip == 0:
                last_swapped = swap_face_on_frame(frame, src_face)

            output_frame = last_swapped if last_swapped is not None else frame

            _, buf = cv2.imencode(".jpg", output_frame,
                                  [cv2.IMWRITE_JPEG_QUALITY, 80])
            yield buf.tobytes()
    finally:
        cap.release()
