import React, { useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import SplashScreen from '../components/SplashScreen'
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
import WelcomeScreen from '../components/WelcomeScreen'

export default function UserFlowPage() {
  const navigate = useNavigate()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [hasPremium, setHasPremium] = useState(false)

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile)
    navigate('/profile-detail')
  }

  return (
    <div className="min-h-screen w-full bg-[#1b1b1b] flex justify-center items-center font-body selection:bg-[#775a19] selection:text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-[#fbf9f5] relative overflow-x-hidden shadow-2xl flex flex-col">
        <Routes>
          {/* Splash Screen */}
          <Route path="/" element={<SplashScreen onComplete={() => navigate('/auth-landing')} />} />
          <Route path="/splash" element={<SplashScreen onComplete={() => navigate('/auth-landing')} />} />

          {/* 1. Authentication Landing Page */}
          <Route
            path="/welcome"
            element={
              <AuthLandingScreen
                onStartCreate={() => navigate('/create-account')}
                onStartLogin={() => navigate('/login')}
                onGuestBrowse={() => navigate('/home')}
              />
            }
          />
          <Route
            path="/auth-landing"
            element={
              <AuthLandingScreen
                onStartCreate={() => navigate('/create-account')}
                onStartLogin={() => navigate('/login')}
                onGuestBrowse={() => navigate('/home')}
              />
            }
          />

          {/* Legacy Welcome Screen fallback */}
          <Route
            path="/welcome-legacy"
            element={
              <WelcomeScreen
                onStartOnboarding={() => navigate('/create-account')}
                onStartAuth={() => navigate('/login')}
              />
            }
          />

          {/* 2. Login Screen (OTP Only) */}
          <Route
            path="/login"
            element={
              <LoginScreen
                onBack={() => navigate('/auth-landing')}
                onSendOtp={(mobile) =>
                  navigate('/otp-verification', { state: { mobile, isNewUser: false } })
                }
              />
            }
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* 3. Create Account Screen (Minimum Info) */}
          <Route
            path="/create-account"
            element={
              <CreateAccountScreen
                onBack={() => navigate('/auth-landing')}
                onCreateAccount={(formData) =>
                  navigate('/otp-verification', {
                    state: { mobile: formData.mobile, isNewUser: true, formData },
                  })
                }
              />
            }
          />
          <Route path="/register" element={<Navigate to="/create-account" replace />} />

          {/* 4. OTP Verification Screen */}
          <Route
            path="/otp-verification"
            element={
              <OtpVerificationScreen
                onChangeNumber={() => navigate('/login')}
                onVerifySuccess={() => navigate('/account-created')}
              />
            }
          />

          {/* 5. Account Created Success Screen */}
          <Route
            path="/account-created"
            element={
              <AccountCreatedScreen
                onStartSetup={() => navigate('/profile-completion-dashboard')}
              />
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
                onSelectPlan={() => navigate('/payment')}
              />
            }
          />
          <Route path="/premium" element={<Navigate to="/membership" replace />} />

          {/* Payment / Checkout Route */}
          <Route
            path="/payment"
            element={
              <PaymentScreen
                onBack={() => navigate('/membership')}
                onPaymentComplete={() => {
                  setHasPremium(true)
                  navigate('/profile')
                }}
              />
            }
          />

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

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  )
}
