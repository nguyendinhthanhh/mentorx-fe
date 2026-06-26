import { Link } from 'react-router-dom'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="relative z-10 flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Create an account</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">Join MentorX and start your journey</p>
      </div>

      <RegisterForm />

      <div className="mt-8 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
