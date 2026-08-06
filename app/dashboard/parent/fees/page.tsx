'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChildSelector, useParentChild } from '../components/ChildSelector';
import { Loader2, IndianRupee, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Enrollment {
  id: string;
  enrolledAt: string;
  batch: {
    id: string;
    subject: { name: string; track: { name: string } };
    faculty: { name: string };
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
  } | null;
}

const PAYMENT_STATUS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  COMPLETED: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-700 bg-green-50 border-green-200', label: 'Paid' },
  PENDING: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Pending' },
  FAILED: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-700 bg-red-50 border-red-200', label: 'Failed' },
  REFUNDED: { icon: <IndianRupee className="w-4 h-4" />, color: 'text-purple-700 bg-purple-50 border-purple-200', label: 'Refunded' },
};

export default function ParentFeesPage() {
  const { links, selectedChild, setSelectedChild, loading: childLoading } = useParentChild();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/enrollments/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setEnrollments(d.data ?? []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [selectedChild]);

  const totalPaid = enrollments.reduce((sum, e) => sum + (e.payment?.status === 'COMPLETED' ? e.payment.amount : 0), 0);
  const totalPending = enrollments.reduce((sum, e) => sum + (e.payment?.status === 'PENDING' ? e.payment.amount : 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + (!e.payment ? 1500 : e.payment.status === 'FAILED' ? e.payment.amount : 0), 0);

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track fee payments for your child.</p>
        </div>

        {childLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No children linked yet.
          </div>
        ) : (
          <>
            <ChildSelector links={links} selectedChild={selectedChild} onSelect={setSelectedChild} />

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : enrollments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <IndianRupee className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No enrollments found</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">Due</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Fee Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-5 py-4 font-semibold text-gray-600">Subject</th>
                          <th className="text-left px-5 py-4 font-semibold text-gray-600">Track</th>
                          <th className="text-left px-5 py-4 font-semibold text-gray-600">Faculty</th>
                          <th className="text-right px-5 py-4 font-semibold text-gray-600">Amount</th>
                          <th className="text-center px-5 py-4 font-semibold text-gray-600">Status</th>
                          <th className="text-left px-5 py-4 font-semibold text-gray-600">Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map(e => {
                          const ps = e.payment?.status ? PAYMENT_STATUS[e.payment.status] : null;
                          return (
                            <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-5 py-4 font-medium text-gray-900">{e.batch.subject.name}</td>
                              <td className="px-5 py-4 text-gray-600">{e.batch.subject.track.name.replace(/_/g, ' ')}</td>
                              <td className="px-5 py-4 text-gray-600">{e.batch.faculty.name}</td>
                              <td className="px-5 py-4 text-right font-medium text-gray-900">
                                {e.payment ? `₹${e.payment.amount.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="px-5 py-4 text-center">
                                {ps ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ps.color}`}>
                                    {ps.icon} {ps.label}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    <IndianRupee className="w-3 h-3" /> No payment
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-gray-500 text-xs">
                                {new Date(e.enrolledAt).toLocaleDateString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Paid</span>
                    <span className="text-lg font-bold text-gray-900">₹{totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
