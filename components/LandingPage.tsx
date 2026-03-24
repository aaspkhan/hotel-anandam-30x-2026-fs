import React, { useState } from 'react';
import { supabase } from '../supabase';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // Ensure we redirect back to the current origin accurately
      const redirectUrl = window.location.origin;
      console.log("Redirecting to:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Verification email resent! Please check your spam folder too.' });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setResending(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      setIsForgotPassword(false);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    let errorText = error.message || 'An unexpected error occurred.';
    
    if (!errorText.includes('Incorrect email') && 
        !errorText.includes('Rate limit') && 
        !errorText.includes('confirmed')) {
      console.warn('Auth System Error:', error);
    }

    if (errorText === 'Load failed' || errorText === 'Failed to fetch') {
      errorText = 'Network error: Unable to connect. Please check your internet connection.';
    }
    
    setMessage({ type: 'error', text: errorText });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!email || !password || (isSignUp && !fullName)) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: `https://i.pravatar.cc/150?u=${email}`
            }
          }
        });
        
        if (error) {
          if (error.status === 429) {
            setMessage({ type: 'error', text: 'Rate limit exceeded. Please wait a few minutes.' });
            setLoading(false);
            return;
          }
          throw error;
        }
        
        if (data.user) {
          if (!data.session) {
            setMessage({ 
              type: 'success', 
              text: `Confirmation email sent to ${email}. You must activate your account via the link in your email.` 
            });
          } else {
            setMessage({ type: 'success', text: 'Registration successful! Logging you in...' });
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('confirm your email') || error.message.includes('Email not confirmed')) {
            setMessage({ type: 'error', text: 'Email not confirmed. Please check your inbox for the activation link.' });
            setLoading(false);
            return;
          }
          if (error.message.includes('Invalid login credentials')) {
            setMessage({ type: 'error', text: 'Incorrect email or password.' });
            setLoading(false);
            return;
          }
          throw error;
        }
        
        if (data.user) {
          setMessage({ type: 'success', text: 'Welcome back to Hotel Anandam!' });
        }
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden text-gray-800">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 text-white rounded-3xl shadow-xl shadow-orange-200 mb-6">
            <i className="fas fa-utensils text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Hotel Anandam</h1>
          <p className="text-gray-500 font-medium italic">
            {isForgotPassword 
              ? 'Reset Password' 
              : isSignUp 
                ? 'Join our food community' 
                : 'Premium Food Delivery, Madurai'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50">
          {message?.type === 'success' && (isSignUp || isForgotPassword) ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-envelope-open-text text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-3">Check Your Email</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                {message.text}
              </p>
              
              <div className="space-y-3">
                {isSignUp && (
                  <button 
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="w-full bg-white border-2 border-orange-500 text-orange-600 py-3 rounded-2xl font-bold hover:bg-orange-50 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {resending ? <i className="fas fa-spinner animate-spin mr-2"></i> : <i className="fas fa-redo mr-2 text-xs"></i>}
                    Resend Verification Email
                  </button>
                )}
                <button 
                  onClick={() => { setMessage(null); setIsForgotPassword(false); setIsSignUp(false); }}
                  className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg hover:bg-orange-600 transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isForgotPassword && (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 py-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] mb-6 disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                    <span className="font-bold text-gray-700">Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center mb-6">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Or Secure Login</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>
                </>
              )}

              <form onSubmit={isForgotPassword ? handlePasswordReset : handleAuth} className="space-y-4">
                {isSignUp && !isForgotPassword && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all font-medium text-gray-800"
                  />
                </div>
                
                {!isForgotPassword && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                      {!isSignUp && (
                        <button 
                          type="button"
                          onClick={() => { setIsForgotPassword(true); setMessage(null); }}
                          className="text-[10px] font-bold text-orange-500 hover:underline uppercase tracking-wide"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                )}
                
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <i className="fas fa-spinner animate-spin"></i>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                {isForgotPassword ? (
                  <button
                    onClick={() => { setIsForgotPassword(false); setMessage(null); }}
                    className="text-gray-500 text-sm font-bold hover:text-gray-800"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm font-medium">
                    {isSignUp ? 'Already a member?' : "Don't have an account?"}
                    <button
                      onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                      className="ml-2 text-orange-500 font-bold hover:underline"
                    >
                      {isSignUp ? 'Sign In' : 'Register now'}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {message?.type === 'error' && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium text-center border border-red-100 animate-in slide-in-from-top-2">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {message.text}
              {message.text.includes('confirm') && (
                <button 
                  onClick={handleResendEmail}
                  className="block mx-auto mt-2 text-orange-600 font-bold hover:underline"
                >
                  Resend Confirmation
                </button>
              )}
            </div>
          )}
        </div>
        

      </div>
    </div>
  );
};

export default LandingPage;