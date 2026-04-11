"""
Video Face Swap Engine
Reads uploaded video frame-by-frame, applies InsightFace face swap to each frame,
and rebuilds the output video using MoviePy.
"""
import cv2
import numpy as np
import os
import tempfile

# ---------------------------------------------------------------------------
# GPU / CPU context detection
# ---------------------------------------------------------------------------

def _get_ctx_id() -> int:
    """Return 0 if a CUDA-capable GPU is available, else -1 (CPU)."""
    try:
        import onnxruntime as ort
        providers = ort.get_available_providers()
        if "CUDAExecutionProvider" in providers:
            return 0
    except Exception:
        pass
    return -1


# ---------------------------------------------------------------------------
# InsightFace lazy init (reuses the same init logic from ai_edit_engine)
# ---------------------------------------------------------------------------

_face_app = None
_swapper = None
_ready = False


def _init():
    global _face_app, _swapper, _ready
    if _ready:
        return True
    try:
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model

        ctx_id = _get_ctx_id()
        _face_app = FaceAnalysis(name="buffalo_l",
                                 providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
                                 if ctx_id == 0 else ["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))

        model_path = os.path.join(os.path.expanduser("~"), ".insightface",
                                  "models", "inswapper_128.onnx")
        if not os.path.exists(model_path):
            _swapper = get_model("inswapper_128.onnx", download=True, download_zip=True)
        else:
            _swapper = get_model(model_path)

        _ready = True
        return True
    except Exception as e:
        print(f"[video_engine] InsightFace init failed: {e}")
        return False


# ---------------------------------------------------------------------------
# Core frame-swap helper
# ---------------------------------------------------------------------------

def swap_face_on_frame(frame_bgr: np.ndarray, src_face) -> np.ndarray:
    """Swap the first detected face in frame_bgr with src_face."""
    if _face_app is None or _swapper is None:
        return frame_bgr
    faces = _face_app.get(frame_bgr)
    if not faces:
        return frame_bgr
    result = frame_bgr.copy()
    result = _swapper.get(result, faces[0], src_face, paste_back=True)
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
    if not _init():
        raise RuntimeError("InsightFace not available.")

    # Get source face embedding
    faces_source = _face_app.get(source_img)
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
    if not _init():
        print("[video_engine] InsightFace not ready for webcam stream.")

    faces_source = _face_app.get(source_img) if _face_app else []
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
