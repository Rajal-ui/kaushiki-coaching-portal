'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';
import { Loader2 } from 'lucide-react';

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  status: string;
  subject: { id: string; name: string; track: { name: string } };
  faculty: { id: string; name: string };
}

export default function EnrollPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [checkoutData, setCheckoutData] = useState<{
    enrollmentId: string;
    orderId: string;
    keyId: string;
    amount: number;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'polling'>('idle');

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        setTracks(list);
        if (list.length > 0) setSelectedTrack(list[0].id);
      })
      .catch(() => setError('Failed to load tracks'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTrack) return;
    setLoading(true);
    fetch(`/api/tracks/${selectedTrack}/batches`)
      .then(r => r.json())
      .then(data => setBatches(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setError('Failed to load batches'))
      .finally(() => setLoading(false));
  }, [selectedTrack]);

  async function handleEnroll(batchId: string) {
    setEnrolling(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Enrollment failed');

      setCheckoutData({
        enrollmentId: data.enrollment.id,
        orderId: data.razorpayOrderId,
        keyId: data.razorpayKeyId,
        amount: data.amount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEnrolling(false);
    }
  }

  function handlePaymentSuccess() {
    setPaymentStatus('polling');
    const poll = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/enrollments/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const enrollments = data.data ?? [];
        const updated = enrollments.find((e: { id: string }) => e.id === checkoutData?.enrollmentId);
        if (updated?.status === 'ACTIVE') {
          clearInterval(poll);
          setPaymentStatus('success');
        }
      } catch { /* continue polling */ }
    }, 2000);

    setTimeout(() => clearInterval(poll), 60000);
  }

  function handlePaymentError(err: string) {
    setError(err);
    setCheckoutData(null);
  }

  if (paymentStatus === 'polling') {
    return (
      <ProtectedRoute allowedRoles={['STUDENT', 'PARENT']}>
        <div className="max-w-md mx-auto p-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-500">Your payment is being confirmed. This may take a moment...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <ProtectedRoute allowedRoles={['STUDENT', 'PARENT']}>
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enrollment Confirmed!</h2>
          <p className="text-gray-500 mb-6">Welcome to Kaushiki Classes. Check your dashboard for batch details.</p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'PARENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enroll in a Batch</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {checkoutData ? (
          <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Complete Payment</h2>
            <p className="text-gray-500 mb-6">Pay the enrollment fee to confirm your seat.</p>
            <RazorpayCheckout
              enrollmentId={checkoutData.enrollmentId}
              amount={checkoutData.amount}
              orderId={checkoutData.orderId}
              keyId={checkoutData.keyId}
              studentName=""
              studentEmail=""
              studentPhone=""
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            <button
              onClick={() => setCheckoutData(null)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-3"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Track</label>
              <select
                value={selectedTrack}
                onChange={e => setSelectedTrack(e.target.value)}
                className="w-full max-w-xs h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
              >
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.name.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No active batches available for this track.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {batches.map(batch => {
                  const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;
                  const isFull = batch.seatsFilled >= batch.capacity;
                  return (
                    <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-1">{batch.subject.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{batch.subject.track.name.replace(/_/g, ' ')}</p>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Capacity</span>
                          <span>{batch.seatsFilled}/{batch.capacity} ({fillPct}%)</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${fillPct >= 90 ? 'bg-amber-500' : fillPct >= 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Faculty: {batch.faculty.name}</p>
                      <p className="text-xs text-gray-500 mb-4">{batch.schedule}</p>
                      <button
                        onClick={() => handleEnroll(batch.id)}
                        disabled={enrolling || isFull}
                        className={`w-full h-10 rounded-lg font-medium text-sm transition-colors ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                      >
                        {isFull ? 'Batch Full' : enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
