'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'

export default function Account() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Account Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Store Name:</strong> {user.user_metadata?.store_name || 'Not set'}</p>
            <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="mt-8 bg-green-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Authentication Working!</h2>
          <p className="text-green-700">
            You've successfully signed in to your Photostudio.io account.
          </p>
        </div>
      </div>
    </div>
  )
}