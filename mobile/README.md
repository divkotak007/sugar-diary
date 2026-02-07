# Sugar Diary Mobile App

React Native mobile application for diabetes management with AI-powered insights.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Expo Go app on your phone (iOS/Android)

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
npx expo start
```

Then:
- Scan the QR code with **Expo Go** (Android) or **Camera** app (iOS)
- Or press `a` for Android emulator / `i` for iOS simulator

## 📱 Features Implemented

### ✅ Phase 1 - Week 2 Complete
- **HomeScreen**: Dashboard with glucose and IOB summary
- **GlucoseLogScreen**: Log blood glucose readings
- **InsulinLogScreen**: Log insulin doses with safety checks
- **Safety Engine**: 
  - IOB (Insulin on Board) calculation
  - Dose safety validation
  - Blocks unsafe doses automatically
- **Firebase Integration**: Real-time Firestore sync

## 🔒 Safety Features

The app includes medical-grade safety checks:

1. **Absolute Maximum Dose**: Blocks doses > 50 units (data entry error protection)
2. **Maximum IOB Limit**: Prevents insulin stacking (default: 3.0 units)
3. **Hypoglycemia Protection**: Blocks dosing when glucose < 70 mg/dL
4. **High Dose Warning**: Warns for single doses > 15 units

All safety logic is ported from the web app's `clinical.js` module.

## 📂 Project Structure

```
mobile/
├── src/
│   ├── firebase/
│   │   └── config.js          # Firebase configuration
│   ├── hooks/
│   │   └── useFirestore.js    # Custom Firestore hooks
│   ├── navigation/
│   │   └── AppNavigator.js    # Navigation setup
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── GlucoseLogScreen.js
│   │   └── InsulinLogScreen.js
│   └── services/
│       └── safety.js          # Safety calculations (IOB, dose checks)
├── App.js                     # Entry point
└── package.json
```

## 🧪 Testing

### Test Safety Engine

1. Navigate to **Log Insulin**
2. Enter a dose > 50 units → Should block with error
3. Enter a dose > 15 units → Should show warning
4. Enter a normal dose (e.g., 5 units) → Should pass safety check

### Test Firestore Sync

1. Log a glucose reading
2. Check Firebase Console → `sugarLogs` collection
3. Verify the log appears in real-time

## 🔗 Backend Integration

This mobile app connects to:
- **Firebase Firestore**: For data storage (same database as web app)
- **FastAPI Backend** (optional): For AI predictions (in `../backend/`)

## 📝 Next Steps

- [ ] Add Authentication (Firebase Auth)
- [ ] Implement Meal Logging with photo capture
- [ ] Add Calendar View
- [ ] Connect to Backend API for predictions
- [ ] Add offline support with local persistence

## 🐛 Troubleshooting

### "Unable to resolve module"
```bash
npx expo install
```

### Firebase errors
- Check that `src/firebase/config.js` has correct credentials
- Verify Firestore rules allow read/write

### App won't start
```bash
rm -rf node_modules
npm install
npx expo start --clear
```
