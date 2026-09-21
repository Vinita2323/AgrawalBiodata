import React, { Suspense, lazy, useState } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop'
import ErrorBoundary from '../../../components/ErrorBoundary'
import RouteFallback from '../../../components/RouteFallback'

// Loaded up front: these are the screens a cold start can land on, so splitting
// them would only put a round trip in front of the first paint.
import AuthLandingScreen from '../components/AuthLandingScreen'
import LoginScreen from '../components/LoginScreen'
import CreateAccountScreen from '../components/CreateAccountScreen'
import OtpVerificationScreen from '../components/OtpVerificationScreen'
import HeaderBar from '../components/HeaderBar'
import GuestOnlyRoute from '../components/GuestOnlyRoute'
import SignupOnlyRoute, { clearJustSignedUp } from '../components/SignupOnlyRoute'
import PushNotificationManager from '../components/PushNotificationManager'
import { ActiveProfileProvider } from '../../../context/ActiveProfileContext'
import { isAuthenticated } from '../../../services/authService'

// Everything past sign-in is split out. DashboardScreen alone is over 3,000
// lines, and none of this is needed to draw the screen a new visitor sees.
const AccountCreatedScreen = lazy(() => import('../components/AccountCreatedScreen'))
const ProfileCompletionDashboardScreen = lazy(() => import('../components/ProfileCompletionDashboardScreen'))
const DashboardScreen = lazy(() => import('../components/DashboardScreen'))
const ProfileDetailScreen = lazy(() => import('../components/ProfileDetailScreen'))
// === [IOS-DEPLOY-COMMENT-START] MembershipScreen and PaymentScreen imports commented out for iOS deployment ===
// const MembershipScreen = lazy(() => import('../components/MembershipScreen'))
// const PaymentScreen = lazy(() => import('../components/PaymentScreen'))
// === [IOS-DEPLOY-COMMENT-END] ===
const SettingsScreen = lazy(() => import('../components/SettingsScreen'))
const AccountSettingsScreen = lazy(() => import('../components/AccountSettingsScreen'))
const NotificationSettingsScreen = lazy(() => import('../components/NotificationSettingsScreen'))
const BlockedUsersScreen = lazy(() => import('../components/BlockedUsersScreen'))
const VerificationScreen = lazy(() => import('../components/VerificationScreen'))
const PartnerPreferencesScreen = lazy(() => import('../components/PartnerPreferencesScreen'))
const AboutMatrimonyHubScreen = lazy(() => import('../components/AboutMatrimonyHubScreen'))
const HelpSupportScreen = lazy(() => import('../components/HelpSupportScreen'))
const TermsOfServiceScreen = lazy(() => import('../components/TermsOfServiceScreen'))
const PrivacyPolicyScreen = lazy(() => import('../components/PrivacyPolicyScreen'))
const CommunityGuidelinesScreen = lazy(() => import('../components/CommunityGuidelinesScreen'))
const WelcomeScreen = lazy(() => import('../components/WelcomeScreen'))
const ManageProfilesScreen = lazy(() => import('../components/ManageProfilesScreen'))

const AUTH_AND_SPLASH_ROUTES = new Set([
  '/',
  '/splash',
  '/welcome',
  '/welcome-legacy',
  '/auth-landing',
  '/login',
  '/auth',
  '/otp-verification',
  '/create-account',
  '/register',
  '/account-created',
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-of-service',
  '/terms-and-conditions',
])

// A returning visitor with a valid stored session should land on their
// dashboard, not be sent through the login screen again on every visit.
const RootRedirect = () => (
  <Navigate to={isAuthenticated() ? '/home' : '/auth-landing'} replace />
)

export default function UserFlowPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasPremium, setHasPremium] = useState(false)
  const [checkout, setCheckout] = useState({ planId: null, billingCycle: 'monthly' })

  /**
   * Opens a candidate's biodata at its own address.
   *
   * The card travels in route state only so the screen can paint immediately;
   * the id in the URL is what it actually loads from, so a refresh, a shared
   * link and a notification tap all resolve to the same real profile.
   */
  const handleSelectProfile = (profile) => {
    const id = profile?.profileId || profile?._id || profile?.id
    if (!id) return
    navigate(`/profile/${id}`, { state: { card: profile } })
  }

  const currentPath = location.pathname.endsWith('/') && location.pathname.length > 1
    ? location.pathname.slice(0, -1)
    : location.pathname

  const showHeaderBar = !AUTH_AND_SPLASH_ROUTES.has(currentPath)

  return (
    <ActiveProfileProvider>
    <div className="min-h-screen w-full bg-[#1b1b1b] lg:bg-[#fbf9f5] flex justify-center items-center lg:items-stretch font-body selection:bg-[#775a19] selection:text-white">
      <ScrollToTop />
      <PushNotificationManager />
      <div className="w-full max-w-[480px] lg:max-w-none min-h-screen bg-[#fbf9f5] relative overflow-x-hidden shadow-2xl lg:shadow-none flex flex-col">
        {showHeaderBar && (
          <HeaderBar />
        )}
        {/*
          A screen-level net, inside the chrome so the header survives a screen
          that dies. Keyed on the path so recovering on one route does not leave
          the boundary latched open on the next.
        */}
        <ErrorBoundary key={location.pathname} variant="screen">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Root and splash go to the dashboard if already logged in, otherwise auth landing */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/splash" element={<RootRedirect />} />

          {/* 1. Authentication Landing Page */}
          <Route
            path="/welcome"
            element={
              <GuestOnlyRoute>
                <AuthLandingScreen
                  onStartCreate={() => navigate('/create-account')}
                  onStartLogin={() => navigate('/login')}
                />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/auth-landing"
            element={
              <GuestOnlyRoute>
                <AuthLandingScreen
                  onStartCreate={() => navigate('/create-account')}
                  onStartLogin={() => navigate('/login')}
                />
              </GuestOnlyRoute>
            }
          />

          {/* Legacy Welcome Screen fallback */}
          <Route
            path="/welcome-legacy"
            element={
              <GuestOnlyRoute>
                <WelcomeScreen
                  onStartOnboarding={() => navigate('/create-account')}
                  onStartAuth={() => navigate('/login')}
                />
              </GuestOnlyRoute>
            }
          />

          {/* 2. Login Screen (OTP Only) */}
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <LoginScreen
                  onBack={() => navigate('/auth-landing')}
                  onSendOtp={(mobile) =>
                    navigate('/otp-verification', { state: { mobile, isNewUser: false } })
                  }
                />
              </GuestOnlyRoute>
            }
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* 3. Create Account Screen (Minimum Info) */}
          <Route
            path="/create-account"
            element={
              <GuestOnlyRoute>
                <CreateAccountScreen
                  onBack={() => navigate('/auth-landing')}
                  onCreateAccount={(formData) =>
                    navigate('/otp-verification', {
                      state: { mobile: formData.mobile, isNewUser: true, formData },
                    })
                  }
                />
              </GuestOnlyRoute>
            }
          />
          <Route path="/register" element={<Navigate to="/create-account" replace />} />

          {/* 4. OTP Verification Screen */}
          <Route
            path="/otp-verification"
            element={
              <OtpVerificationScreen
                onChangeNumber={() => navigate('/login')}
                onVerifySuccess={({ isNewUser, needsProfile, formData } = {}) => {
                  if (isNewUser) {
                    navigate('/account-created', { replace: true, state: { formData } })
                  } else {
                    // A returning account with no biodata yet goes to setup;
                    // /home would only show an empty dashboard.
                    navigate(needsProfile ? '/profile-completion-dashboard' : '/home', {
                      replace: true,
                    })
                  }
                }}
              />
            }
          />

          {/* 5. Account Created Success Screen */}
          <Route
            path="/account-created"
            element={
              <SignupOnlyRoute>
                <AccountCreatedScreen
                  onStartSetup={() => {
                    clearJustSignedUp()
                    navigate('/profile-completion-dashboard', { replace: true })
                  }}
                />
              </SignupOnlyRoute>
            }
          />

          {/* 6. Profile Completion Dashboard Screen */}
          <Route
            path="/profile-completion-dashboard"
            element={
              <ProfileCompletionDashboardScreen
                onContinue={() => navigate('/home')}
                onSkip={() => navigate('/home')}
              />
            }
          />
          <Route
            path="/onboarding"
            element={<Navigate to="/profile-completion-dashboard" replace />}
          />

          {/* Core Dashboard App Routes */}
          <Route
            path="/home"
            element={
              <DashboardScreen
                initialTab="Home"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/auth-landing')}
              />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />

          <Route
            path="/matches"
            element={
              <DashboardScreen
                initialTab="Matches"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

          <Route
            path="/search"
            element={
              <DashboardScreen
                initialTab="Search"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

          <Route
            path="/interests"
            element={
              <DashboardScreen
                initialTab="Interests"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

          <Route
            path="/chat"
            element={
              <DashboardScreen
                initialTab="Messages"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />
          <Route path="/messages" element={<Navigate to="/chat" replace />} />

          <Route
            path="/profile"
            element={
              <DashboardScreen
                initialTab="Profile"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

          <Route
            path="/notifications"
            element={
              <DashboardScreen
                initialTab="Notifications"
                onSelectProfile={handleSelectProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

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

          {/* Help & Support Route */}
          <Route
            path="/help-support"
            element={<HelpSupportScreen onBack={() => navigate('/profile')} />}
          />
          <Route path="/support" element={<Navigate to="/help-support" replace />} />
          <Route path="/help" element={<Navigate to="/help-support" replace />} />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <SettingsScreen
                onBack={() => navigate('/profile')}
                onLogout={() => navigate('/login')}
              />
            }
          />

          <Route
            path="/account"
            element={<AccountSettingsScreen onBack={() => navigate('/settings')} />}
          />
          <Route
            path="/notification"
            element={<NotificationSettingsScreen onBack={() => navigate('/settings')} />}
          />
          <Route
            path="/blocked"
            element={<BlockedUsersScreen onBack={() => navigate('/settings')} />}
          />

          {/* KYC Verification Submission */}
          <Route
            path="/verification"
            element={<VerificationScreen onBack={() => navigate('/profile')} />}
          />
          <Route path="/get-verified" element={<Navigate to="/verification" replace />} />

          {/* Partner Preferences (drives match filtering) */}
          <Route
            path="/preferences"
            element={<PartnerPreferencesScreen onBack={() => navigate('/settings')} />}
          />
          <Route path="/partner-preferences" element={<Navigate to="/preferences" replace />} />
          <Route
            path="/about"
            element={<AboutMatrimonyHubScreen onBack={() => navigate('/settings')} />}
          />
          <Route
            path="/terms"
            element={
              <TermsOfServiceScreen
                onBack={() => {
                  if (window.history.length > 1) navigate(-1)
                  else navigate(isAuthenticated() ? '/home' : '/welcome')
                }}
              />
            }
          />
          <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />

          <Route
            path="/privacy"
            element={
              <PrivacyPolicyScreen
                onBack={() => {
                  if (window.history.length > 1) navigate(-1)
                  else navigate(isAuthenticated() ? '/home' : '/welcome')
                }}
              />
            }
          />
          <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
          <Route
            path="/guidelines"
            element={<CommunityGuidelinesScreen onBack={() => navigate('/about')} />}
          />

          {/*
            Candidate biodata, addressed by id.
            This used to sit at a fixed /profile-detail with the candidate held
            in React state, so a refresh, a shared link or a notification tap all
            arrived with nothing to show and fell back to placeholder content.
          */}
          <Route
            path="/profile/:profileId"
            element={<ProfileDetailScreen isPremiumUser={hasPremium} onBack={() => navigate(-1)} />}
          />
          {/* Old address: nothing here identifies a candidate, so start over. */}
          <Route path="/profile-detail" element={<Navigate to="/home" replace />} />

          {/* Multi-Profile Management (a parent running biodata for
              more than one child) */}
          <Route
            path="/profiles"
            element={<ManageProfilesScreen onBack={() => navigate('/profile')} />}
          />
          <Route
            path="/profiles/new"
            element={
              <ProfileCompletionDashboardScreen
                isNewProfile
                onContinue={() => navigate('/home')}
                onSkip={() => navigate('/profiles')}
              />
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>
    </div>
    </ActiveProfileProvider>
  )
}
