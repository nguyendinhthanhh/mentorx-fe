import { Link } from 'react-router-dom'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="text-gray-500 mt-1 text-sm">Start your journey with MentorX today</p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
