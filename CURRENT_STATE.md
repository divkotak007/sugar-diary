# Sugar Diary - Current State Documentation

## 📊 Firestore Architecture (As-Is)

### Collection Structure
```
artifacts/
  └── sugar_diary_v1/          # App ID
      └── users/
          └── {userId}/
              ├── vital_weight_logs/
              ├── vital_hba1c_logs/
              ├── vital_creatinine_logs/
              └── [other collections - TBD]
```

### Data Fetching Pattern
- **Uses custom hooks** (not direct `onSnapshot` in App.jsx)
- **Existing hooks:**
  - `useVitalLogs` - For vital signs (weight, HbA1c, creatinine)
  - `useFirestore` - General Firestore operations
  - `useAuth` - Authentication
  - `useOfflineSync` - Offline support
  - `useAccessibility` - Accessibility features

### Key Findings
✅ **Good News:**
- Already using hook pattern (no refactoring needed!)
- Proper listener cleanup in `useVitalLogs`
- Audit logging already implemented
- Offline persistence enabled
- Time authority system (`canEdit`, `canDelete`) already in place

⚠️ **Areas to Enhance:**
- Need to understand main sugar/insulin log structure
- Need to identify where duplicate listener issue occurs
- Need to map all data collections

---

## 🎯 Phase 0 Strategy (Revised)

### Week 1: Safe Additions Only

#### Day 1-2: Current State Audit ✓ IN PROGRESS
- [x] Document Firestore structure
- [x] Identify existing hooks
- [ ] Map sugar/insulin log collections
- [ ] Document data flow
- [ ] Create backup script

#### Day 3-4: Clinical Safety Module (NEW FEATURE)
**Strategy:** Add as completely new module, zero changes to existing code

**Files to Create:**
- `src/safety/clinical.js` - Safety calculations
- `src/safety/SafetyGate.jsx` - UI component
- `src/components/IOBIndicator.jsx` - Display component

**Integration Point:**
- Add optional toggle in Settings: "Enable Safety Checks" (default: OFF)
- Add IOB display as new card in dashboard (doesn't replace anything)
- Safety checks only run if user enables them

**Zero Risk:** All new files, no modifications to existing code

#### Day 5-7: Input Validation (ENHANCEMENT)
**Strategy:** Add validation layer on top of existing forms

**Files to Create:**
- `src/validation/schemas.js` - Zod schemas
- `src/validation/ValidationFeedback.jsx` - UI component

**Integration:**
- Add validation feedback to forms (warnings only, doesn't block saves)
- Keep existing validation logic intact
- Add feature flag: `ENABLE_VALIDATION` (default: OFF)

---

## 🛡️ Safety Protocols

### Feature Flags
```javascript
// Add to App.jsx (top level)
const FEATURE_FLAGS = {
  ENABLE_SAFETY_CHECKS: false,    // Clinical safety module
  ENABLE_VALIDATION: false,       // Input validation
  ENABLE_AI_SCHEMA: false,        // New database schema (Week 2)
};
```

### Testing Checklist (Before Each Commit)
- [ ] App loads without errors
- [ ] All existing features work
- [ ] No console errors
- [ ] Firebase reads/writes unchanged (if flag OFF)
- [ ] Can toggle new features ON/OFF

### Rollback Plan
- Keep feature flags OFF by default
- Test with flags ON for 1 week minimum
- Document any issues
- Only enable by default after thorough testing

---

## 📋 Next Actions

1. **Find sugar/insulin log collections** (need to search App.jsx)
2. **Create clinical safety module** (completely new, zero risk)
3. **Add feature flag system** (one-time addition)
4. **Test safety calculations** (isolated testing)

---

## ❓ Questions to Answer

1. Where are sugar logs stored? (need to find in App.jsx)
2. Where are insulin logs stored?
3. Is there a `fullHistory` or similar aggregated data?
4. Are there any direct `onSnapshot` calls we missed?

**Status:** Audit 60% complete, ready to proceed with safe additions
