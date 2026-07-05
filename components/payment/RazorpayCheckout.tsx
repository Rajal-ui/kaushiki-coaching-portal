'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayCheckoutProps {
  enrollmentId: string;
  amount: number;
  orderId: string;
  keyId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function RazorpayCheckout({
  enrollmentId,
  amount,
  orderId,
  keyId,
  studentName,
  studentEmail,
  studentPhone,
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const openCheckout = useCallback(() => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      onError('Razorpay SDK not loaded. Please check your internet connection.');
      return;
    }

    setLoading(true);

    const options: RazorpayOptions = {
      key: keyId,
      amount,
      currency: 'INR',
      name: 'Kaushiki Classes',
      description: `Enrollment #${enrollmentId.slice(0, 8)}`,
      order_id: orderId,
      handler: () => {
        onSuccess();
      },
      prefill: {
        name: studentName,
        email: studentEmail,
        contact: studentPhone,
      },
      theme: { color: '#2563EB' },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [enrollmentId, amount, orderId, keyId, studentName, studentEmail, studentPhone, onSuccess, onError]);

  return (
    <button
      type="button"
      onClick={openCheckout}
      disabled={loading}
      className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Opening Checkout...' : `Pay ₹${(amount / 100).toLocaleString('en-IN')}`}
    </button>
  );
}
