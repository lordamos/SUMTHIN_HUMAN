#!/bin/bash
set -e

npm install --yes

pip install --quiet \
  opencv-python \
  moviepy \
  insightface \
  onnxruntime \
  flask-cors \
  flask \
  requests \
  numpy
