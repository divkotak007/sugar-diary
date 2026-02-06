# 🚀 Admin Control App - Deployment Guide

## Overview

This is the **Sugar Diary Admin Control App** - a separate, standalone application for managing all configuration across the Sugar Diary ecosystem.

- **Production URL**: https://workflows-alpha.vercel.app
- **Repository**: Separate Git repo in `admin-control-app/` directory
- **Firebase Project**: Shares the same Firebase project as Sugar Diary

---

## 📦 What's Included

### ✅ 8 Complete Modules

1. **Feature Flags** - Toggle features ON/OFF with rollout percentages
2. **UI Control Panel** - Typography, colors, shapes, animations
3. **Medical Rules Engine** - Vital limits, time rules, clinical constants
4. **AI Control Center** - AI insights, thresholds, confidence levels
5. **UX Engine** - Gestures, behaviors, scroll physics
6. **Sound & Haptic Studio** - Audio feedback and haptic responses
7. **Med Database Control** - Medication database and reminder timings
8. **Live Preview** - Preview configuration changes before deployment

### 🔒 Security Features

- Google Sign-In authentication
- Email whitelist (only `divyanshkotak04@gmail.com`)
- Firestore security rules
- Audit logging for all changes
- Configuration versioning & rollback

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ installed
- Firebase project configured
- Git configured

### Setup

```bash
cd admin-control-app
npm install
npm run dev
```

The app will run at `http://localhost:5173`

---

## 🚀 Deploying to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from admin-control-app directory**:
   ```bash
   cd admin-control-app
   vercel --prod
   ```

4. **Link to existing project** (workflows-alpha):
   - When prompted, select "Link to existing project"
   - Choose your Vercel account
   - Select the `workflows-alpha` project

### Option 2: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Set **Root Directory** to: `admin-control-app`
5. Framework Preset: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Click "Deploy"

---

## 🔧 Environment Variables

No environment variables needed! Firebase config is in the code.

---

## 📁 Project Structure

```
admin-control-app/
├── src/
│   ├── auth/
│   │   └── AdminAuth.js          # Google authentication
│   ├── config/
│   │   └── ConfigStore.js        # Config management & versioning
│   ├── audit/
│   │   └── AuditLogger.js        # Audit logging
│   ├── firebase/
│   │   └── config.js             # Firebase configuration
│   ├── modules/
│   │   ├── FeatureFlagController.jsx
│   │   ├── UIControlPanel.jsx
│   │   ├── MedicalRulesEngine.jsx
│   │   ├── AIControlCenter.jsx
│   │   ├── UXEngine.jsx
│   │   ├── SoundHapticStudio.jsx
│   │   ├── MedDatabaseControl.jsx
│   │   └── LivePreview.jsx
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # Main styles
│   ├── modules.css               # Module styles
│   └── preview.css               # Preview styles
├── package.json
├── vite.config.js
└── .vercelignore
```

---

## 🔐 Firestore Security Rules

Make sure these rules are published in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // Admin Config - Admin Control App
    match /admin_config/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email == 'divyanshkotak04@gmail.com';
    }
    
    // ... your other rules ...
  }
}
```

---

## 🔄 Git Workflow

### This repo is SEPARATE from sugar-diary

The admin-control-app has its own Git repository inside the `admin-control-app/` directory.

**To commit changes:**

```bash
cd admin-control-app
git add .
git commit -m "Your commit message"
```

**Note**: The parent `sugar-diary` repo will ignore the `admin-control-app/.git` directory.

---

## 🧪 Testing

### Local Testing

1. Start dev server: `npm run dev`
2. Sign in with your Google account
3. Test each module:
   - Toggle feature flags
   - Change UI colors
   - Modify medical rules
   - Preview changes in Live Preview

### Production Testing

1. Deploy to Vercel
2. Visit https://workflows-alpha.vercel.app
3. Sign in and verify all modules work
4. Test configuration save/rollback

---

## 📊 Integration with Sugar Diary

### Reading Config in Sugar Diary App

Create a `useConfig` hook in your Sugar Diary app:

```javascript
// hooks/useConfig.js
import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'admin_config', 'current');
    
    // Real-time listener
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        setConfig(doc.data().config);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { config, loading };
};
```

### Usage in Components

```javascript
import { useConfig } from './hooks/useConfig';

function MyComponent() {
  const { config, loading } = useConfig();

  if (loading) return <div>Loading...</div>;

  // Use config
  const isFeatureEnabled = config.features.aiInsights.enabled;
  const primaryColor = config.ui.colors.light.primary;
  
  return <div>...</div>;
}
```

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all modules in production
3. ✅ Integrate with Sugar Diary app using `useConfig` hook
4. ✅ Monitor audit logs for changes
5. ✅ Set up alerts for critical config changes

---

## 🐛 Troubleshooting

### Build fails

- Check Node.js version (18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

### Authentication fails

- Check Firebase config in `src/firebase/config.js`
- Verify email is in whitelist in `src/auth/AdminAuth.js`
- Check Firestore security rules

### Config not saving

- Check Firestore security rules
- Verify you're signed in with correct email
- Check browser console for errors

---

## 📞 Support

For issues or questions, contact: divyanshkotak04@gmail.com

---

**Built with ❤️ for Sugar Diary**
