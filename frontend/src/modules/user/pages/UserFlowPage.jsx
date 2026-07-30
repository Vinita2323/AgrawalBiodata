import React, { useState } from 'react'
import SplashScreen from '../components/SplashScreen'
import WelcomeScreen from '../components/WelcomeScreen'
import OnboardingScreen from '../components/OnboardingScreen'
import AuthScreen from '../components/AuthScreen'
import DashboardScreen from '../components/DashboardScreen'
import ProfileDetailScreen from '../components/ProfileDetailScreen'

export default function UserFlowPage() {
  // 'splash' | 'welcome' | 'onboarding' | 'auth' | 'dashboard' | 'profileDetail'
  const [currentScreen, setCurrentScreen] = useState('splash')
  const [selectedProfile, setSelectedProfile] = useState(null)

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile)
    setCurrentScreen('profileDetail')
  }

  return (
    <div className="min-h-screen w-full bg-[#1b1b1b] flex justify-center items-center font-body selection:bg-[#775a19] selection:text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-[#fbf9f5] relative overflow-x-hidden shadow-2xl flex flex-col">
        {/* Active Screen Flow */}
        {currentScreen === 'splash' && (
          <SplashScreen onComplete={() => setCurrentScreen('welcome')} />
        )}

        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStartOnboarding={() => setCurrentScreen('onboarding')}
            onStartAuth={() => setCurrentScreen('auth')}
          />
        )}

        {currentScreen === 'onboarding' && (
          <OnboardingScreen
            onFinish={() => setCurrentScreen('auth')}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen
            onBack={() => setCurrentScreen('welcome')}
            onSuccess={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onSelectProfile={handleSelectProfile}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'profileDetail' && (
          <ProfileDetailScreen
            profile={selectedProfile}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </div>
    </div>
  )
}
