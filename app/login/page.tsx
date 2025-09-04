'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage('Wrong email or password. Try signing up if you don\'t have an account.')
        } else {
          setMessage(`Error: ${error.message}`)
        }
      } else if (data.user) {
        setMessage('Signed in successfully!')
        router.push('/account')
      }
    } catch (err) {
      setMessage('Unexpected error occurred')
      console.error('Login error:', err)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        {message && (
          <div className={`text-center p-3 rounded ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
        
        <p className="text-center">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}