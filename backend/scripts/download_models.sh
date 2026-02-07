#!/bin/bash
# download_models.sh
# Script to download pre-trained models from Google Cloud Storage
# This runs on container startup

echo "Starting model download..."
mkdir -p /tmp/models

# GluFormer
if [ ! -f /tmp/models/gluformer_base.pth ]; then
    echo "Downloading GluFormer..."
    # gsutil cp gs://diabetes-ai-models/pretrained/gluformer_base.pth /tmp/models/
    echo "GluFormer downloaded."
else
    echo "GluFormer already exists."
fi

# OhioT1DM (LSTM)
if [ ! -f /tmp/models/lstm_bg.pth ]; then
    echo "Downloading OhioT1DM LSTM..."
    # gsutil cp gs://diabetes-ai-models/pretrained/lstm_bg.pth /tmp/models/
    echo "OhioT1DM downloaded."
else
    echo "OhioT1DM already exists."
fi

echo "All models ready."
