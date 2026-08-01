import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from './lib/supabase'
import { ForceUpdateDialog } from './components/auth/ForceUpdateDialog'
import { MainLayout } from './components/layout/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Categories } from './pages/Categories'
import { Savings } from './pages/Savings'
import { CalendarView } from './pages/CalendarView'
import { Settings } from './pages/Settings'
import { Auth } from './pages/Auth'
import { Bank } from './pages/Bank'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const APP_VERSION = '1.0.0' // Update this version before building a new APK

function VersionCheck({ children }: { children: React.ReactNode }) {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [updateUrl, setUpdateUrl] = useState('')
  
  useEffect(() => {
    // Only check version on mobile app, not on the website
    if (!Capacitor.isNativePlatform()) return
    
    async function checkVersion() {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('min_version, download_url')
          .limit(1)
          .single()
          
        if (error || !data) return
        
        // Simple string comparison for versions like "1.0.0" < "1.1.0"
        // For production, consider using a semver library if complex versions are used.
        if (data.min_version > APP_VERSION) {
          setUpdateUrl(data.download_url)
          setNeedsUpdate(true)
        }
      } catch (err) {
        console.error("Failed to check app version:", err)
      }
    }
    
    checkVersion()
  }, [])
  
  if (needsUpdate) {
    return <ForceUpdateDialog updateUrl={updateUrl || 'https://myexpensetracker.com/download'} />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <VersionCheck>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="bank" element={<Bank />} />
            <Route path="savings" element={<Savings />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </VersionCheck>
    </AuthProvider>
  )
}

export default App
