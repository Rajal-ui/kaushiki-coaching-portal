'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLE_REDIRECTS: Record<string, string> = {
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
  FACULTY: '/dashboard/faculty',
  ADMIN: '/dashboard/admin',
};

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      const redirect = ROLE_REDIRECTS[data.user.role] || '/dashboard/student';
      router.push(redirect);
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
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-6">Sign in to your Kaushiki Classes account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base transition-colors"
                  required
                  pattern="[6-9]\d{9}"
                  title="10-digit Indian mobile number starting with 6-9"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium">+91 {phone}</span>
            </p>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                  required
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
