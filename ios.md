# iOS App Store Deployment - Commented Subscriptions & Membership Guide

> **Purpose**: This document tracks all subscription plans, Razorpay payment flows, and membership navigation elements that were commented out to pass Apple App Store Review (Guideline 3.1.1 - In-App Purchase compliance).
>
> All commented code sections are tagged with searchable markers:
> `[IOS-DEPLOY-COMMENT-START]` and `[IOS-DEPLOY-COMMENT-END]`

---

## Quick Search Marker
To locate all commented sections in the codebase, search for:
```
[IOS-DEPLOY-COMMENT
```

---

## Summary of Changes

| File | Type | What was Commented Out |
|---|---|---|
| [`DashboardScreen.jsx`](file:///c:/Users/admin/Desktop/appzeto-2/agarwal/frontend/src/modules/user/components/DashboardScreen.jsx) | UI / Navigation | 1. `Membership` ("Premium") tab in `navTabs` (sticky bottom navbar & desktop sidebar)<br>2. Tab click handler `tabId === 'Membership'`<br>3. `premium` quick action button in Profile tab<br>4. Daily profile-view limit "Upgrade" button |
| [`UserFlowPage.jsx`](file:///c:/Users/admin/Desktop/appzeto-2/agarwal/frontend/src/modules/user/pages/UserFlowPage.jsx) | Routing | 1. Lazy imports for `MembershipScreen` and `PaymentScreen`<br>2. `/membership`, `/premium`, and `/payment` route elements (replaced with safe fallback redirects to `/home`) |
| [`ProfileDetailScreen.jsx`](file:///c:/Users/admin/Desktop/appzeto-2/agarwal/frontend/src/modules/user/components/ProfileDetailScreen.jsx) | UI / CTA | 1. "See membership plans" button on limit error screen<br>2. "Upgrade Membership" button on view limit reached card |
| [`HelpSupportScreen.jsx`](file:///c:/Users/admin/Desktop/appzeto-2/agarwal/frontend/src/modules/user/components/HelpSupportScreen.jsx) | FAQ / Content | 1. FAQ item: *"How do Premium Membership plans work?"* |

---

## Detailed File Modifications & How to Uncomment

### 1. `frontend/src/modules/user/components/DashboardScreen.jsx`

#### A. Bottom Navigation Bar & Desktop Sidebar (`navTabs`)
- **Location**: `navTabs` definition (around line 1310)
- **Current State**:
```javascript
  const navTabs = [
    { id: 'Home', label: 'Home', icon: 'home' },
    { id: 'Matches', label: 'Matches', icon: 'favorite' },
    {
      id: 'Messages',
      label: 'Messages',
      icon: 'chat',
      badge: totalUnreadMessages > 0 ? String(totalUnreadMessages) : undefined,
    },
    // === [IOS-DEPLOY-COMMENT-START] Membership / Premium bottom navbar tab commented out for iOS deployment ===
    // { id: 'Membership', label: 'Premium', icon: 'workspace_premium' },
    // === [IOS-DEPLOY-COMMENT-END] ===
    { id: 'Profile', label: 'Profile', icon: 'account_circle' },
  ]
```
- **To Uncomment**: Remove comment slashes on `{ id: 'Membership', label: 'Premium', icon: 'workspace_premium' },`.

#### B. Tab Navigation Handler (`handleTabNavigate`)
- **Location**: inside `handleTabNavigate` function (around line 550)
- **Current State**:
```javascript
    } else if (tabId === 'Notifications') {
      navigate('/notifications')
    // === [IOS-DEPLOY-COMMENT-START] Membership tab handler commented out for iOS deployment ===
    // } else if (tabId === 'Membership') {
    //   navigate('/membership')
    // === [IOS-DEPLOY-COMMENT-END] ===
    } else if (tabId === 'MyProfile') {
```
- **To Uncomment**: Remove comment slashes on `} else if (tabId === 'Membership') { navigate('/membership')`.

#### C. Profile Screen Quick Actions Grid
- **Location**: inside Profile tab actions grid (around line 1560)
- **Current State**:
```javascript
                { id: 'my-profile', label: 'My Profile', icon: 'person_pin' },
                { id: 'verification', label: 'Verification', icon: 'verified_user' },
                // === [IOS-DEPLOY-COMMENT-START] Premium quick action card commented out for iOS deployment ===
                // { id: 'premium', label: 'Premium', icon: 'workspace_premium', isGold: true },
                // === [IOS-DEPLOY-COMMENT-END] ===
                { id: 'interests', label: 'Interests', icon: 'favorite', badge: '5' },
```
and navigation:
```javascript
                    if (item.id === 'my-profile') handleTabNavigate('MyProfile')
                    else if (item.id === 'verification') navigate('/verification')
                    // === [IOS-DEPLOY-COMMENT-START] Premium navigation commented out for iOS deployment ===
                    // else if (item.id === 'premium') navigate('/membership')
                    // === [IOS-DEPLOY-COMMENT-END] ===
                    else if (item.id === 'interests') handleTabNavigate('Interests')
```
- **To Uncomment**: Uncomment `{ id: 'premium', ... }` and `else if (item.id === 'premium') navigate('/membership')`.

#### D. Profile View Limit Banner "Upgrade" Button
- **Location**: inside daily view quota card (around line 2480)
- **Current State**:
```jsx
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">visibility</span>
                {matchQuota.remaining === 0
                  ? 'You have viewed all profiles included in your plan today.'
                  : `${matchQuota.remaining} of ${matchQuota.limit} profile views left today`}
              </span>
              {/* === [IOS-DEPLOY-COMMENT-START] Quota Upgrade button commented out for iOS deployment === */}
              {/* <button
                onClick={() => navigate('/membership')}
                className="px-2.5 py-1 bg-[#570013] text-amber-100 rounded-md text-[10px] font-extrabold shrink-0"
              >
                Upgrade
              </button> */}
              {/* === [IOS-DEPLOY-COMMENT-END] === */}
            </div>
```
- **To Uncomment**: Remove the `{/* */}` comment wrapping the `<button>`.

---

### 2. `frontend/src/modules/user/pages/UserFlowPage.jsx`

#### A. Lazy Screen Imports
- **Location**: top of file (around line 25)
- **Current State**:
```javascript
const ProfileDetailScreen = lazy(() => import('../components/ProfileDetailScreen'))
// === [IOS-DEPLOY-COMMENT-START] MembershipScreen and PaymentScreen imports commented out for iOS deployment ===
// const MembershipScreen = lazy(() => import('../components/MembershipScreen'))
// const PaymentScreen = lazy(() => import('../components/PaymentScreen'))
// === [IOS-DEPLOY-COMMENT-END] ===
const SettingsScreen = lazy(() => import('../components/SettingsScreen'))
```
- **To Uncomment**: Remove comment slashes from the `MembershipScreen` and `PaymentScreen` lazy import lines.

#### B. Routes Configuration
- **Location**: route list (around line 320)
- **Current State**:
```javascript
          {/* === [IOS-DEPLOY-COMMENT-START] Membership and Payment routes commented out for iOS deployment ===
          // Membership / Premium Route
          <Route
            path="/membership"
            element={
              <MembershipScreen
                onBack={() => navigate('/profile')}
                onSelectPlan={(plan, billingCycle) => {
                  setCheckout({
                    planId: plan?.id || plan?._id || plan?.planId || null,
                    billingCycle: billingCycle || 'monthly',
                  })
                  navigate('/payment')
                }}
              />
            }
          />
          <Route path="/premium" element={<Navigate to="/membership" replace />} />

          // Payment / Checkout Route
          <Route
            path="/payment"
            element={
              <PaymentScreen
                planId={checkout.planId}
                billingCycle={checkout.billingCycle}
                onBack={() => navigate('/membership')}
                onPaymentComplete={() => {
                  setHasPremium(true)
                  navigate('/profile')
                }}
              />
            }
          />
          === [IOS-DEPLOY-COMMENT-END] === */}

          {/* Safe fallback redirects for iOS while membership/payment is disabled */}
          <Route path="/membership" element={<Navigate to="/home" replace />} />
          <Route path="/premium" element={<Navigate to="/home" replace />} />
          <Route path="/payment" element={<Navigate to="/home" replace />} />
```
- **To Uncomment**:
  1. Remove the fallback redirects (`<Route path="/membership" element={<Navigate to="/home" replace />} />`, etc.).
  2. Remove the surrounding comment tags to restore the full `MembershipScreen` and `PaymentScreen` route declarations.

---

### 3. `frontend/src/modules/user/components/ProfileDetailScreen.jsx`

#### A. "See membership plans" Button
- **Location**: inside error / limit view (around line 260)
- **Current State**:
```jsx
        <div className="flex flex-col gap-3 w-full max-w-[260px]">
          {/* === [IOS-DEPLOY-COMMENT-START] 'See membership plans' button commented out for iOS deployment === */}
          {/* {hitViewLimit && (
            <button
              type="button"
              onClick={() => navigate('/membership')}
              className="w-full py-3 rounded-full bg-[#570013] text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-transform"
            >
              See membership plans
            </button>
          )} */}
          {/* === [IOS-DEPLOY-COMMENT-END] === */}
          <button
            type="button"
            onClick={() => navigate('/home')}
```
- **To Uncomment**: Remove the `{/* */}` comment wrapping `{hitViewLimit && (<button ...>)}`.

#### B. "Upgrade Membership" Button
- **Location**: inside `viewLimitReached` block (around line 440)
- **Current State**:
```jsx
            <h2 className="font-display text-lg font-bold text-[#570013]">Daily Profile View Limit Reached</h2>
            <p className="text-xs text-slate-600 font-medium">{viewLimitMessage}</p>
            {/* === [IOS-DEPLOY-COMMENT-START] 'Upgrade Membership' button commented out for iOS deployment === */}
            {/* <button
              onClick={() => navigate('/membership')}
              className="mt-2 px-5 py-2.5 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs shadow-md active:scale-95 transition"
            >
              Upgrade Membership
            </button> */}
            {/* === [IOS-DEPLOY-COMMENT-END] === */}
          </div>
```
- **To Uncomment**: Remove the `{/* */}` comment wrapping `<button onClick={() => navigate('/membership')}>`.

---

### 4. `frontend/src/modules/user/components/HelpSupportScreen.jsx`

#### A. FAQ Item for Premium Membership Plans
- **Location**: inside `faqs` list (around line 20)
- **Current State**:
```javascript
    {
      question: 'How can I download my profile as a PDF Biodata?',
      answer: 'Click on "View" or "Download" under "Your Bio Data" on the Home tab or click "Export PDF" on your My Profile page to download a neatly styled printable A4 Biodata document.',
    },
    // === [IOS-DEPLOY-COMMENT-START] Premium Membership FAQ commented out for iOS deployment ===
    // {
    //   question: 'How do Premium Membership plans work?',
    //   answer: 'Premium plans give you unlimited interest requests, priority listing in candidate searches, unlocked email and address details for verified members, and personalized matchmaking support.',
    // },
    // === [IOS-DEPLOY-COMMENT-END] ===
    {
      question: 'Is my contact phone number hidden from public view?',
```
- **To Uncomment**: Remove the comment slashes from the FAQ item object.

---

## Verification After Uncommenting
Whenever you are ready to restore subscriptions and membership, simply tell the assistant:
> *"Uncomment the subscription and membership code from ios.md"*

After uncommenting, run:
```bash
cd frontend
npm run build
```
to verify that all routes and components build cleanly without errors.
