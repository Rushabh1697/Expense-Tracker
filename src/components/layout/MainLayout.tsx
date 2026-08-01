import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Tags, PiggyBank, Calendar, Settings as SettingsIcon, Wifi, WifiOff, Landmark, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function MainLayout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Bank', path: '/bank', icon: Landmark },
    { name: 'Savings', path: '/savings', icon: PiggyBank },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ]

  return (
    <div className="flex h-screen bg-background relative z-0 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-rose-600/10 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/10 blur-[120px] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Expenzo</h1>
        </div>
        <nav className="space-y-1 px-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t mt-auto space-y-4">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
            {isOnline ? (
              <><Wifi className="h-4 w-4 text-emerald-500" /> <span>Online & Synced</span></>
            ) : (
              <><WifiOff className="h-4 w-4 text-amber-500" /> <span>Offline Mode</span></>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col relative pb-16 md:pb-0 z-10 bg-transparent">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-xl sticky top-0 z-20">
          <h1 className="text-xl font-bold tracking-tight text-primary">Expenzo</h1>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {!isOnline && (
          <div className="bg-amber-500/10 text-amber-500 text-xs text-center py-1 md:hidden">
            Offline Mode
          </div>
        )}
        <div className="flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 w-full border-t bg-card flex justify-around p-3 pb-safe z-50">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
