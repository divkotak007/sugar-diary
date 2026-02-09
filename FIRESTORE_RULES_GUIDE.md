# Firestore Security Rules Deployment Guide

## 🔒 What These Rules Do

The security rules ensure:
- ✅ Only authenticated users can access data
- ✅ Users can only see their own logs (glucose, insulin, meals, vitals)
- ✅ Users can only modify their own data
- ✅ All writes must include the correct `userId`
- ✅ Prevents data leakage between users

## 📋 Collections Protected

1. `sugarLogs` - Blood glucose readings
2. `insulinLogs` - Insulin doses
3. `mealLogs` - Meal entries
4. `vitalLogs` - Blood pressure, weight, etc.
5. `users` - User profiles
6. `prescriptions` - Medication prescriptions

## 🚀 How to Deploy

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **sugerdiary**
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab
5. Copy the contents of `firestore.rules`
6. Paste into the editor
7. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## 🧪 Testing the Rules

### Test 1: Authenticated User Can Read Own Data
```javascript
// In your app, after login
const logs = await getDocs(
  query(collection(db, 'sugarLogs'), where('userId', '==', user.uid))
);
// ✅ Should work
```

### Test 2: User Cannot Read Other's Data
```javascript
// Try to query without userId filter
const logs = await getDocs(collection(db, 'sugarLogs'));
// ❌ Should fail (permission denied)
```

### Test 3: Unauthenticated Access Blocked
```javascript
// Sign out first
await signOut(auth);

// Try to read
const logs = await getDocs(collection(db, 'sugarLogs'));
// ❌ Should fail (permission denied)
```

## ⚠️ Important Notes

1. **Existing Data**: These rules work with your existing data structure
2. **Mobile App**: Already compatible - all queries use `userId` filter
3. **Web App**: May need updates if queries don't filter by `userId`
4. **Backward Compatible**: Old data without `userId` will be inaccessible (good for security)

## 🔧 Troubleshooting

### "Permission Denied" Errors

If you get permission denied errors after deploying:

1. **Check Authentication**: Make sure user is signed in
2. **Check userId Field**: Ensure all documents have `userId` field
3. **Check Query**: Queries must filter by `userId == auth.uid`

### Example Fix for Queries

**Before (Insecure)**:
```javascript
const logs = await getDocs(collection(db, 'sugarLogs'));
```

**After (Secure)**:
```javascript
const logs = await getDocs(
  query(
    collection(db, 'sugarLogs'),
    where('userId', '==', user.uid)
  )
);
```

## ✅ Verification

After deployment, check the Firebase Console:
1. Go to **Firestore Database** → **Rules**
2. You should see the rules published
3. Check the "Published" timestamp

Your data is now secure! 🔒
