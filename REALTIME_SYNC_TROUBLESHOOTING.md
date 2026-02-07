# 🔧 Testing Real-Time Config Sync

## Problem
Changes made in the admin app are not reflecting in the main Sugar Diary app in real-time.

## Solution Steps

### Step 1: Verify Firebase Connection

Both apps must use the **same Firebase project**. Check:

**Admin App:** `admin-control-app/src/firebase/config.js`
**Main App:** `src/firebase/config.js`

Make sure both have the same:
- `apiKey`
- `projectId`
- `databaseURL`

### Step 2: Add Test Component

I've created `src/ConfigTest.jsx` - a visual test component that shows:
- ✅ If config is loading
- ✅ Current config values
- ✅ Real-time updates when you change admin settings

**Add it to your main app:**

```javascript
// src/App.jsx
import ConfigTest from './ConfigTest';

function App() {
  return (
    <div>
      <ConfigTest />  {/* Add this temporarily */}
      {/* ... rest of your app */}
    </div>
  );
}
```

### Step 3: Test the Sync

1. **Open main app** in browser (http://localhost:5173 or your dev URL)
2. **Open admin app** in another tab (https://workflows-alpha.vercel.app)
3. **In admin app:**
   - Go to "Feature Flags"
   - Toggle AI Insights ON/OFF
   - Click "Save Changes"
4. **Watch the main app** - ConfigTest should update immediately!

### Step 4: Check Firestore

Go to Firebase Console → Firestore Database

You should see:
```
admin_config/
  └── current/
      ├── config: { ... }
      ├── version: 1234567890
      └── lastUpdated: timestamp
```

If this exists, the admin app is saving correctly.

### Step 5: Check Browser Console

In your main app, open DevTools console and look for:
- ✅ No errors
- ✅ "Config updated!" messages (if you added console.log)
- ❌ Firebase permission errors
- ❌ "No Firebase App" errors

## Common Issues

### Issue 1: "No Firebase App '[DEFAULT]' has been created"
**Fix:** Make sure Firebase is initialized in `src/firebase/config.js`

### Issue 2: "Permission denied"
**Fix:** Check Firestore security rules allow reading `admin_config/current`

### Issue 3: Config loads but doesn't update
**Fix:** The `useConfig` hook uses `onSnapshot` for real-time updates. Check if:
- Hook is properly imported
- Component re-renders when config changes

### Issue 4: Different Firebase projects
**Fix:** Both apps must use the SAME Firebase project

## Quick Debug Checklist

- [ ] Both apps use same Firebase project
- [ ] `useConfig.js` exists in `src/hooks/`
- [ ] ConfigTest component shows config values
- [ ] Firestore has `admin_config/current` document
- [ ] No errors in browser console
- [ ] Admin app successfully saves changes

## If Still Not Working

Share:
1. Browser console errors (if any)
2. Firestore security rules
3. Firebase config (without sensitive keys)

I'll help debug further!
