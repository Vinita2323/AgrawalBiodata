import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, AdminProtectedRoute } from '../context/AdminAuthContext'

// Admin Page Imports
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import UserManagementPage from '../pages/UserManagementPage'
import UserDetailPage from '../pages/UserDetailPage'
import ProfileVerificationPage from '../pages/ProfileVerificationPage'
import VerificationDetailPage from '../pages/VerificationDetailPage'
import MatchManagementPage from '../pages/MatchManagementPage'
import SubscriptionManagementPage from '../pages/SubscriptionManagementPage'
import PaymentManagementPage from '../pages/PaymentManagementPage'
import ComplaintManagementPage from '../pages/ComplaintManagementPage'
import LegalManagementPage from '../pages/LegalManagementPage'
import NotificationsPage from '../pages/NotificationsPage'
import AdminSettingsPage from '../pages/AdminSettingsPage'

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Admin Login Route */}
        <Route path="login" element={<AdminLoginPage />} />

        {/* Root Admin Redirect */}
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admin Auth Alias Redirect */}
        <Route path="auth/*" element={<Navigate to="/admin/login" replace />} />

        {/* 1. Dashboard Module */}
        <Route
          path="dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />

        {/* 2. User Management Module */}
        <Route
          path="users"
          element={
            <AdminProtectedRoute>
              <UserManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="users/:userId"
          element={
            <AdminProtectedRoute>
              <UserDetailPage />
            </AdminProtectedRoute>
          }
        />

        {/* 3. Profile Verification Module */}
        <Route
          path="profile-verification"
          element={
            <AdminProtectedRoute>
              <ProfileVerificationPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="profile-verification/:verificationId"
          element={
            <AdminProtectedRoute>
              <VerificationDetailPage />
            </AdminProtectedRoute>
          }
        />

        {/* 4. Match Management Module */}
        <Route
          path="matches"
          element={
            <AdminProtectedRoute>
              <MatchManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* 5. Subscription Management Module */}
        <Route
          path="subscriptions"
          element={
            <AdminProtectedRoute>
              <SubscriptionManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* 6. Payment Management Module */}
        <Route
          path="payments"
          element={
            <AdminProtectedRoute>
              <PaymentManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* 7. Complaint Management Module */}
        <Route
          path="complaints"
          element={
            <AdminProtectedRoute>
              <ComplaintManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* 8. Legal & Policy Pages Module */}
        <Route
          path="legal"
          element={
            <AdminProtectedRoute>
              <LegalManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* 9. System Notifications Center */}
        <Route
          path="notifications"
          element={
            <AdminProtectedRoute>
              <NotificationsPage />
            </AdminProtectedRoute>
          }
        />

        {/* 10. Admin Account Settings */}
        <Route
          path="settings"
          element={
            <AdminProtectedRoute>
              <AdminSettingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
