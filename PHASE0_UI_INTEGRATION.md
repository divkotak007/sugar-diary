# Phase 0 UI Integration Guide

## 🎨 New UI Components Created

### 1. **IOBDisplay.jsx** - Active Insulin Indicator
Shows current Insulin on Board with visual feedback.

### 2. **SafetyStatusCard.jsx** - Safety Features Dashboard
Shows which safety features are active and current safety status.

---

## 📍 Where to Add These Components

### **Option 1: Quick Integration (Recommended)**

Add the Safety Status Card to your **Settings Modal**:

#### **File:** `src/components/SettingsModal.jsx` or wherever Settings is rendered

**Add import:**
```javascript
import SafetyStatusCard from './SafetyStatusCard';
```

**Add in Settings UI** (after other settings sections):
```jsx
{/* Phase 0: Safety Status */}
<div className="mt-6">
  <SafetyStatusCard
    featureFlags={FEATURE_FLAGS}
    currentIOB={calculateIOB(fullHistory
      .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
      .map(l => ({
        timestamp: getLogTimestamp(l.timestamp),
        insulinDoses: l.insulinDoses
      }))
    )}
    lastInsulinDose={fullHistory
      .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
      .sort((a, b) => getLogTimestamp(b.timestamp) - getLogTimestamp(a.timestamp))[0]
      ? new Date(getLogTimestamp(fullHistory
          .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
          .sort((a, b) => getLogTimestamp(b.timestamp) - getLogTimestamp(a.timestamp))[0].timestamp))
      : null
    }
  />
</div>
```

---

### **Option 2: Add IOB Indicator to Dashboard**

If you want to show IOB on the main diary/dashboard view:

#### **File:** `src/App.jsx`

**Add import at top:**
```javascript
import IOBDisplay from './components/IOBDisplay';
```

**Add in diary view** (find where your main log entry form is, add before or after it):
```jsx
{/* Phase 0: IOB Indicator */}
{FEATURE_FLAGS.SHOW_IOB_INDICATOR && (
  <IOBDisplay 
    fullHistory={fullHistory}
    className="mb-4"
  />
)}
```

---

### **Option 3: Simple Settings Toggle Section**

Add a dedicated "Safety Features" section in Settings:

```jsx
<div className="mt-6 p-6 bg-stone-50 dark:bg-stone-800 rounded-2xl">
  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
    <Shield className="w-5 h-5 text-blue-600" />
    Safety Features (Phase 0)
  </h3>
  
  <div className="space-y-3">
    {/* Safety Checks */}
    <label className="flex items-center justify-between p-4 bg-white dark:bg-stone-700 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-100">Safety Checks</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">IOB calculation, hypo blocks, dose limits</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors ${FEATURE_FLAGS.ENABLE_SAFETY_CHECKS ? 'bg-green-500' : 'bg-stone-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${FEATURE_FLAGS.ENABLE_SAFETY_CHECKS ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
      </div>
    </label>
    
    {/* Validation */}
    <label className="flex items-center justify-between p-4 bg-white dark:bg-stone-700 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-100">Input Validation</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">Range checks, duplicate detection</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors ${FEATURE_FLAGS.ENABLE_VALIDATION ? 'bg-green-500' : 'bg-stone-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${FEATURE_FLAGS.ENABLE_VALIDATION ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
      </div>
    </label>
    
    {/* IOB Indicator */}
    <label className="flex items-center justify-between p-4 bg-white dark:bg-stone-700 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-100">IOB Indicator</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">Show active insulin on dashboard</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors ${FEATURE_FLAGS.SHOW_IOB_INDICATOR ? 'bg-green-500' : 'bg-stone-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${FEATURE_FLAGS.SHOW_IOB_INDICATOR ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
      </div>
    </label>
  </div>
  
  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
    <p className="text-xs text-amber-800 dark:text-amber-200">
      <strong>Note:</strong> These are currently read-only. To change settings, edit FEATURE_FLAGS in App.jsx.
    </p>
  </div>
</div>
```

---

## 🚀 Quick Start (Easiest Way)

### **Step 1: Enable IOB Indicator**

**File:** `App.jsx` line 63

Change:
```javascript
SHOW_IOB_INDICATOR: false,
```

To:
```javascript
SHOW_IOB_INDICATOR: true,
```

### **Step 2: Add IOB Display to App**

**File:** `App.jsx`

**Add import** (around line 42-48):
```javascript
import IOBDisplay from './components/IOBDisplay';
import SafetyStatusCard from './components/SafetyStatusCard';
```

**Find your main diary view** (search for where you render the log entry form)

**Add this BEFORE the form:**
```jsx
{/* Phase 0: IOB Indicator */}
{FEATURE_FLAGS.SHOW_IOB_INDICATOR && (
  <IOBDisplay 
    fullHistory={fullHistory}
    className="mb-6"
  />
)}
```

### **Step 3: Test**

1. Save the file
2. Dev server will reload
3. Log some insulin doses
4. You should see the IOB indicator appear!

---

## 🎨 What Each Component Looks Like

### **IOBDisplay**
- Blue gradient card
- Shows current IOB in units
- Progress bar (fills as IOB increases)
- Color-coded:
  - Blue (0-1.5u) - Safe
  - Amber (1.5-3u) - Moderate
  - Red (>3u) - High
- Shows time since last dose
- Auto-hides if no insulin history

### **SafetyStatusCard**
- Shows all 4 Phase 0 features
- Green checkmark if enabled
- Gray if disabled
- Shows current IOB
- Shows last dose time
- Emergency protection notice

---

## 📝 Example Integration (Complete)

Here's a complete example of adding both components to your app:

```javascript
// In App.jsx

// 1. Add imports (top of file, around line 42-48)
import IOBDisplay from './components/IOBDisplay';
import SafetyStatusCard from './components/SafetyStatusCard';
import { calculateIOB } from './safety/clinical';

// 2. In your render/return section, add IOB Display to diary view
{/* Somewhere in your diary/dashboard view */}
<div className="px-6 pb-32">
  {/* Phase 0: IOB Indicator */}
  {FEATURE_FLAGS.SHOW_IOB_INDICATOR && (
    <IOBDisplay 
      fullHistory={fullHistory}
      className="mb-6"
    />
  )}
  
  {/* Your existing log entry form */}
  <div className="bg-white p-6 rounded-2xl">
    {/* ... your form fields ... */}
  </div>
</div>

// 3. In your Settings view, add Safety Status Card
{view === 'settings' && (
  <div className="px-6 pb-32">
    {/* ... other settings ... */}
    
    {/* Phase 0: Safety Status */}
    <SafetyStatusCard
      featureFlags={FEATURE_FLAGS}
      currentIOB={calculateIOB(fullHistory
        .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
        .map(l => ({
          timestamp: getLogTimestamp(l.timestamp),
          insulinDoses: l.insulinDoses
        }))
      )}
      lastInsulinDose={fullHistory
        .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
        .sort((a, b) => getLogTimestamp(b.timestamp) - getLogTimestamp(a.timestamp))[0]
        ? new Date(getLogTimestamp(fullHistory
            .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
            .sort((a, b) => getLogTimestamp(b.timestamp) - getLogTimestamp(a.timestamp))[0].timestamp))
        : null
      }
      className="mt-6"
    />
  </div>
)}
```

---

## 🔧 Customization

### **Change IOB Colors**

Edit `IOBIndicator.jsx` lines 30-40 to adjust color thresholds.

### **Change Safety Thresholds**

Edit `clinical.js` CLINICAL_CONSTANTS to adjust:
- `MAX_SAFE_IOB` (default: 3.0u)
- `HYPO_THRESHOLD` (default: 70 mg/dL)
- `ABSOLUTE_MAX_DOSE` (default: 50u)

### **Hide Specific Features**

In `SafetyStatusCard.jsx`, remove items from the `features` array.

---

## ✅ Testing Checklist

- [ ] IOB indicator appears after logging insulin
- [ ] IOB value decreases over time (exponential decay)
- [ ] Color changes based on IOB level
- [ ] Safety status card shows correct feature states
- [ ] Emergency protection notice is visible
- [ ] Components look good in dark mode
- [ ] Mobile responsive (test on phone)

---

## 🎯 Next Steps

After integrating these components:

1. **Test thoroughly** - Log insulin, check IOB calculation
2. **Get user feedback** - Is the UI helpful?
3. **Iterate** - Adjust colors, layout, thresholds
4. **Add Data Cleanup Tool** - Enable `ENABLE_CLEANUP_TOOL`
5. **Start Phase 1** - ML infrastructure

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify imports are correct
3. Make sure `fullHistory` prop is passed correctly
4. Check that `getLogTimestamp` is imported

**Common Issues:**
- "Cannot read property 'filter' of undefined" → `fullHistory` is not passed
- "calculateIOB is not a function" → Import missing
- IOB not updating → Check that logs have `insulinDoses` field

---

**Status:** Ready to integrate  
**Complexity:** Low (drop-in components)  
**Time:** 15-30 minutes
