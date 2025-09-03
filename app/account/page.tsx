import { createSupabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
              <p className="text-white/70">Manage your Photostudio.io subscription and preferences</p>
            </div>
            <Link 
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 transition-colors"
            >
              ← Back to Editor
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Account Info */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-white/60 text-sm">Email Address</label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-white/60 text-sm">Current Plan</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-white font-medium capitalize">{profile?.plan || 'free'}</p>
                    {profile?.plan !== 'free' && (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        Active
                      </span>
                    )}
                  </div>
                  {profile?.current_period_end && (
                    <p className="text-white/60 text-sm mt-1">
                      Renews on {new Date(profile.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription Plans</h2>
              
              {profile?.plan === 'free' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-500/30">
                    <h3 className="text-white font-semibold mb-2">Pro Plan - $19/month</h3>
                    <ul className="text-white/80 text-sm space-y-1 mb-3">
                      <li>• Unlimited AI edits</li>
                      <li>• Advanced batch processing</li>
                      <li>• Priority processing</li>
                      <li>• Premium templates</li>
                    </ul>
                    <form action="/api/stripe/checkout" method="POST">
                      <input type="hidden" name="price" value="pro_monthly" />
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                      >
                        Upgrade to Pro
                      </button>
                    </form>
                  </div>

                  <div className="bg-gradient-to-r from-gold-600/20 to-orange-600/20 rounded-lg p-4 border border-orange-500/30">
                    <h3 className="text-white font-semibold mb-2">Agency Plan - $49/month</h3>
                    <ul className="text-white/80 text-sm space-y-1 mb-3">
                      <li>• Everything in Pro</li>
                      <li>• Team collaboration</li>
                      <li>• API access</li>
                      <li>• White-label options</li>
                    </ul>
                    <form action="/api/stripe/checkout" method="POST">
                      <input type="hidden" name="price" value="agency_monthly" />
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all"
                      >
                        Upgrade to Agency
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {profile?.plan !== 'free' && (
                <div className="space-y-4">
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <p className="text-green-300 font-medium">You're subscribed to the {profile?.plan} plan</p>
                    <p className="text-white/70 text-sm mt-1">Enjoying all premium features</p>
                  </div>
                  
                  <form action="/api/stripe/portal" method="POST">
                    <button 
                      type="submit"
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold border border-white/20 transition-colors"
                    >
                      Manage Billing & Subscription
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Usage This Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">-</div>
                <div className="text-white/60 text-sm">Images Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">-</div>
                <div className="text-white/60 text-sm">Batch Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">-</div>
                <div className="text-white/60 text-sm">API Calls</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}