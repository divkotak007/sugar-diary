# 🚀 Local Development Guide

## Running the Admin App Locally

### Step 1: Open Terminal in Admin App Directory

```bash
cd C:\Users\mohit\sugar-diary\admin-control-app
```

### Step 2: Install Dependencies (First Time Only)

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### Step 4: Open in Browser

Open your browser and go to:
```
http://localhost:5174
```

---

## Running the Main Sugar Diary App Locally

### Step 1: Open Terminal in Main App Directory

```bash
cd C:\Users\mohit\sugar-diary
```

### Step 2: Install Dependencies (First Time Only)

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 4: Open in Browser

Open your browser and go to:
```
http://localhost:5173
```

---

## 🔄 Restarting the Server (When Code Changes)

### If Server is Already Running:

1. **Go to the terminal** where `npm run dev` is running
2. **Press `Ctrl + C`** to stop the server
3. **Run again**: `npm run dev`

### Quick Restart Commands:

**For Admin App:**
```bash
cd C:\Users\mohit\sugar-diary\admin-control-app
npm run dev
```

**For Main App:**
```bash
cd C:\Users\mohit\sugar-diary
npm run dev
```

---

## 🧪 Testing Admin Config Sync

### Step 1: Run Both Apps

**Terminal 1 - Admin App:**
```bash
cd admin-control-app
npm run dev
```
Opens at: http://localhost:5174

**Terminal 2 - Main App:**
```bash
cd C:\Users\mohit\sugar-diary
npm run dev
```
Opens at: http://localhost:5173

### Step 2: Test Real-Time Sync

1. **Open both URLs** in different browser tabs
2. **In Admin App** (localhost:5174):
   - Go to "Feature Flags"
   - Toggle "Estimated HbA1c" OFF
   - Click "Save Changes"
3. **In Main App** (localhost:5173):
   - Refresh the page
   - HbA1c badge should disappear!

---

## 📝 Making Code Changes

### Workflow:

1. **Edit code** in VS Code
2. **Save the file** (Ctrl + S)
3. **Vite auto-reloads** - changes appear instantly!
4. **No need to restart** unless:
   - You changed `package.json`
   - You added new dependencies
   - You're seeing old code (then restart)

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**Solution:**
```bash
# Find and kill the process
netstat -ano | findstr :5173
taskkill /PID <process_id> /F
```

### Problem: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Problem: "Old code still showing"

**Solution:**
```bash
# Hard refresh in browser
Ctrl + Shift + R

# Or restart dev server
Ctrl + C
npm run dev
```

### Problem: Changes not syncing between admin and main app

**Solution:**
1. Check both apps use same Firebase project
2. Clear browser cache
3. Check Firestore rules allow reads
4. Check browser console for errors

---

## 📦 Deploying Changes

### After Making Changes:

```bash
# 1. Check what changed
git status

# 2. Stage changes
git add .

# 3. Commit with message
git commit -m "Your change description"

# 4. Push to GitHub
git push

# 5. Vercel auto-deploys!
# Check: https://vercel.com/dashboard
```

---

## 🎯 Current Setup

| App | Local URL | Production URL |
|-----|-----------|----------------|
| Admin App | http://localhost:5174 | https://workflows-alpha.vercel.app |
| Main App | http://localhost:5173 | https://sugar-diary.vercel.app |

---

## ✅ Quick Checklist

- [ ] Node.js installed (v18+)
- [ ] Git installed
- [ ] VS Code installed
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open to localhost URL
- [ ] Firebase configured correctly

---

## 🆘 Need Help?

If you're stuck:
1. Check the terminal for error messages
2. Check browser console (F12)
3. Try restarting the dev server
4. Clear browser cache
5. Check this guide again

**Common Commands:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm install          # Install dependencies
git status           # Check git status
git push             # Push to GitHub
```
