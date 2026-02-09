# Backend Deployment Guide - Google Cloud Run

## 🎯 Overview

This guide walks you through deploying the FastAPI backend to Google Cloud Run. The deployment is optimized for the **free tier** and includes automatic scaling.

---

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled (free tier available)
2. **gcloud CLI** installed: [Install Guide](https://cloud.google.com/sdk/docs/install)
3. **Firebase Project** already created (you have: `sugerdiary`)

---

## 🚀 Deployment Steps

### Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (use your existing Firebase project)
gcloud config set project sugerdiary

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com
```

### Step 2: Create Service Account

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create sugar-diary-backend \
  --display-name="Sugar Diary Backend Service"

# Grant Firestore access
gcloud projects add-iam-policy-binding sugerdiary \
  --member="serviceAccount:sugar-diary-backend@sugerdiary.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Grant Cloud Storage access (for ML models)
gcloud projects add-iam-policy-binding sugerdiary \
  --member="serviceAccount:sugar-diary-backend@sugerdiary.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### Step 3: Build and Deploy

#### Option A: Using Cloud Build (Recommended - Automated)

```bash
# Navigate to backend directory
cd backend

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# The service will be automatically deployed!
```

#### Option B: Manual Deployment

```bash
# Navigate to backend directory
cd backend

# Build the Docker image
docker build -t gcr.io/sugerdiary/sugar-diary-backend:latest .

# Push to Google Container Registry
docker push gcr.io/sugerdiary/sugar-diary-backend:latest

# Deploy to Cloud Run
gcloud run deploy sugar-diary-backend \
  --image gcr.io/sugerdiary/sugar-diary-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --service-account sugar-diary-backend@sugerdiary.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=sugerdiary
```

### Step 4: Get Your API URL

After deployment, you'll get a URL like:
```
https://sugar-diary-backend-xxxxx-uc.a.run.app
```

Save this URL - you'll need it to connect your mobile app!

---

## 🔧 Configuration

### Environment Variables

The backend automatically uses these from Google Cloud:
- `GOOGLE_CLOUD_PROJECT`: Your project ID (sugerdiary)
- `PORT`: Automatically set by Cloud Run (8080)

### Free Tier Limits

| Resource | Free Tier | Our Config | Status |
|----------|-----------|------------|--------|
| **Requests** | 2M/month | ~10k expected | ✅ Safe |
| **CPU Time** | 180k vCPU-sec | Minimal | ✅ Safe |
| **Memory** | 360k GiB-sec | 2GB on-demand | ✅ Safe |
| **Egress** | 1 GB/month | ~200MB | ✅ Safe |

**Estimated Cost: $0.00/month** (within free tier)

---

## 🧪 Testing the Deployment

### Test Health Endpoint

```bash
# Replace with your actual URL
curl https://sugar-diary-backend-xxxxx-uc.a.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Test Safety Endpoint

```bash
curl -X POST https://sugar-diary-backend-xxxxx-uc.a.run.app/api/v1/safety/check \
  -H "Content-Type: application/json" \
  -d '{
    "dose": 5.0,
    "currentGlucose": 120,
    "insulinHistory": []
  }'
```

### View API Documentation

Open in browser:
```
https://sugar-diary-backend-xxxxx-uc.a.run.app/docs
```

You'll see interactive Swagger documentation!

---

## 📱 Connect Mobile App to Backend

### Update Mobile App Configuration

Create `mobile/src/config/api.js`:

```javascript
export const API_BASE_URL = 'https://sugar-diary-backend-xxxxx-uc.a.run.app';

export const API_ENDPOINTS = {
  safety: `${API_BASE_URL}/api/v1/safety/check`,
  prediction: `${API_BASE_URL}/api/v1/prediction/glucose`,
  health: `${API_BASE_URL}/health`,
};
```

### Example API Call from Mobile

```javascript
import { API_ENDPOINTS } from '../config/api';

const checkDoseSafety = async (dose, glucose, history) => {
  const response = await fetch(API_ENDPOINTS.safety, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dose,
      currentGlucose: glucose,
      insulinHistory: history
    })
  });
  
  return await response.json();
};
```

---

## 🔄 Continuous Deployment (Optional)

### Set Up GitHub Integration

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **"Create Trigger"**
3. Connect your GitHub repository
4. Set trigger to run on push to `main` branch
5. Use `backend/cloudbuild.yaml` as build config

Now every push to `main` automatically deploys!

---

## 📊 Monitoring

### View Logs

```bash
# Stream logs in real-time
gcloud run services logs tail sugar-diary-backend --region us-central1
```

### View Metrics

Go to [Cloud Run Console](https://console.cloud.google.com/run) to see:
- Request count
- Latency
- Error rate
- Memory usage

---

## 🛑 Troubleshooting

### Build Fails

```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Deployment Fails

```bash
# Check service status
gcloud run services describe sugar-diary-backend --region us-central1

# View recent logs
gcloud run services logs read sugar-diary-backend --region us-central1 --limit=50
```

### Out of Memory

If you see OOM errors, increase memory:
```bash
gcloud run services update sugar-diary-backend \
  --memory 4Gi \
  --region us-central1
```

---

## 🔒 Security Notes

1. **Authentication**: Currently set to `--allow-unauthenticated` for testing
   - For production, implement Firebase Auth token verification
   - Update to `--no-allow-unauthenticated` and add auth middleware

2. **CORS**: Add CORS middleware in `app/main.py` for web/mobile access

3. **Rate Limiting**: Consider adding rate limiting for production

---

## ✅ Deployment Checklist

- [ ] Google Cloud project set up
- [ ] APIs enabled
- [ ] Service account created
- [ ] Backend deployed to Cloud Run
- [ ] Health endpoint tested
- [ ] API documentation accessible
- [ ] Mobile app connected to backend
- [ ] Monitoring set up

---

## 📞 Support

If you encounter issues:
1. Check Cloud Run logs
2. Verify service account permissions
3. Ensure all APIs are enabled
4. Check free tier quotas

**Your backend is now live and ready to serve predictions!** 🚀
