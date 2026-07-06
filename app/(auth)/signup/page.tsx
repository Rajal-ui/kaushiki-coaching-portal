'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadGoogleScript } from '@/lib/google-one-tap';
import { useAuth } from '@/lib/auth/AuthContext';

const ROLE_REDIRECTS: Record<string, string> = {
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
  FACULTY: '/dashboard/faculty',
  ADMIN: '/dashboard/admin',
};

type Step = 'details' | 'otp';

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'FACULTY', label: 'Faculty' },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('STUDENT');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
                throw new Error(data.error?.message || 'Google signup failed');
              }
              const data = await res.json();
              login(data.accessToken, data.refreshToken);
              router.push(ROLE_REDIRECTS[data.user.role] || '/dashboard/student');
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
            text: 'signup_with',
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
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otpCode = otp.join('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, otp: otpCode, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Signup failed');
      }
      const data = await res.json();
      login(data.accessToken, data.refreshToken);
      router.push(ROLE_REDIRECTS[data.user.role] || '/dashboard/student');
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
      document.getElementById(`signup-otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`signup-otp-${index - 1}`)?.focus();
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-6">Join Kaushiki Classes today</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input id="name" type="text" placeholder="Your full name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-colors" required />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      role === r.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading || !name.trim() || phone.length !== 10}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or</span></div>
            </div>

            <div ref={googleBtnRef} className="flex justify-center" />

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium">+91 {phone}</span>
            </p>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input key={index} id={`signup-otp-${index}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors" required />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.some((d) => !d)}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <button type="button" onClick={() => { setStep('details'); setOtp(['', '', '', '', '', '']); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700">Change details</button>
          </form>
        )}
      </div>
    </div>
  );
}
