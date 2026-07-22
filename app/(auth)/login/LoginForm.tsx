'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadGoogleScript } from '@/lib/google-one-tap';
import { useAuth } from '@/lib/auth/AuthContext';
import { LayoutDashboard } from 'lucide-react';

const ROLE_REDIRECTS: Record<string, string> = {
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
  FACULTY: '/dashboard/faculty',
  ADMIN: '/dashboard/admin',
};

type AuthMethod = 'otp' | 'password';
type OtpStep = 'phone' | 'verify';

function safeRedirect(callbackUrl: string | null): string | null {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//') || callbackUrl.includes('\\')) {
    return null;
  }
  return callbackUrl;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [method, setMethod] = useState<AuthMethod>('otp');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const redirectTarget = safeRedirect(searchParams.get('callbackUrl'));

  useEffect(() => {
    loadGoogleScript().then(() => {
      const { google } = window as unknown as { google?: { accounts: { id: { initialize: Function; renderButton: Function } } } };
      if (google?.accounts?.id && googleBtnRef.current) {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            setLoading(true);
            setError('');
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Google login failed');
              }
              const data = await res.json();
              login(data.accessToken, data.refreshToken);
              router.push(redirectTarget || ROLE_REDIRECTS[data.user.role] || '/dashboard/student');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong');
            } finally {
              setLoading(false);
            }
          },
        });
        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 384,
            text: 'continue_with',
          });
        }
      }
    });
  }, [router]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to send OTP');
      }
      setOtpStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otpCode = otp.join('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Invalid OTP');
      }
      const data = await res.json();
      login(data.accessToken, data.refreshToken);
      router.push(redirectTarget || ROLE_REDIRECTS[data.user.role] || '/dashboard/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Login failed');
      }
      const data = await res.json();
      login(data.accessToken, data.refreshToken);
      router.push(redirectTarget || ROLE_REDIRECTS[data.user.role] || '/dashboard/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  if (isAuthenticated && user) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-500 mb-6">You are logged in as <span className="font-medium text-gray-700">{user.name}</span></p>
          <Link
            href={ROLE_REDIRECTS[user.role] || '/dashboard/student'}
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            Not {user.name}?{' '}
            <button onClick={logout} className="text-red-600 hover:underline font-medium">Logout</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-1">Sign in to your Kaushiki Classes account</p>
        <p className="text-gray-400 text-xs mb-6">Student · Parent · Faculty</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="flex border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => { setMethod('otp'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${method === 'otp' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => { setMethod('password'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${method === 'password' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Password
          </button>
        </div>

        {method === 'otp' ? (
          otpStep === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                  <input id="phone" type="tel" placeholder="9876543210" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-colors"
                    required pattern="[6-9]\d{9}" title="10-digit Indian mobile number starting with 6-9" />
                </div>
              </div>
              <button type="submit" disabled={loading || phone.length !== 10}
                className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit code sent to <span className="font-medium">+91 {phone}</span></p>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input key={index} id={`otp-${index}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors" required />
                ))}
              </div>
              <button type="submit" disabled={loading || otp.some((d) => !d)}
                className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setOtpStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700">Change phone number</button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">Email or Phone</label>
              <input id="identifier" type="text" placeholder="your@email.com or 9876543210" value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-colors" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" type="password" placeholder="Your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-colors" required />
            </div>
            <button type="submit" disabled={loading || !identifier || !password}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or</span></div>
        </div>

        <div ref={googleBtnRef} className="flex justify-center" />

        {method === 'otp' && otpStep === 'phone' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </p>
        )}
        {method === 'password' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}
