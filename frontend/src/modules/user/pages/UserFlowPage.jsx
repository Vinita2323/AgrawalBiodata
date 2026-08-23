import React, { useState } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import ScrollToTop from '../components/ScrollToTop'
import AuthLandingScreen from '../components/AuthLandingScreen'
import LoginScreen from '../components/LoginScreen'
import CreateAccountScreen from '../components/CreateAccountScreen'
import OtpVerificationScreen from '../components/OtpVerificationScreen'
import AccountCreatedScreen from '../components/AccountCreatedScreen'
import ProfileCompletionDashboardScreen from '../components/ProfileCompletionDashboardScreen'
import DashboardScreen from '../components/DashboardScreen'
import ProfileDetailScreen from '../components/ProfileDetailScreen'
import MembershipScreen from '../components/MembershipScreen'
import PaymentScreen from '../components/PaymentScreen'
import SettingsScreen from '../components/SettingsScreen'
import AccountSettingsScreen from '../components/AccountSettingsScreen'
import NotificationSettingsScreen from '../components/NotificationSettingsScreen'
import BlockedUsersScreen from '../components/BlockedUsersScreen'
import VerificationScreen from '../components/VerificationScreen'
import PartnerPreferencesScreen from '../components/PartnerPreferencesScreen'
import AboutMatrimonyHubScreen from '../components/AboutMatrimonyHubScreen'
import HelpSupportScreen from '../components/HelpSupportScreen'
import TermsOfServiceScreen from '../components/TermsOfServiceScreen'
import PrivacyPolicyScreen from '../components/PrivacyPolicyScreen'
import CommunityGuidelinesScreen from '../components/CommunityGuidelinesScreen'
import WelcomeScreen from '../components/WelcomeScreen'
import HeaderBar from '../components/HeaderBar'
import ManageProfilesScreen from '../components/ManageProfilesScreen'
import SignupOnlyRoute, { clearJustSignedUp } from '../components/SignupOnlyRoute'
import GuestOnlyRoute from '../components/GuestOnlyRoute'
import { ActiveProfileProvider } from '../../../context/ActiveProfileContext'
import { isAuthenticated } from '../../../services/authService'

// A returning visitor with a valid stored session should land on their
// dashboard, not be sent through the login screen again on every visit.
const RootRedirect = () => (
  <Navigate to={isAuthenticated() ? '/home' : '/auth-landing'} replace />
)

export default function UserFlowPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [hasPremium, setHasPremium] = useState(false)
  const [checkout, setCheckout] = useState({ planId: null, billingCycle: 'monthly' })

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile)
    navigate('/profile-detail')
  }

  return (
    <ActiveProfileProvider>
    <div className="min-h-screen w-full bg-[#1b1b1b] lg:bg-[#fbf9f5] flex justify-center items-center lg:items-stretch font-body selection:bg-[#775a19] selection:text-white">
      <ScrollToTop />
      <div className="w-full max-w-[480px] lg:max-w-none min-h-screen bg-[#fbf9f5] relative overflow-x-hidden shadow-2xl lg:shadow-none flex flex-col">
        {location.pathname !== '/welcome' && location.pathname !== '/auth-landing' && location.pathname !== '/' && location.pathname !== '/splash' && (
          <HeaderBar />
        )}
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
                  onGuestBrowse={() => navigate('/home')}
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
                  onGuestBrowse={() => navigate('/home')}
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

          {/* Membership / Premium Route */}
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

          {/* Payment / Checkout Route */}
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
            element={<TermsOfServiceScreen onBack={() => navigate('/about')} />}
          />
          <Route
            path="/privacy"
            element={<PrivacyPolicyScreen onBack={() => navigate('/about')} />}
          />
          <Route
            path="/guidelines"
            element={<CommunityGuidelinesScreen onBack={() => navigate('/about')} />}
          />

          {/* Candidate Profile Detail Route */}
          <Route
            path="/profile-detail"
            element={
              <ProfileDetailScreen
                profile={selectedProfile}
                isPremiumUser={hasPremium}
                onBack={() => navigate('/home')}
              />
            }
          />

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
      </div>
    </div>
    </ActiveProfileProvider>
  )
}
