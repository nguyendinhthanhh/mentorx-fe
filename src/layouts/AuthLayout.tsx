import { Outlet, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Visuals */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:block">
        <img 
          src="/images/auth_hero.png" 
          alt="Mentorship Session" 
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-1000 ease-out hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/30 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-start p-12 pt-16 text-white">
          <div className="animate-fade-in" style={{ animationDuration: '1s' }}>
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl drop-shadow-lg">
              Unlock Your<br />
              <span className="text-primary-400">True Potential</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-slate-200 xl:text-lg drop-shadow-md">
              Learn directly from industry leaders. Build your network, accelerate your career, and achieve your goals faster with personalized 1-on-1 mentorship.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 xl:px-12">
        <div className="w-full max-w-[440px] animate-fade-in" style={{ animationDuration: '0.6s' }}>
          
          <Link to="/" className="mb-10 flex items-center gap-3 group w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-md shadow-primary-500/30 transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">MentorX</span>
          </Link>

          <Outlet />
          
          <p className="mt-8 text-center text-xs font-medium text-slate-500">
            By continuing, you agree to MentorX's <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">Terms of Service</a> and <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
