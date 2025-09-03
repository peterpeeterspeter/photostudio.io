'use client';
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            store_name: storeName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        setMessage(`Registration failed: ${error.message}`);
        return;
      }

      if (data.user) {
        console.log('Signup successful:', data);
        
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed
          setMessage('Registration successful! Redirecting to your account...');
          setTimeout(() => router.push('/account'), 1000);
        } else {
          // User needs email confirmation, use magic link to complete the process
          console.log('User created but not confirmed, sending magic link...');
          
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
          });
          
          if (!magicLinkError) {
            setMessage('Account created! A login link has been sent to your email. Click the link to access your account.');
          } else {
            console.error('Magic link error:', magicLinkError);
            setMessage('Account created, but there was an issue sending the login email. Please try using the magic link login on the login page.');
          }
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Start Your Free Trial
            </h1>
            <p className="text-gray-600">
              Transform your product photos in seconds
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@boutique.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Create a secure password (min 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name (Optional)
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={storeName || ''}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Your boutique name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Start Free →'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.includes('successful') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${message.includes('successful') ? 'text-green-700' : 'text-red-700'}`}>
                {message}
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-500">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Shopify App
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              GDPR Ready
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Powered by Google AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}