# Fleek Finance — React Native Client

Client-facing mobile app for the Fleek Finance planning platform.

## Stack
- **Expo** (managed workflow)
- **React Navigation** (bottom tabs + native stack)
- **expo-secure-store** (token storage)
- **victory-native** (charts — future)
- **react-native-pdf** (PDF plan viewer — future)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start

# 3. Run on device
# Scan QR with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

## Project structure

```
App.js                      # Root navigation + auth gate
src/
  api/client.js             # All Flask API calls
  context/AuthContext.js    # Login state + SecureStore
  theme.js                  # Colours, fonts, helpers (matches web app)
  screens/
    LoginScreen.js          # Login (client only, blocks advisor)
    OverviewScreen.js       # Net worth, health score, insights
    NetWorthScreen.js       # Per-member assets & liabilities
    CashFlowScreen.js       # Income, expenses, surplus per member
    MutualFundsScreen.js    # CAS portfolio, AMC grouping, XIRR
    PlanScreen.js           # Financial plan (text or PDF)
    SettingsScreen.js       # Change password, sign out
  components/
    StatCard.js             # Reusable stat tile
    AllocBar.js             # Allocation bar row
    HealthScore.js          # SVG ring score indicator
    SchemeCard.js           # MF scheme card with metrics
```

## API
Points to: `https://financialplanning-production-6bf6.up.railway.app`

All endpoints are the same as the web app. Token stored in SecureStore
under key `fleek_auth`.

## Next steps
- [ ] Add react-native-vector-icons for proper tab icons
- [ ] Add push notifications (expo-notifications) for plan updates
- [ ] Add biometric login (expo-local-authentication)
- [ ] PDF viewer for uploaded plans (react-native-pdf)
- [ ] Submit to Play Store (Android first)
