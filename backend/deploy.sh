#!/bin/bash

echo "========================================"
echo "  Sugar Diary Backend Deployment"
echo "========================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed!"
    echo "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "Step 1: Logging in to Google Cloud..."
gcloud auth login

echo ""
echo "Step 2: Setting project to 'sugerdiary'..."
gcloud config set project sugerdiary

echo ""
echo "Step 3: Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

echo ""
echo "Step 4: Building and deploying to Cloud Run..."
echo "This may take 5-10 minutes..."
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Your backend is now live!"
echo ""
echo "To get your API URL, run:"
echo "  gcloud run services describe sugar-diary-backend --region us-central1 --format=\"value(status.url)\""
echo ""
