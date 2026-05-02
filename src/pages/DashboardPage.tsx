import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import { Briefcase, BookOpen, Users, Wallet } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName || user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your account today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/jobs" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <Briefcase className="w-12 h-12 text-primary-600" />
          </div>
        </Link>

        <Link to="/courses" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Enrolled Courses</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <BookOpen className="w-12 h-12 text-primary-600" />
          </div>
        </Link>

        <Link to="/mentors" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Mentors</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <Users className="w-12 h-12 text-primary-600" />
          </div>
        </Link>

        <Link to="/wallet" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold text-gray-900">0 MXC</p>
            </div>
            <Wallet className="w-12 h-12 text-primary-600" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/jobs/create" className="btn btn-outline w-full text-left">
              Post a New Job
            </Link>
            <Link to="/mentor/profile" className="btn btn-outline w-full text-left">
              Become a Mentor
            </Link>
            <Link to="/courses" className="btn btn-outline w-full text-left">
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      </div>
    </div>
  )
}
