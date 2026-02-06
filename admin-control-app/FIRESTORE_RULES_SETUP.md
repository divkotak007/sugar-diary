# Firestore Security Rules Setup

## Problem
You're getting "Missing or insufficient permissions" because Firestore security rules are blocking writes to the `admin_config` collection.

## Solution
Add these rules to your Firebase Console:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sugerdiary**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab

### Step 2: Add Admin Config Rules

Add this to your Firestore rules (at the top, before your existing rules):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin Config Collection - Only for admin users
    match /admin_config/{document=**} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow only specific admin emails to write
      allow write: if request.auth != null && 
        request.auth.token.email in [
          'divyanshkotak04@gmail.com'
        ];
    }
    
    // Your existing rules below...
    match /users/{userId} {
      // ... keep your existing user rules
    }
    
    match /logs/{logId} {
      // ... keep your existing log rules
    }
    
    // ... rest of your existing rules
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for confirmation

### Step 4: Test Again
1. Go back to `http://localhost:5173`
2. Toggle a feature flag
3. Click "Save Changes"
4. Should work now! ✅

---

## Quick Fix (For Development Only)

If you want to test quickly, you can temporarily use these permissive rules (NOT recommended for production):

```javascript
match /admin_config/{document=**} {
  allow read, write: if request.auth != null;
}
```

**⚠️ WARNING**: This allows ANY authenticated user to modify config. Only use for testing!

---

## Verify Your Current Rules

Your current Firestore rules might look something like this. Make sure to ADD the admin_config rules, not replace everything:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ADD THIS SECTION ↓
    match /admin_config/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email == 'divyanshkotak04@gmail.com';
    }
    // ADD THIS SECTION ↑
    
    // Keep all your existing rules below
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /logs/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## After Adding Rules

The admin app will be able to:
- ✅ Read config (any authenticated user)
- ✅ Write config (only divyanshkotak04@gmail.com)
- ✅ Save feature flags
- ✅ View history
- ✅ Rollback versions

---

## Need Help?

If you're not sure about your current rules, you can share them and I'll help merge the admin_config rules properly.
