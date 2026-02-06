# 🚀 Deployment Guide - Separate Vercel Projects

## Overview

This repository contains **TWO separate applications** that deploy to **TWO different Vercel projects**:

1. **Sugar Diary App** (Main App) → `sugar-diary.vercel.app`
2. **Admin Control App** → `workflows-alpha.vercel.app`

Both apps are in the **same Git repository** but deploy separately.

---

## 📁 Repository Structure

```
sugar-diary/
├── src/                          # Main Sugar Diary app
├── mobile/                       # Mobile app
├── admin-control-app/            # Admin Control App (separate deployment)
│   ├── src/
│   ├── package.json
│   └── vercel.json              # Vercel config for admin app
├── package.json                  # Main app package.json
└── vercel.json                   # Vercel config for main app (if needed)
```

---

## 🎯 Deployment Strategy

### Admin Control App → workflows-alpha.vercel.app

**Deploy from:** `admin-control-app/` directory

#### Option 1: Vercel CLI

```bash
# From repository root
cd admin-control-app
vercel --prod
```

When prompted:
- Link to existing project: **workflows-alpha**
- Root directory: **Leave as current directory**

#### Option 2: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Import your Git repository
3. **Project Settings:**
   - Name: `workflows-alpha`
   - Root Directory: `admin-control-app`
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy!

---

### Main Sugar Diary App → sugar-diary.vercel.app

**Deploy from:** Repository root

#### Option 1: Vercel CLI

```bash
# From repository root
vercel --prod
```

#### Option 2: Vercel Dashboard

1. Create a new project
2. Import your Git repository
3. **Project Settings:**
   - Name: `sugar-diary`
   - Root Directory: **Leave empty** (repository root)
   - Framework Preset: **Vite** (or your framework)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy!

---

## 🔄 How Config Sync Works

### Admin App → Firebase → Main App

```
Admin Control App (workflows-alpha.vercel.app)
    ↓
    Saves config to Firestore (admin_config/current)
    ↓
    Real-time listener in Main App
    ↓
Sugar Diary App (sugar-diary.vercel.app)
    ↓
    Automatically updates with new config
```

### Integration in Main App

1. **Add the useConfig hook** (already created at `src/hooks/useConfig.js`)

2. **Use in any component:**

```javascript
import { useConfig, useFeatureFlag } from './hooks/useConfig';

function MyComponent() {
  const { config, loading } = useConfig();
  const aiEnabled = useFeatureFlag('aiInsights');

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ color: config.ui.colors.light.primary }}>
      {aiEnabled && <AIInsights />}
    </div>
  );
}
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

## 📝 Git Workflow

### Same Repository, Different Deployments

```bash
# Make changes to admin app
cd admin-control-app
# ... edit files ...

# Commit changes
git add .
git commit -m "Update admin app: Add new feature"
git push

# Vercel will automatically deploy admin-control-app to workflows-alpha
```

```bash
# Make changes to main app
cd src
# ... edit files ...

# Commit changes
git add .
git commit -m "Update main app: Integrate config"
git push

# Vercel will automatically deploy main app to sugar-diary
```

---

## 🎯 Deployment Checklist

### First Time Setup

**Admin Control App:**
- [ ] Create Vercel project: `workflows-alpha`
- [ ] Set root directory: `admin-control-app`
- [ ] Deploy and test
- [ ] Verify Firebase connection
- [ ] Test config save/load

**Main Sugar Diary App:**
- [ ] Create Vercel project: `sugar-diary`
- [ ] Set root directory: `` (empty - repository root)
- [ ] Add `useConfig` hook to `src/hooks/useConfig.js`
- [ ] Deploy and test
- [ ] Verify config sync from admin app

### Testing Config Sync

1. Open Admin App: https://workflows-alpha.vercel.app
2. Sign in and change a config value (e.g., toggle a feature flag)
3. Click "Save Changes"
4. Open Main App: https://sugar-diary.vercel.app
5. Verify the change is reflected immediately (real-time sync)

---

## 🐛 Troubleshooting

### Admin app not deploying

- Check root directory is set to `admin-control-app`
- Verify `vercel.json` exists in `admin-control-app/`
- Check build logs in Vercel dashboard

### Main app not deploying

- Check root directory is empty (repository root)
- Verify build command and output directory
- Check build logs in Vercel dashboard

### Config not syncing

- Verify Firestore security rules are published
- Check browser console for errors
- Verify both apps use the same Firebase project
- Check that `useConfig` hook is imported correctly

---

## 📊 Summary

| App | URL | Root Directory | Vercel Project |
|-----|-----|----------------|----------------|
| Admin Control | workflows-alpha.vercel.app | `admin-control-app` | workflows-alpha |
| Main Sugar Diary | sugar-diary.vercel.app | `` (root) | sugar-diary |

**Both apps share:**
- ✅ Same Git repository
- ✅ Same Firebase project
- ✅ Real-time config sync

**But deploy to:**
- ✅ Different Vercel projects
- ✅ Different URLs
- ✅ Independent builds

---

**Ready to deploy! 🚀**
