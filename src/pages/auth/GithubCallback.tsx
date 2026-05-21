import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { Loader2 } from 'lucide-react'

export default function GithubCallback() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      window.opener?.postMessage(
        { type: 'github-login-result', error: 'No authorization code received from GitHub.' },
        window.location.origin
      )
      window.close()
      return
    }

    authApi.githubLogin(code)
      .then((response) => {
        window.opener?.postMessage(
          { type: 'github-login-result', payload: response },
          window.location.origin
        )
        window.close()
      })
      .catch((err: any) => {
        window.opener?.postMessage(
          { type: 'github-login-result', error: err.response?.data?.message || 'GitHub login failed. Please try again.' },
          window.location.origin
        )
        window.close()
      })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Signing in with GitHub...</p>
      </div>
    </div>
  )
}
