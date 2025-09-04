'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signIn } from '@/lib/auth'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await signUp(email, password, storeName)
      
      if (error) {
        if (error.message.includes('User already registered')) {
          // User exists, try to sign in
          setMessage('Account exists, trying to sign in...')
          const { data: signInData, error: signInError } = await signIn(email, password)
          if (signInError) {
            setMessage(`Sign in failed: ${signInError.message}`)
          } else {
            setMessage('Signed in successfully!')
            router.push('/account')
          }
        } else if (error.message.includes('invalid')) {
          setMessage('Please use a real email address (e.g., you@gmail.com)')
        } else {
          setMessage(`Error: ${error.message}`)
        }
      } else if (data.user && data.session) {
        setMessage('Account created and signed in!')
        router.push('/account')
      } else if (data.user) {
        setMessage('Account created successfully!')
        router.push('/account')
      }
    } catch (err) {
      setMessage('Unexpected error occurred')
      console.error('Signup error:', err)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <h2 className="text-3xl font-bold text-center">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Store Name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          
          <input
            type="email"
            placeholder="Email (use real address like you@gmail.com)"
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
            minLength={6}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}