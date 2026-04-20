# HayL3ditor — AI Forensics & Image/Video Transformation Platform

## Architecture

### Frontend (React + Vite, port 5000)
- `App.tsx` — Main app shell with tab navigation (Text Analyzer / Image Analyzer)
- `components/ImageAnalyzer.tsx` — Image batch processing with:
  - **Image Mode** — Upload images, analyze, describe, tag, face swap, outfit swap, batch edit
  - **Video & Live Mode** — Video face swap + real-time webcam face swap
  - **Generate Mode** — AI image & video generation via Replicate API
- `components/TextAnalyzer.tsx` — Text humanizer + AI detection
- `components/ImageEditor.tsx` — Magic editor (Gemini-powered)
- `components/image-analyzer/` — Image sub-components:
  - `BatchItemCard.tsx` — Per-image card (analysis, face/outfit swap, filters, studio)
  - `VideoSwapPanel.tsx` — Video face swap + live webcam swap UI
  - `ImageInspector.tsx` — Zoomable/pannable image viewer
  - `DetailedAnalysisItem.tsx` — Expandable analysis result row
  - `ColorPaletteView.tsx` — Dominant color swatches
  - `TagsView.tsx` — Categorized tag chips
  - `types.ts` — BatchItem, BatchItemCardProps, filter maps
- `components/text-analyzer/` — Text sub-components:
  - `AnalysisCard.tsx` — Per-snippet forensic reasoning + suggestions
  - `CorrectedTextView.tsx` — Diff-highlighted humanized text
  - `RephrasedGptResultsView.tsx` — List of GPT rephrase options
  - `TTSButton.tsx` — Play/stop audio button
  - `audioUtils.ts` — Base64 decode + PCM→AudioBuffer conversion
- `services/geminiService.ts` — All Gemini API calls (analysis, edit, tags, prompts)

### Backend (Flask, port 8000)
- `backend/app.py` — Flask routes:
  - `/humanize` — Text humanization
  - `/detect-face`, `/detect-faces` — Face detection (MediaPipe / InsightFace)
  - `/segment-body` — Body segmentation (MediaPipe)
  - `/precision-edit` — Enhanced edit prompt with spatial context
  - `/face-swap`, `/face-swap-multi` — InsightFace face swap
  - `/outfit-swap` — Texture or AI-prompt outfit swap
  - `/video-face-swap` — Frame-by-frame video face swap (returns .mp4)
  - `/webcam-swap/session` — Create/delete browser webcam session for live face swap
  - `/webcam-swap/frame` — Single-frame face swap (POST JPEG, returns JPEG)
  - `/generate/image` — Text-to-image via Replicate (flux-schnell)
  - `/generate/video` — Text-to-video via Replicate (wan-2.1-t2v-480p), async
  - `/generate/video/<job_id>` — Poll video generation status
- `backend/ai_edit_engine.py` — InsightFace engine (face swap, outfit swap, realism boost)
- `backend/video_engine.py` — Video face swap engine (OpenCV + MoviePy)

## Key Features
- InsightFace face swap with GPU auto-detection (falls back to CPU)
- Frame-by-frame video processing with MoviePy re-encode to H.264
- Live webcam streaming with frame-skip (every 2nd frame) + 640×480 resize
- Gemini image analysis, description, tag generation, style classification
- Batch image processing, AI forensics scoring
- Cloud export (Google Drive, Dropbox) from image batch panel

## Dependencies
### Python
- flask, flask-cors, requests
- opencv-python, insightface, onnxruntime
- moviepy (video processing)
- mediapipe (body/face segmentation)
- pillow, numpy

### System
- ffmpeg (video encoding)
- xorg.libxcb, xorg.libX11 (OpenCV display libs)

### Node
- react, react-dom, framer-motion, lucide-react
- @google/genai (Gemini SDK)
- vite, typescript
