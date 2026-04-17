"""
Shared InsightFace engine — single initialization point for face detection
and face swapping, used by ai_edit_engine.py and video_engine.py.

Both modules previously duplicated this logic; all InsightFace state now
lives here so there is exactly one copy of the model in memory.
"""
import os

# ---------------------------------------------------------------------------
# GPU / CPU context detection
# ---------------------------------------------------------------------------

def _get_ctx_id() -> int:
    """Return 0 if a CUDA-capable GPU is available, else -1 (CPU)."""
    try:
        import onnxruntime as ort
        if "CUDAExecutionProvider" in ort.get_available_providers():
            return 0
    except Exception:
        pass
    return -1


# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------

_face_app = None
_swapper = None
_ready = False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def init() -> bool:
    """Lazily initialize InsightFace. Returns True when ready."""
    global _face_app, _swapper, _ready
    if _ready:
        return True
    try:
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model

        ctx_id = _get_ctx_id()
        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if ctx_id == 0
            else ["CPUExecutionProvider"]
        )

        _face_app = FaceAnalysis(name="buffalo_l", providers=providers)
        _face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))

        model_path = os.path.join(
            os.path.expanduser("~"), ".insightface", "models", "inswapper_128.onnx"
        )
        if not os.path.exists(model_path):
            _swapper = get_model("inswapper_128.onnx", download=True, download_zip=True)
        else:
            _swapper = get_model(model_path)

        _ready = True
        return True
    except Exception as e:
        print(f"[face_engine] InsightFace init failed: {e}")
        return False


def get_faces(image_bgr):
    """Return InsightFace face objects detected in *image_bgr* (BGR numpy array)."""
    if _face_app is None:
        return []
    return _face_app.get(image_bgr)


def get_swapper():
    """Return the loaded inswapper model, or None if not ready."""
    return _swapper


def get_face_app():
    """Return the FaceAnalysis app instance, or None if not ready."""
    return _face_app
