import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh bg-white dark:bg-slate-950">
      {/* Left Panel - Visuals */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:block">
        <img 
          src="/images/auth_hero.jpg"
          alt="Mentorship Session" 
          width="1024"
          height="1024"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-1000 ease-out hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-start p-12 pt-16 text-white">
          <div className="animate-fade-in" style={{ animationDuration: '1s' }}>
            <h1 className="mb-4 text-5xl font-extrabold leading-none tracking-tighter text-white xl:text-6xl drop-shadow-lg">
              Unlock Your<br />
              <span className="text-primary-400">True Potential</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-slate-200 xl:text-lg drop-shadow-md">
              Learn from industry leaders. Accelerate your career with personalized 1-on-1 mentorship.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white dark:bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2 xl:px-12">
        <div className="w-full max-w-[440px] animate-fade-in" style={{ animationDuration: '0.6s' }}>
          
          <Link to="/" className="group mx-auto mb-8 flex min-h-11 w-fit items-center justify-center gap-3 sm:mb-10">
            <img src="/logo.png" alt="MentorX Logo" className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">MentorX</span>
          </Link>

          <Outlet />
          
          <p className="mt-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            By continuing, you agree to MentorX's <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">Terms of Service</a> and <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
