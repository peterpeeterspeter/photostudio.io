import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Simple auth functions
export const signUp = async (email: string, password: string, storeName?: string) => {
  // First try to sign up
  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        store_name: storeName || '',
      }
    }
  })
  
  // If signup successful but no session, immediately sign in
  if (signUpResult.data.user && !signUpResult.data.session) {
    console.log('User created, now signing in...')
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return signInResult
  }
  
  return signUpResult
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}