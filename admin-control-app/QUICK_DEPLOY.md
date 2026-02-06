# 🚀 Quick Deploy - Admin Control App

## ✅ Everything is Ready!

All code has been committed and pushed to Git. Now you just need to deploy to Vercel.

---

## 🎯 Deploy via Vercel Dashboard (Easiest)

### Step 1: Go to Vercel
Visit: https://vercel.com/dashboard

### Step 2: Import Project
1. Click **"Add New"** → **"Project"**
2. Import your **sugar-diary** Git repository
3. Vercel will detect it

### Step 3: Configure Project
**IMPORTANT: Set these settings:**

- **Project Name**: `workflows-alpha`
- **Root Directory**: `admin-control-app` ⚠️ **CRITICAL**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Deploy
Click **"Deploy"** and wait ~2 minutes

### Step 5: Done!
Your admin app will be live at: **https://workflows-alpha.vercel.app**

---

## 🖥️ Deploy via CLI (Alternative)

### Step 1: Login to Vercel
```bash
vercel login
```

Follow the prompts to authenticate.

### Step 2: Deploy
```bash
cd admin-control-app
vercel --prod
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → Yes (if workflows-alpha exists) or No (create new)
- **Project name?** → `workflows-alpha`
- **Directory?** → `.` (current directory)

### Step 3: Wait for Deployment
Vercel will build and deploy. You'll get a URL when done.

---

## ✅ Verify Deployment

1. Visit: https://workflows-alpha.vercel.app
2. You should see the login screen
3. Sign in with your Google account (`divyanshkotak04@gmail.com`)
4. Test all 8 modules:
   - Feature Flags
   - UI Control
   - Medical Rules
   - AI Control
   - UX Engine
   - Sound & Haptic
   - Med Database
   - Live Preview

---

## 🔄 Test Config Sync

1. In admin app, toggle a feature flag
2. Click "Save Changes"
3. Open your main Sugar Diary app
4. Use the `useConfig` hook to verify the change

Example:
```javascript
import { useConfig } from './hooks/useConfig';

function TestComponent() {
  const { config } = useConfig();
  console.log('Config:', config);
  return <div>Check console</div>;
}
```

---

## 🎉 You're Done!

Once deployed, your admin app will be live and ready to manage all Sugar Diary configuration!

**Admin App**: https://workflows-alpha.vercel.app  
**Main App**: https://sugar-diary.vercel.app (deploy separately)

---

## 📝 Next Steps

1. Deploy admin app (this guide)
2. Deploy main app (same process, but root directory = empty)
3. Test config sync between apps
4. Start managing your app configuration!
