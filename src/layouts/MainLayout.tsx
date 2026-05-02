import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Home, Briefcase, BookOpen, Users, Wallet, User, LogOut } from 'lucide-react'

export default function MainLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                MentorX
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-primary-600">
                <Home className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <Link to="/mentors" className="flex items-center text-gray-700 hover:text-primary-600">
                <Users className="w-4 h-4 mr-1" />
                Mentors
              </Link>
              <Link to="/jobs" className="flex items-center text-gray-700 hover:text-primary-600">
                <Briefcase className="w-4 h-4 mr-1" />
                Jobs
              </Link>
              <Link to="/courses" className="flex items-center text-gray-700 hover:text-primary-600">
                <BookOpen className="w-4 h-4 mr-1" />
                Courses
              </Link>
              <Link to="/wallet" className="flex items-center text-gray-700 hover:text-primary-600">
                <Wallet className="w-4 h-4 mr-1" />
                Wallet
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link to="/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                <User className="w-5 h-5 mr-2" />
                <span className="hidden md:inline">{user?.displayName || user?.fullName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2026 MentorX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
