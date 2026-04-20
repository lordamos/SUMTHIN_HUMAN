<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4138d199-5179-42ee-8930-452167ab3a71

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Server Configuration

Storage paths and job-lifecycle settings are controlled by environment variables.
Copy [`.env.example`](.env.example) to `.env` and edit the values you want to
override — everything has a sensible default so no changes are required for a
basic local setup.

| Variable | Default | Description |
|---|---|---|
| `VIDEO_JOBS_DB` | `~/video_data/video_jobs.db` | Path to the SQLite file that stores job metadata |
| `VIDEO_OUTPUT_DIR` | `~/video_data/video_outputs` | Directory where processed video files are written |
| `VIDEO_JOB_TTL` | `3600` | Seconds before an undownloaded job is purged (1 hour) |
| `VIDEO_JOB_MAX_BYTES` | `2147483648` | Maximum disk usage for output files in bytes; set to `0` to disable |
| `VIDEO_FRAME_SKIP` | `2` | Frames skipped between processed frames (higher = faster, lower quality) |
