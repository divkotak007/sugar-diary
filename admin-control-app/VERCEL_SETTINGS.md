# ⚙️ Vercel Configuration - Admin Control App

## 🎯 Exact Settings for Vercel Dashboard

You're on the Vercel import page. Here are the **EXACT** settings to use:

---

### 📝 Project Settings

| Setting | Value |
|---------|-------|
| **Project Name** | `workflows-alpha` |
| **Framework Preset** | Vite |
| **Root Directory** | `admin-control-app` ⚠️ **CRITICAL** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

### 🔧 Step-by-Step Instructions

#### 1. Project Name
Change from `sugar-diary` to: **`workflows-alpha`**

#### 2. Root Directory (MOST IMPORTANT)
Click **"Edit"** next to Root Directory and type: **`admin-control-app`**

If you don't see an "Edit" button, look for:
- A dropdown menu
- A text input field
- An "Override" or "Configure" button

Type exactly: `admin-control-app`

#### 3. Framework Preset
Should auto-detect as **Vite** (already correct)

#### 4. Build Settings
Expand "Build and Output Settings" if collapsed:
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist` ✅
- **Install Command**: `npm install` ✅

#### 5. Environment Variables
**None needed!** Leave this section empty.

---

### 🚀 Deploy

Click the **"Deploy"** button at the bottom.

Vercel will:
1. Clone your repository
2. Navigate to `admin-control-app/` directory
3. Run `npm install`
4. Run `npm run build`
5. Deploy the `dist/` folder
6. Give you a URL: `https://workflows-alpha.vercel.app`

---

### ⏱️ Expected Timeline

- **Build time**: ~1-2 minutes
- **Deployment**: ~30 seconds
- **Total**: ~2-3 minutes

---

### ✅ After Deployment

1. Visit: `https://workflows-alpha.vercel.app`
2. You should see the login screen
3. Sign in with: `divyanshkotak04@gmail.com`
4. Test all 8 modules

---

### 🐛 If Root Directory Option is Missing

If you can't find the "Root Directory" field:

**Option A: Use vercel.json**
The `vercel.json` file in `admin-control-app/` should handle this automatically.

**Option B: Deploy from CLI**
```bash
cd admin-control-app
vercel login
vercel --prod
```

**Option C: Create New Project**
Instead of importing, create a new project and manually link the repository with root directory set.

---

### 📸 What You Should See

The import page should show:
- Repository: `divkotak007/sugar-diary` ✅
- Framework: Vite ✅
- Root Directory: `admin-control-app` ⚠️ (you need to set this)

---

## 🎯 Quick Checklist

- [ ] Project name: `workflows-alpha`
- [ ] Root directory: `admin-control-app`
- [ ] Framework: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Click Deploy

---

**That's it! Let me know if you need help with any specific field!**
