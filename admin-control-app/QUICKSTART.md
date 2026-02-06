# Admin Control App - Quick Start Guide

## 🚀 Getting Started

### 1. Configure Your Admin Email

**File:** `src/auth/AdminAuth.js`

```javascript
const ADMIN_EMAILS = [
  'your-email@gmail.com', // ⚠️ REPLACE WITH YOUR ACTUAL EMAIL
];
```

### 2. Test Locally

```bash
cd admin-control-app
npm run dev
```

Visit: `http://localhost:5173`

### 3. Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

Or link to your existing `workflows-alpha` project in Vercel dashboard.

---

## 📋 What You Can Do Now

### Feature Flag Controller (Module D) ✅

Toggle these features ON/OFF in Sugar Diary:
- Estimated HbA1c Display
- Calendar Sugar View
- AI Insights
- Medication Reminders
- Deep View Vitals
- Safety Checks
- Input Validation
- Data Cleanup Tool
- IOB Indicator
- PDF Export

### Config History & Rollback

- View all configuration changes
- See who made each change and when
- Rollback to any previous version with one click

---

## 🔗 Next: Integrate with Sugar Diary

Create `sugar-diary/src/hooks/useConfig.js`:

```javascript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useConfig = (path) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'admin_config', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data().config;
          const value = path ? path.split('.').reduce((obj, key) => obj?.[key], data) : data;
          setConfig(value);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [path]);

  return { config, loading };
};
```

**Usage:**

```javascript
const { config: features } = useConfig('features');

if (features?.estimatedHbA1c?.enabled) {
  // Show HbA1c card
}
```

---

## 📁 Project Location

```
C:\Users\mohit\sugar-diary\admin-control-app\
```

---

## 🎯 Deployment Target

```
https://workflows-alpha.vercel.app/
```

---

## ✅ Build Status

- ✅ Build successful (7.57s)
- ✅ All dependencies installed
- ✅ Firebase configured
- ✅ Module D (Feature Flags) complete
- ✅ Ready for deployment

---

## 🔒 Security Checklist

- [ ] Add your email to `ADMIN_EMAILS`
- [ ] Test sign-in locally
- [ ] Deploy to Vercel
- [ ] Add Firestore security rules
- [ ] Test admin access on production

---

## 📞 Support

If you encounter any issues:
1. Check Firebase console for errors
2. Verify your email is in `ADMIN_EMAILS`
3. Check browser console for errors
4. Ensure Firestore rules allow reads/writes
