# HayL3ditor — AI Forensics & Image/Video Transformation Platform

## Architecture

### Frontend (React + Vite, port 5000)
- `App.tsx` — Main app shell with tab navigation (Text Analyzer / Image Analyzer)
- `components/ImageAnalyzer.tsx` — Image batch processing with:
  - **Image Mode** — Upload images, analyze, describe, tag, face swap, outfit swap, batch edit
  - **Video & Live Mode** — Video face swap + real-time webcam face swap
- `components/TextAnalyzer.tsx` — Text humanizer + AI detection
- `components/ImageEditor.tsx` — Magic editor (Gemini-powered)
- `components/CloudPicker.tsx` — Google Drive / Dropbox import
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
  - `/webcam-swap` — Live MJPEG webcam stream with face swap
- `backend/ai_edit_engine.py` — InsightFace engine (face swap, outfit swap, realism boost)
- `backend/video_engine.py` — Video face swap engine (OpenCV + MoviePy)

## Key Features
- InsightFace face swap with GPU auto-detection (falls back to CPU)
- Frame-by-frame video processing with MoviePy re-encode to H.264
- Live webcam streaming with frame-skip (every 2nd frame) + 640×480 resize
- Gemini image analysis, description, tag generation, style classification
- Batch image processing, AI forensics scoring
- Cloud import (Google Drive, Dropbox)

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
